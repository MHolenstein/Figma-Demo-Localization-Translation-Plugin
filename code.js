figma.showUI(__html__, { width: 480, height: 650 });

function normalize(str) {
  return str
    .trim()
    .split(String.fromCharCode(0x2028)).join('\n')  // soft return → \n
    .split(String.fromCharCode(0x2029)).join('\n')  // paragraph separator → \n
    .split(String.fromCharCode(0x00A0)).join(' ')   // non-breaking space → regular space
    .replace(/ {2,}/g, ' ');                        // collapse multiple spaces
}

figma.ui.onmessage = async (msg) => {
  if (msg.type === "replace") {
    const results = await replaceText(msg.translations);
    highlightChangedNodes(results.changedNodeIds);
    figma.ui.postMessage(Object.assign({ type: "done" }, results));
  }

  if (msg.type === "navigate") {
    await navigateToLayer(msg.layerId);
  }

  if (msg.type === "clear-highlights") {
    clearHighlights();
  }

  if (msg.type === "cancel") {
    figma.closePlugin();
  }
};

async function navigateToLayer(layerId) {
  const node = figma.getNodeById(layerId);
  if (!node) {
    figma.ui.postMessage({ type: "navigate-result", ok: false });
    return;
  }
  // Walk up to find the page this node lives on
  let page = node;
  while (page && page.type !== "PAGE") page = page.parent;
  if (page && page.type === "PAGE" && page !== figma.currentPage) {
    figma.currentPage = page;
  }
  try {
    figma.currentPage.selection = [node];
    figma.viewport.scrollAndZoomIntoView([node]);
    figma.ui.postMessage({ type: "navigate-result", ok: true });
  } catch (e) {
    figma.ui.postMessage({ type: "navigate-result", ok: false });
  }
}

async function replaceText(translations) {
  // Rows with a layer_id get direct lookup; rows without fall back to text-matching.
  const idRows   = translations.filter(function(r) { return r.layer_id; });
  const textRows = translations.filter(function(r) { return !r.layer_id; });

  const map = new Map();
  for (const row of textRows) {
    if (row.source && row.target) map.set(normalize(row.source), row);
  }
  const matched = new Set();

  // Pre-fetch text nodes only when text-matching is needed (avoids the scan for pure id-targeted runs)
  const allNodes = map.size > 0
    ? figma.currentPage.findAllWithCriteria({ types: ["TEXT"] })
    : [];
  const totalWork = idRows.length + allNodes.length;
  let progress = 0;

  let replaced = 0;
  let skipped  = 0;
  const log = [];
  const changedNodeIds = [];

  // ── Layer-ID targeted replacements ───────────────────────────────────────
  for (const row of idRows) {
    const node = figma.getNodeById(row.layer_id);
    if (!node || node.type !== "TEXT") {
      skipped++;
      log.push({ status: "error", from: row.source || row.layer_id, error: "Layer not found", layer: row.layer_name || "" });
    } else {
      const before = node.characters;
      try {
        await figma.loadFontAsync(node.fontName === figma.mixed ? { family: "Inter", style: "Regular" } : node.fontName);
        const fonts = node.getRangeAllFontNames(0, node.characters.length);
        for (const f of fonts) await figma.loadFontAsync(f);
        node.characters = row.target;
        replaced++;
        changedNodeIds.push(node.id);
        log.push({ status: "replaced", from: before, to: row.target, layer: row.layer_name || node.name });
      } catch (e) {
        skipped++;
        log.push({ status: "error", from: before, error: e.message, layer: row.layer_name || node.name });
      }
    }
    figma.ui.postMessage({ type: "progress", current: ++progress, total: totalWork || 1 });
  }

  // ── Text-match replacements (preserves original behavior exactly) ─────────
  for (let i = 0; i < allNodes.length; i++) {
    const node     = allNodes[i];
    const original = normalize(node.characters);
    if (map.has(original)) {
      const row = map.get(original);
      await figma.loadFontAsync(node.fontName === figma.mixed ? { family: "Inter", style: "Regular" } : node.fontName);
      try {
        const fonts = node.getRangeAllFontNames(0, node.characters.length);
        for (const f of fonts) await figma.loadFontAsync(f);
        node.characters = row.target;
        matched.add(original);
        replaced++;
        changedNodeIds.push(node.id);
        log.push({ status: "replaced", from: original, to: row.target, layer: node.name });
      } catch (e) {
        skipped++;
        log.push({ status: "error", from: original, error: e.message, layer: node.name });
      }
    }
    figma.ui.postMessage({ type: "progress", current: ++progress, total: totalWork });
  }

  var notFound = [];
  map.forEach(function(row, k) {
    if (!matched.has(k)) notFound.push(row.source);
  });
  return { replaced, skipped, log, notFound, changedNodeIds };
}

const HIGHLIGHT_GROUP_NAME = "Change Tracking Highlights";

function highlightChangedNodes(nodeIds) {
  if (!nodeIds || nodeIds.length === 0) return;
  clearHighlights();

  const rects = [];
  for (const id of nodeIds) {
    const node = figma.getNodeById(id);
    if (!node || !node.absoluteBoundingBox) continue;
    const { x, y, width, height } = node.absoluteBoundingBox;

    const rect = figma.createRectangle();
    rect.x = x;
    rect.y = y;
    rect.resize(width, height);
    rect.fills = [{ type: "SOLID", color: { r: 0.094, g: 0.627, b: 0.984 }, opacity: 0.08 }];
    rect.strokes = [{ type: "SOLID", color: { r: 0.094, g: 0.627, b: 0.984 }, opacity: 1 }];
    rect.strokeWeight = 2;
    rect.strokeAlign = "OUTSIDE";
    rect.name = "highlight";
    rects.push(rect);
  }

  if (rects.length === 0) return;
  const group = figma.group(rects, figma.currentPage);
  group.name = HIGHLIGHT_GROUP_NAME;
  group.locked = true;
}

function clearHighlights() {
  const existing = figma.currentPage.findOne(n => n.name === HIGHLIGHT_GROUP_NAME);
  if (existing) existing.remove();
}

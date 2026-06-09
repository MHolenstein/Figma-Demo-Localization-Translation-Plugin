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

// Load every font used in a text node so Figma allows character-level edits.
async function loadAllFonts(node) {
  if (node.characters.length > 0) {
    const fonts = node.getRangeAllFontNames(0, node.characters.length);
    for (const f of fonts) await figma.loadFontAsync(f);
  } else if (node.fontName !== figma.mixed) {
    await figma.loadFontAsync(node.fontName);
  } else {
    await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  }
}

// Replace the first occurrence of `source` inside the node's text with `target`,
// preserving all existing character-level styling outside the replaced range.
async function applySubstringReplacement(node, source, target) {
  if (!source) return { ok: false, error: "Empty source substring" };

  const text = node.characters;
  const idx = text.indexOf(source);
  if (idx === -1) return { ok: false, error: "Source substring not found in node" };

  try {
    // All fonts must be loaded before any character-level mutation.
    if (text.length > 0) {
      const fonts = node.getRangeAllFontNames(0, text.length);
      for (const f of fonts) await figma.loadFontAsync(f);
    }
    // Insert target at idx BEFORE deleting source so "BEFORE" picks up the
    // style of the character currently at idx (the first character of source).
    if (target.length > 0) {
      node.insertCharacters(idx, target, "BEFORE");
    }
    node.deleteCharacters(idx + target.length, idx + target.length + source.length);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function replaceText(translations) {
  const idRows   = translations.filter(function(r) { return r.layer_id; });
  const textRows = translations.filter(function(r) { return !r.layer_id; });

  // Text-match rows split by mode: translation uses normalized exact-match;
  // localization uses substring containment search.
  const translationTextRows  = textRows.filter(function(r) { return r.mode !== "localization"; });
  const localizationTextRows = textRows.filter(function(r) { return r.mode === "localization"; });

  const translationMap = new Map();
  for (const row of translationTextRows) {
    if (row.source && row.target) translationMap.set(normalize(row.source), row);
  }
  const translationMatched = new Set();
  const localizationTextMatchedIdx = new Set();

  const needsScan = translationMap.size > 0 || localizationTextRows.length > 0;
  const allNodes = needsScan
    ? figma.currentPage.findAllWithCriteria({ types: ["TEXT"] })
    : [];

  const totalWork = idRows.length + allNodes.length;
  let progress = 0;
  let replaced = 0;
  let skipped  = 0;
  const log = [];
  const changedNodeIdSet = new Set();

  // ── Layer-ID targeted replacements ───────────────────────────────────────
  for (const row of idRows) {
    const node = figma.getNodeById(row.layer_id);
    if (!node || node.type !== "TEXT") {
      skipped++;
      log.push({ status: "error", from: row.source || row.layer_id, error: "Layer not found", layer: row.layer_name || "" });
    } else if (row.mode === "localization") {
      // Substring replacement — preserves all rich text formatting outside the changed range.
      const result = await applySubstringReplacement(node, row.source, row.target);
      if (result.ok) {
        replaced++;
        changedNodeIdSet.add(node.id);
        log.push({ status: "replaced", from: row.source, to: row.target, layer: row.layer_name || node.name });
      } else {
        skipped++;
        log.push({ status: "error", from: row.source, error: result.error, layer: row.layer_name || node.name });
      }
    } else {
      // Translation: full node replacement is intentional (whole sentence rewrite).
      const before = node.characters;
      try {
        await loadAllFonts(node);
        node.characters = row.target;
        replaced++;
        changedNodeIdSet.add(node.id);
        log.push({ status: "replaced", from: before, to: row.target, layer: row.layer_name || node.name });
      } catch (e) {
        skipped++;
        log.push({ status: "error", from: before, error: e.message, layer: row.layer_name || node.name });
      }
    }
    figma.ui.postMessage({ type: "progress", current: ++progress, total: totalWork || 1 });
  }

  // ── Text-match replacements ───────────────────────────────────────────────
  for (let i = 0; i < allNodes.length; i++) {
    const node = allNodes[i];

    // Translation: normalized exact full-text match → full node replacement.
    const original = normalize(node.characters);
    if (translationMap.has(original)) {
      const row = translationMap.get(original);
      try {
        await loadAllFonts(node);
        node.characters = row.target;
        translationMatched.add(original);
        replaced++;
        changedNodeIdSet.add(node.id);
        log.push({ status: "replaced", from: original, to: row.target, layer: node.name });
      } catch (e) {
        skipped++;
        log.push({ status: "error", from: original, error: e.message, layer: node.name });
      }
    }

    // Localization: substring match → in-place replacement, preserves styling.
    for (let j = 0; j < localizationTextRows.length; j++) {
      const row = localizationTextRows[j];
      // Re-read node.characters each time: prior replacements in this loop may have shifted text.
      if (!node.characters.includes(row.source)) continue;
      const result = await applySubstringReplacement(node, row.source, row.target);
      if (result.ok) {
        localizationTextMatchedIdx.add(j);
        replaced++;
        changedNodeIdSet.add(node.id);
        log.push({ status: "replaced", from: row.source, to: row.target, layer: node.name });
      } else {
        skipped++;
        log.push({ status: "error", from: row.source, error: result.error, layer: node.name });
      }
    }

    figma.ui.postMessage({ type: "progress", current: ++progress, total: totalWork });
  }

  const notFound = [];
  translationMap.forEach(function(row, k) {
    if (!translationMatched.has(k)) notFound.push(row.source);
  });
  for (let j = 0; j < localizationTextRows.length; j++) {
    if (!localizationTextMatchedIdx.has(j)) notFound.push(localizationTextRows[j].source);
  }

  return { replaced, skipped, log, notFound, changedNodeIds: Array.from(changedNodeIdSet) };
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

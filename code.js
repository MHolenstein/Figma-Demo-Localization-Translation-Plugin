figma.showUI(__html__, { width: 480, height: 520 });

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
    const translations = msg.translations; // [{ source, target }]
    const results = await replaceText(translations);
    figma.ui.postMessage({ type: "done", replaced: results.replaced, skipped: results.skipped, log: results.log });
  }

  if (msg.type === "cancel") {
    figma.closePlugin();
  }
};

async function replaceText(translations) {
  const map = new Map();
  for (const { source, target } of translations) {
    if (source && target) map.set(normalize(source), target.trim());
  }
  const matched = new Set();

  const allTextNodes = figma.currentPage.findAllWithCriteria({ types: ["TEXT"] });
  const total = allTextNodes.length;

  let replaced = 0;
  let skipped = 0;
  const log = [];

  for (let i = 0; i < total; i++) {
    const node = allTextNodes[i];
    const original = normalize(node.characters);
    if (map.has(original)) {
      await figma.loadFontAsync(node.fontName === figma.mixed ? { family: "Inter", style: "Regular" } : node.fontName);
      try {
        const fontNames = node.getRangeAllFontNames(0, node.characters.length);
        for (const font of fontNames) {
          await figma.loadFontAsync(font);
        }
        node.characters = map.get(original);
        matched.add(original);
        replaced++;
        log.push({ status: "replaced", from: original, to: map.get(original), layer: node.name });
      } catch (e) {
        skipped++;
        log.push({ status: "error", from: original, error: e.message, layer: node.name });
      }
    }
    figma.ui.postMessage({ type: "progress", current: i + 1, total });
  }

  const notFound = [...map.keys()].filter(k => !matched.has(k));
  return { replaced, skipped, log, notFound };
}

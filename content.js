const api = globalThis.browser || chrome;

const SKIP_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "TEXTAREA",
  "INPUT",
  "SELECT",
  "NOSCRIPT",
]);

// Store original text for every modified node so we can restore and re-apply
const originals = new WeakMap();

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isWordChar(ch) {
  return /\w/.test(ch);
}

function buildRegex(word) {
  const escaped = escapeRegExp(word);
  const prefix = isWordChar(word[0]) ? "\\b" : "(?<!\\w)";
  const suffix = isWordChar(word[word.length - 1]) ? "\\b" : "(?!\\w)";
  return new RegExp(`${prefix}${escaped}${suffix}`, "gi");
}

function saveOriginal(node) {
  if (!originals.has(node)) {
    originals.set(node, node.nodeValue);
  }
}

function replaceTextInNode(node, pairs) {
  if (!node.textContent.trim()) return;

  saveOriginal(node);
  // Always start from the original text to apply pairs cleanly
  node.nodeValue = originals.get(node);

  for (const { from, to } of pairs) {
    if (!from) continue;  // ignore malformed/empty pairs
    const regex = buildRegex(from);
    node.nodeValue = node.nodeValue.replace(regex, to);
  }
}

function getTextNodes(root) {
  const nodes = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (SKIP_TAGS.has(node.parentElement?.tagName)) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  while (walker.nextNode()) {
    nodes.push(walker.currentNode);
  }
  return nodes;
}

function walkAndReplace(root, pairs) {
  for (const node of getTextNodes(root)) {
    replaceTextInNode(node, pairs);
  }
}

function runReplacements(pairs) {
  // Pause observer while we modify the DOM to avoid recursive triggers
  observer.disconnect();

  if (!pairs || pairs.length === 0) {
    // No pairs left -- restore all originals
    restoreAllOriginals();
  } else {
    walkAndReplace(document.body, pairs);
  }

  observer.observe(document.body, { childList: true, subtree: true });
}

function restoreAllOriginals() {
  for (const node of getTextNodes(document.body)) {
    if (originals.has(node)) {
      node.nodeValue = originals.get(node);
    }
  }
}

// Cache pairs in memory so the MutationObserver doesn't hit storage on every
// DOM change. Refreshed on load and whenever the stored pairs change.
let currentPairs = [];

// Watch for dynamically added content
const observer = new MutationObserver((mutations) => {
  if (currentPairs.length === 0) return;
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        replaceTextInNode(node, currentPairs);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        walkAndReplace(node, currentPairs);
      }
    }
  }
});

observer.observe(document.body, { childList: true, subtree: true });

// Load pairs and run
api.storage.local.get({ pairs: [] }).then((data) => {
  currentPairs = data.pairs || [];
  runReplacements(currentPairs);
});

// React to popup edits across every open tab (no message passing needed)
api.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.pairs) {
    currentPairs = changes.pairs.newValue || [];
    runReplacements(currentPairs);
  }
});

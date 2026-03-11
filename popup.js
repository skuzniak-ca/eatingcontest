const api = globalThis.browser || chrome;

const pairsList = document.getElementById("pairs-list");
const fromInput = document.getElementById("from-input");
const toInput = document.getElementById("to-input");
const addBtn = document.getElementById("add-btn");

function renderPairs(pairs) {
  pairsList.innerHTML = "";

  if (pairs.length === 0) {
    const msg = document.createElement("div");
    msg.className = "empty-msg";
    msg.textContent = "No replacements yet. Add one below!";
    pairsList.appendChild(msg);
    return;
  }

  for (let i = 0; i < pairs.length; i++) {
    const row = document.createElement("div");
    row.className = "pair-row";

    const fromSpan = document.createElement("span");
    fromSpan.className = "from";
    fromSpan.textContent = pairs[i].from;
    fromSpan.title = pairs[i].from;

    const arrow = document.createElement("span");
    arrow.className = "arrow";
    arrow.textContent = "->";

    const toSpan = document.createElement("span");
    toSpan.className = "to";
    toSpan.textContent = pairs[i].to;
    toSpan.title = pairs[i].to;

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "x";
    deleteBtn.title = "Remove";
    deleteBtn.addEventListener("click", () => deletePair(i));

    row.appendChild(fromSpan);
    row.appendChild(arrow);
    row.appendChild(toSpan);
    row.appendChild(deleteBtn);
    pairsList.appendChild(row);
  }
}

async function loadPairs() {
  const data = await api.storage.local.get({ pairs: [] });
  return data.pairs;
}

async function savePairs(pairs) {
  await api.storage.local.set({ pairs });
  renderPairs(pairs);
  notifyContentScript();
}

function notifyContentScript() {
  api.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
    if (tabs[0]) {
      api.tabs.sendMessage(tabs[0].id, { action: "replacementsUpdated" });
    }
  });
}

async function addPair() {
  const from = fromInput.value.trim();
  const to = toInput.value.trim();
  if (!from || !to) return;

  const pairs = await loadPairs();
  pairs.push({ from, to });
  await savePairs(pairs);
  fromInput.value = "";
  toInput.value = "";
  fromInput.focus();
}

async function deletePair(index) {
  const pairs = await loadPairs();
  pairs.splice(index, 1);
  await savePairs(pairs);
}

addBtn.addEventListener("click", addPair);

// Allow Enter key to add a pair
toInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addPair();
});
fromInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") toInput.focus();
});

// Load existing pairs on popup open
loadPairs().then((pairs) => renderPairs(pairs));

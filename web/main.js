import OpenCC from "./node_modules/opencc-wasm/dist/esm/index.js";

const input = document.getElementById("input");
const output = document.getElementById("output");
const convertBtn = document.getElementById("convert");
const statusEl = document.getElementById("status");
const modeTonggui = document.getElementById("mode-tonggui");
const modeClassical = document.getElementById("mode-classical");

/** @type {{ tonggui: ((t: string) => Promise<string>) | null, classical: ((t: string) => Promise<string>) | null }} */
const converters = { tonggui: null, classical: null };
let activeMode = "tonggui";

function setStatus(text, isError = false) {
  statusEl.textContent = text;
  statusEl.classList.toggle("error", isError);
  statusEl.hidden = !text && !isError;
}

function readyLabel() {
  return activeMode === "tonggui" ? "就绪（通规）" : "就绪（古籍）";
}

function applyModeUI() {
  modeTonggui.classList.toggle("is-active", activeMode === "tonggui");
  modeClassical.classList.toggle("is-active", activeMode === "classical");
}

modeTonggui.addEventListener("click", () => {
  activeMode = "tonggui";
  applyModeUI();
  if (converters.tonggui && converters.classical) setStatus(readyLabel());
});

modeClassical.addEventListener("click", () => {
  activeMode = "classical";
  applyModeUI();
  if (converters.tonggui && converters.classical) setStatus(readyLabel());
});

async function init() {
  try {
    converters.tonggui = OpenCC.Converter({ config: "s2tg" });
    converters.classical = OpenCC.Converter({ config: "s2g" });
    await Promise.all([converters.tonggui(""), converters.classical("")]);
    convertBtn.disabled = false;
    setStatus(readyLabel());
  } catch (e) {
    console.error(e);
    convertBtn.disabled = true;
    setStatus(e instanceof Error ? e.message : String(e), true);
  }
}

convertBtn.addEventListener("click", async () => {
  const conv = activeMode === "tonggui" ? converters.tonggui : converters.classical;
  if (!conv) return;
  const text = input.value;
  setStatus("转换中…");
  convertBtn.disabled = true;
  try {
    output.value = await conv(text);
    setStatus(readyLabel());
  } catch (e) {
    console.error(e);
    setStatus(e instanceof Error ? e.message : String(e), true);
  } finally {
    convertBtn.disabled = false;
  }
});

applyModeUI();
init();

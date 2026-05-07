import OpenCC from "./node_modules/opencc-wasm/dist/esm/index.js";

const input = document.getElementById("input");
const output = document.getElementById("output");
const convertBtn = document.getElementById("convert");
const statusEl = document.getElementById("status");
const modeTonggui = document.getElementById("mode-tonggui");
const modeClassical = document.getElementById("mode-classical");

let converter = null;
let activeMode = "tonggui";

function setStatus(text, isError = false) {
  statusEl.textContent = text;
  statusEl.classList.toggle("error", isError);
  statusEl.hidden = !text && !isError;
}

function applyModeUI() {
  modeTonggui.classList.toggle("is-active", activeMode === "tonggui");
  modeClassical.classList.toggle("is-active", activeMode === "classical");
}

modeTonggui.addEventListener("click", () => {
  activeMode = "tonggui";
  applyModeUI();
});

modeClassical.addEventListener("click", () => {
  if (modeClassical.disabled) return;
  activeMode = "classical";
  applyModeUI();
});

async function init() {
  try {
    converter = OpenCC.Converter({ config: "s2tg" });
    await converter("");
    convertBtn.disabled = false;
    setStatus("就绪（通规）");
  } catch (e) {
    console.error(e);
    convertBtn.disabled = true;
    setStatus(e instanceof Error ? e.message : String(e), true);
  }
}

convertBtn.addEventListener("click", async () => {
  if (!converter || activeMode !== "tonggui") return;
  const text = input.value;
  setStatus("转换中…");
  convertBtn.disabled = true;
  try {
    output.value = await converter(text);
    setStatus("");
  } catch (e) {
    console.error(e);
    setStatus(e instanceof Error ? e.message : String(e), true);
  } finally {
    convertBtn.disabled = false;
  }
});

applyModeUI();
init();

import OpenCC from "./node_modules/opencc-wasm/dist/esm/index.js";

const input = document.getElementById("input");
const output = document.getElementById("output");
const convertBtn = document.getElementById("convert");
const statusEl = document.getElementById("status");
const statusCapsule = document.getElementById("status-capsule");
const modeTonggui = document.getElementById("mode-tonggui");
const modeClassical = document.getElementById("mode-classical");
const ioRow = document.querySelector(".io-row");
const fontSizeEl = document.getElementById("font-size");
const clearInputBtn = document.getElementById("clear-input");
const copyOutputBtn = document.getElementById("copy-output");
const yuanguHeitiWrap = document.getElementById("yuangu-heiti-wrap");
const useYuanguHeitiEl = document.getElementById("use-yuangu-heiti");

/** @type {{ tonggui: ((t: string) => Promise<string>) | null, classical: ((t: string) => Promise<string>) | null }} */
const converters = { tonggui: null, classical: null };
let activeMode = "tonggui";
let convertLock = false;
/** @type {ReturnType<typeof setTimeout> | null} */
let autoConvertTimer = null;
/** @type {ReturnType<typeof setTimeout> | null} */
let inputDebounceTimer = null;

const INPUT_DEBOUNCE_MS = 500;

/** @param {"loading" | "ready" | "error"} kind */
function setStatus(text, kind = "ready") {
  if (!statusEl || !statusCapsule) return;
  statusEl.textContent = text;
  statusCapsule.classList.remove("is-loading", "is-ready", "is-error");
  statusCapsule.classList.add(
    kind === "loading" ? "is-loading" : kind === "error" ? "is-error" : "is-ready"
  );
  statusCapsule.hidden = !text && kind !== "error";
}

function readyLabel() {
  return "● 就绪";
}

function applyModeUI() {
  modeTonggui.classList.toggle("is-active", activeMode === "tonggui");
  modeClassical.classList.toggle("is-active", activeMode === "classical");
  syncYuanguHeitiOption();
}

function syncYuanguHeitiOption() {
  if (!yuanguHeitiWrap || !useYuanguHeitiEl || !output) return;
  if (activeMode === "classical") {
    yuanguHeitiWrap.hidden = false;
  } else {
    yuanguHeitiWrap.hidden = true;
    useYuanguHeitiEl.checked = false;
    output.classList.remove("font-output-yuangu");
  }
}

function applyYuanguHeitiFont() {
  if (!output || !useYuanguHeitiEl) return;
  if (activeMode === "classical" && useYuanguHeitiEl.checked) {
    output.classList.add("font-output-yuangu");
  } else {
    output.classList.remove("font-output-yuangu");
  }
}

function scheduleAutoConvertAfterModeChange() {
  if (autoConvertTimer !== null) {
    clearTimeout(autoConvertTimer);
    autoConvertTimer = null;
  }
  if (!converters.tonggui || !converters.classical) return;
  if (!input.value) return;

  autoConvertTimer = setTimeout(() => {
    autoConvertTimer = null;
    void performConvert();
  }, INPUT_DEBOUNCE_MS);
}

function scheduleDebouncedConvertFromInput() {
  if (inputDebounceTimer !== null) {
    clearTimeout(inputDebounceTimer);
    inputDebounceTimer = null;
  }
  if (!converters.tonggui || !converters.classical) return;

  inputDebounceTimer = setTimeout(() => {
    inputDebounceTimer = null;
    void performConvert();
  }, INPUT_DEBOUNCE_MS);
}

async function performConvert() {
  const conv = activeMode === "tonggui" ? converters.tonggui : converters.classical;
  if (!conv || convertLock) return;
  const text = input.value;
  convertLock = true;
  setStatus("转换中…", "loading");
  convertBtn.disabled = true;
  try {
    output.value = await conv(text);
    setStatus(readyLabel(), "ready");
  } catch (e) {
    console.error(e);
    setStatus(e instanceof Error ? e.message : String(e), "error");
  } finally {
    convertLock = false;
    convertBtn.disabled = false;
  }
}

modeTonggui.addEventListener("click", () => {
  if (activeMode === "tonggui") return;
  activeMode = "tonggui";
  applyModeUI();
  if (converters.tonggui && converters.classical) setStatus(readyLabel(), "ready");
  scheduleAutoConvertAfterModeChange();
});

modeClassical.addEventListener("click", () => {
  if (activeMode === "classical") return;
  activeMode = "classical";
  applyModeUI();
  if (converters.tonggui && converters.classical) setStatus(readyLabel(), "ready");
  scheduleAutoConvertAfterModeChange();
});

async function init() {
  setStatus("● 加载", "loading");
  try {
    // 串行预热：并行加载两套配置会共用同一 WASM 与 MEMFS，易触发竞态（线上偶现 s2g 报「config 不可访问」）。
    converters.tonggui = OpenCC.Converter({ config: "s2tg" });
    await converters.tonggui("");
    converters.classical = OpenCC.Converter({ config: "s2g" });
    await converters.classical("");
    convertBtn.disabled = false;
    setStatus(readyLabel(), "ready");
  } catch (e) {
    console.error(e);
    convertBtn.disabled = true;
    setStatus(e instanceof Error ? e.message : String(e), "error");
  }
}

convertBtn.addEventListener("click", () => {
  void performConvert();
});

input?.addEventListener("input", () => {
  scheduleDebouncedConvertFromInput();
});

function applyIoFontSize() {
  if (!ioRow || !fontSizeEl) return;
  ioRow.style.setProperty("--io-font-size", `${fontSizeEl.value}px`);
}

fontSizeEl?.addEventListener("change", applyIoFontSize);
applyIoFontSize();

clearInputBtn?.addEventListener("click", () => {
  if (inputDebounceTimer !== null) {
    clearTimeout(inputDebounceTimer);
    inputDebounceTimer = null;
  }
  input.value = "";
  output.value = "";
  input.focus();
  if (converters.tonggui && converters.classical) setStatus(readyLabel(), "ready");
});

const COPY_BTN_LABEL = "复制";

useYuanguHeitiEl?.addEventListener("change", applyYuanguHeitiFont);

copyOutputBtn?.addEventListener("click", async () => {
  const text = output.value;
  try {
    await navigator.clipboard.writeText(text);
    copyOutputBtn.textContent = "已复制！";
    setTimeout(() => {
      copyOutputBtn.textContent = COPY_BTN_LABEL;
    }, 500);
  } catch (err) {
    console.error(err);
    copyOutputBtn.textContent = "失败";
    setTimeout(() => {
      copyOutputBtn.textContent = COPY_BTN_LABEL;
    }, 500);
  }
});

applyModeUI();
init();

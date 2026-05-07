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
const yuanguHeitiLabel = document.querySelector(".yuangu-heiti-label");

const YUANGU_HEITI_LABEL_FULL = "使用源古黑体";
const YUANGU_HEITI_LABEL_SHORT = "源古黑体";

/** @type {{ tonggui: ((t: string) => Promise<string>) | null, classical: ((t: string) => Promise<string>) | null }} */
const converters = { tonggui: null, classical: null };
let activeMode = "tonggui";
let convertLock = false;
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

function applyModeButtons() {
  modeTonggui.classList.toggle("is-active", activeMode === "tonggui");
  modeClassical.classList.toggle("is-active", activeMode === "classical");
}

/** 切换方案后：先完成转换更新输出，再同步「源古黑体」显隐与字体，避免出现「旧字形 + 新字体」的错觉 */
async function convertThenSyncYuanguFont() {
  if (!converters.tonggui || !converters.classical) {
    syncYuanguHeitiOption();
    return;
  }
  await performConvert();
  syncYuanguHeitiOption();
}

function syncYuanguHeitiOption() {
  if (!yuanguHeitiWrap || !useYuanguHeitiEl || !output) return;
  if (activeMode === "classical") {
    yuanguHeitiWrap.hidden = false;
    applyYuanguHeitiFont();
  } else {
    yuanguHeitiWrap.hidden = true;
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

/** 窄屏或典型触控手机环境：缩短文案省横向空间 */
function shouldUseCompactYuanguHeitiLabel() {
  if (typeof window.matchMedia !== "function") return false;
  if (window.matchMedia("(max-width: 640px)").matches) return true;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const noHover = window.matchMedia("(hover: none)").matches;
  return coarse && noHover;
}

function applyYuanguHeitiLabelMode() {
  if (!yuanguHeitiLabel) return;
  const compact = shouldUseCompactYuanguHeitiLabel();
  yuanguHeitiLabel.textContent = compact ? YUANGU_HEITI_LABEL_SHORT : YUANGU_HEITI_LABEL_FULL;
  yuanguHeitiLabel.title = compact ? YUANGU_HEITI_LABEL_FULL : "";
}

function bindYuanguHeitiLabelMediaListeners() {
  if (typeof window.matchMedia !== "function") return;
  const onChange = () => applyYuanguHeitiLabelMode();
  window.matchMedia("(max-width: 640px)").addEventListener("change", onChange);
  window.matchMedia("(pointer: coarse)").addEventListener("change", onChange);
  window.matchMedia("(hover: none)").addEventListener("change", onChange);
  window.addEventListener("orientationchange", () => requestAnimationFrame(applyYuanguHeitiLabelMode));
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
  applyModeButtons();
  if (converters.tonggui && converters.classical) setStatus(readyLabel(), "ready");
  void convertThenSyncYuanguFont();
});

modeClassical.addEventListener("click", () => {
  if (activeMode === "classical") return;
  activeMode = "classical";
  applyModeButtons();
  if (converters.tonggui && converters.classical) setStatus(readyLabel(), "ready");
  void convertThenSyncYuanguFont();
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

/** 拖动任一输入/输出框调整高度时，两者保持同高（不能用两边高度的 max，否则拉短时另一侧仍是旧高度会无法变矮） */
let ioHeightSyncLock = false;
let ioSnapshotIn = 0;
let ioSnapshotOut = 0;
let ioSnapInitialized = false;

function ioInitHeightSnapshots() {
  if (!input || !output) return;
  ioSnapshotIn = Math.round(input.offsetHeight);
  ioSnapshotOut = Math.round(output.offsetHeight);
  ioSnapInitialized = true;
}

function syncTextareaPairHeightPx(px) {
  if (!input || !output || ioHeightSyncLock) return;
  const hi = Math.round(input.offsetHeight);
  const ho = Math.round(output.offsetHeight);
  if (hi === px && ho === px) return;
  ioHeightSyncLock = true;
  input.style.height = `${px}px`;
  output.style.height = `${px}px`;
  /* 勿把 min-height 设成与 height 同值，否则浏览器无法用缩放手柄把框变矮 */
  input.style.removeProperty("min-height");
  output.style.removeProperty("min-height");
  requestAnimationFrame(() => {
    ioHeightSyncLock = false;
  });
}

const ioResizeObserver = new ResizeObserver(() => {
  if (ioHeightSyncLock || !input || !output) return;
  if (!ioSnapInitialized) {
    ioInitHeightSnapshots();
    return;
  }
  const hi = Math.round(input.offsetHeight);
  const ho = Math.round(output.offsetHeight);
  const di = hi - ioSnapshotIn;
  const doo = ho - ioSnapshotOut;
  if (di === 0 && doo === 0) return;
  const px = Math.abs(di) >= Math.abs(doo) ? hi : ho;
  syncTextareaPairHeightPx(px);
  ioSnapshotIn = px;
  ioSnapshotOut = px;
});
ioResizeObserver.observe(input);
ioResizeObserver.observe(output);
ioInitHeightSnapshots();

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
    copyOutputBtn.textContent = "√";
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

applyModeButtons();
applyYuanguHeitiLabelMode();
bindYuanguHeitiLabelMediaListeners();
syncYuanguHeitiOption();
init();

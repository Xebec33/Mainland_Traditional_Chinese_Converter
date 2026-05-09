import OpenCC from "./node_modules/opencc-wasm/dist/esm/index.js";

const input = document.getElementById("input");
const output = document.getElementById("output");
const convertBtn = document.getElementById("convert");
const statusEl = document.getElementById("status");
const statusCapsule = document.getElementById("status-capsule");
const modeTonggui = document.getElementById("mode-tonggui");
const modeClassical = document.getElementById("mode-classical");
const modeT2gov = document.getElementById("mode-t2gov");
const modeG2s = document.getElementById("mode-g2s");
const ioRow = document.querySelector(".io-row");
const fontSizeEl = document.getElementById("font-size");
const clearInputBtn = document.getElementById("clear-input");
const copyOutputBtn = document.getElementById("copy-output");
const yuanguHeitiWrap = document.getElementById("yuangu-heiti-wrap");
const yuanguHeitiSlotInput = document.getElementById("yuangu-heiti-slot-input");
const yuanguHeitiSlotOutput = document.getElementById("yuangu-heiti-slot-output");
const useYuanguHeitiEl = document.getElementById("use-yuangu-heiti");
const yuanguHeitiLabel = document.querySelector(".yuangu-heiti-label");
const yuanguHeitiTipWrap = document.querySelector(".yuangu-heiti-info-wrap");
const yuanguHeitiInfoBtn = document.querySelector(".yuangu-heiti-info");

function placeYuanguHeitiWrap(slot) {
  if (!yuanguHeitiWrap || !slot) return;
  slot.appendChild(yuanguHeitiWrap);
}

const YUANGU_HEITI_LABEL_FULL = "使用源古黑体";
const YUANGU_HEITI_LABEL_SHORT = "源古黑体";

/** @type {{ tonggui: ((t: string) => Promise<string>) | null, classical: ((t: string) => Promise<string>) | null, t2gov: ((t: string) => Promise<string>) | null, g2s: ((t: string) => Promise<string>) | null }} */
const converters = { tonggui: null, classical: null, t2gov: null, g2s: null };

function allConvertersReady() {
  return !!(converters.tonggui && converters.classical && converters.t2gov && converters.g2s);
}

/** @type {"tonggui" | "classical" | "t2gov" | "g2s"} */
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
  modeT2gov?.classList.toggle("is-active", activeMode === "t2gov");
  modeG2s?.classList.toggle("is-active", activeMode === "g2s");
}

/** 随转换方案切换输入/输出框 placeholder */
function applyIoPlaceholdersForMode() {
  if (!input || !output) return;
  if (activeMode === "t2gov") {
    input.placeholder = "在此粘貼或輸入繁體文本";
    output.placeholder = "轉换結果將顯示在這裏";
  } else if (activeMode === "g2s") {
    input.placeholder = "在此粘貼或輸入古籍規範字形文本";
    output.placeholder = "转换结果将显示在这里";
  } else if (activeMode === "classical") {
    input.placeholder = "在此粘贴或输入简体文本";
    output.placeholder = "轉換結果將顯示在這裏";
  } else {
    input.placeholder = "在此粘贴或输入简体文本";
    output.placeholder = "轉换結果將顯示在這裏";
  }
}

/** 切换方案后：先完成转换更新输出，再同步「源古黑体」显隐与字体，避免出现「旧字形 + 新字体」的错觉 */
async function convertThenSyncYuanguFont() {
  if (!allConvertersReady()) {
    syncYuanguHeitiOption();
    return;
  }
  await performConvert();
  syncYuanguHeitiOption();
}

function syncYuanguHeitiOption() {
  if (!yuanguHeitiWrap || !useYuanguHeitiEl || !input || !output) return;
  if (activeMode === "classical") {
    placeYuanguHeitiWrap(yuanguHeitiSlotOutput);
    yuanguHeitiWrap.hidden = false;
    applyYuanguHeitiFont();
  } else if (activeMode === "g2s") {
    placeYuanguHeitiWrap(yuanguHeitiSlotInput);
    yuanguHeitiWrap.hidden = false;
    applyYuanguHeitiFont();
  } else {
    yuanguHeitiWrap.hidden = true;
    setYuanguHeitiTipPinned(false);
    input.classList.remove("font-input-yuangu");
    output.classList.remove("font-output-yuangu");
  }
}

function applyYuanguHeitiFont() {
  if (!input || !output || !useYuanguHeitiEl) return;
  if (activeMode === "classical" && useYuanguHeitiEl.checked) {
    output.classList.add("font-output-yuangu");
    input.classList.remove("font-input-yuangu");
  } else if (activeMode === "g2s" && useYuanguHeitiEl.checked) {
    input.classList.add("font-input-yuangu");
    output.classList.remove("font-output-yuangu");
  } else {
    input.classList.remove("font-input-yuangu");
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
  if (!allConvertersReady()) return;

  inputDebounceTimer = setTimeout(() => {
    inputDebounceTimer = null;
    void performConvert();
  }, INPUT_DEBOUNCE_MS);
}

async function performConvert() {
  const conv =
    activeMode === "tonggui"
      ? converters.tonggui
      : activeMode === "classical"
        ? converters.classical
        : activeMode === "t2gov"
          ? converters.t2gov
          : converters.g2s;
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
  applyIoPlaceholdersForMode();
  if (allConvertersReady()) setStatus(readyLabel(), "ready");
  void convertThenSyncYuanguFont();
});

modeClassical.addEventListener("click", () => {
  if (activeMode === "classical") return;
  activeMode = "classical";
  applyModeButtons();
  applyIoPlaceholdersForMode();
  if (allConvertersReady()) setStatus(readyLabel(), "ready");
  void convertThenSyncYuanguFont();
});

modeT2gov?.addEventListener("click", () => {
  if (activeMode === "t2gov") return;
  activeMode = "t2gov";
  applyModeButtons();
  applyIoPlaceholdersForMode();
  if (allConvertersReady()) setStatus(readyLabel(), "ready");
  void convertThenSyncYuanguFont();
});

modeG2s?.addEventListener("click", () => {
  if (activeMode === "g2s") return;
  activeMode = "g2s";
  applyModeButtons();
  applyIoPlaceholdersForMode();
  if (allConvertersReady()) setStatus(readyLabel(), "ready");
  void convertThenSyncYuanguFont();
});

async function init() {
  setStatus("● 加载", "loading");
  try {
    // 串行预热：共用同一 WASM 与 MEMFS，并行易触发竞态。
    converters.tonggui = OpenCC.Converter({ config: "s2tg" });
    await converters.tonggui("");
    converters.classical = OpenCC.Converter({ config: "s2g" });
    await converters.classical("");
    converters.t2gov = OpenCC.Converter({ config: "t2gov" });
    await converters.t2gov("");
    converters.g2s = OpenCC.Converter({ config: "g2s" });
    await converters.g2s("");
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
  if (allConvertersReady()) setStatus(readyLabel(), "ready");
});

const COPY_BTN_LABEL = "复制";

useYuanguHeitiEl?.addEventListener("change", applyYuanguHeitiFont);

function setYuanguHeitiTipPinned(pinned) {
  if (!yuanguHeitiTipWrap || !yuanguHeitiInfoBtn) return;
  yuanguHeitiTipWrap.classList.toggle("yuangu-heiti-tip-pinned", pinned);
  yuanguHeitiInfoBtn.setAttribute("aria-expanded", pinned ? "true" : "false");
}

yuanguHeitiInfoBtn?.addEventListener("click", () => {
  const next = !yuanguHeitiTipWrap?.classList.contains("yuangu-heiti-tip-pinned");
  setYuanguHeitiTipPinned(next);
});

document.addEventListener("click", (e) => {
  if (!yuanguHeitiTipWrap || yuanguHeitiTipWrap.contains(e.target)) return;
  setYuanguHeitiTipPinned(false);
});

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  setYuanguHeitiTipPinned(false);
});

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
applyIoPlaceholdersForMode();
applyYuanguHeitiLabelMode();
bindYuanguHeitiLabelMediaListeners();
syncYuanguHeitiOption();
init();

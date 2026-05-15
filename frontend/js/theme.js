/**
 * 테마 토글 - light / dark / system 3사이클
 * spec: openspec/specs/ui-design-system (Requirement: 테마 모드 선택과 영구화)
 */

const STORAGE_KEY = "taskflow_theme";
const VALID = new Set(["light", "dark", "system"]);

const mq = window.matchMedia("(prefers-color-scheme: dark)");
const listeners = new Set();

export function getStored() {
  const v = localStorage.getItem(STORAGE_KEY);
  return VALID.has(v) ? v : "system";
}

function effectiveFor(stored) {
  if (stored === "dark") return "dark";
  if (stored === "light") return "light";
  return mq.matches ? "dark" : "light";
}

export function getEffective() {
  return effectiveFor(getStored());
}

export function applyInitial() {
  // <head>의 인라인 스크립트가 보통 먼저 실행하지만, 안전을 위해 한 번 더
  document.documentElement.dataset.theme = getEffective();
}

export function setTheme(stored) {
  if (!VALID.has(stored)) stored = "system";
  try { localStorage.setItem(STORAGE_KEY, stored); } catch { /* silent */ }
  document.documentElement.dataset.theme = effectiveFor(stored);
  listeners.forEach((fn) => fn(stored, getEffective()));
}

export function cycle() {
  const order = ["light", "dark", "system"];
  const cur = getStored();
  const next = order[(order.indexOf(cur) + 1) % order.length];
  setTheme(next);
  return next;
}

export function onChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// system 모드에서 OS 변경 시 자동 반영
mq.addEventListener("change", () => {
  if (getStored() === "system") {
    document.documentElement.dataset.theme = getEffective();
    listeners.forEach((fn) => fn("system", getEffective()));
  }
});

/**
 * target 요소에 토글 버튼 주입.
 * compact=true면 작은 정사각형 버튼, false면 헤더용 인라인.
 */
export function renderThemeToggle(target, { compact = false } = {}) {
  if (!target) return;
  target.innerHTML = "";
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = compact
    ? "w-9 h-9 grid place-items-center rounded-full border text-base bg-[color:var(--color-surface)] hover:opacity-80"
    : "px-2 py-1 text-base hover:opacity-80";
  btn.style.borderColor = "var(--color-border)";
  btn.style.color = "var(--color-text)";

  const paint = () => {
    const s = getStored();
    const icon = s === "dark" ? "🌙" : s === "light" ? "☀️" : "🖥️";
    btn.textContent = icon;
    btn.title = `테마: ${s}`;
    btn.setAttribute("aria-label", `테마 ${s} (클릭하여 전환)`);
  };
  btn.addEventListener("click", () => { cycle(); paint(); });
  paint();
  onChange(paint);
  target.appendChild(btn);
}

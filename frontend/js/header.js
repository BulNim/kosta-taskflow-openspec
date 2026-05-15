/**
 * 공용 헤더: 로고 + 팀명 + (칸반/채팅/멤버) 탭 + 로그아웃
 * 사용:
 *   import { renderHeader } from "/js/header.js";
 *   renderHeader({ teamId, active: "kanban" | "chat" | "members" });
 */
import { api } from "/js/api.js";
import { clearToken } from "/js/auth.js";
import { renderThemeToggle } from "/js/theme.js";

export async function renderHeader({ teamId, active = "kanban" }) {
  const container = document.getElementById("appHeader");
  if (!container) return;

  let teamName = "";
  let userEmail = "";
  try {
    const [me, teams] = await Promise.all([api("/auth/me"), api("/teams")]);
    userEmail = me.email;
    const t = teams.find((x) => String(x.id) === String(teamId));
    if (t) teamName = t.name;
  } catch {
    /* 401은 api.js가 처리 */
  }

  const tabClass = (key) =>
    key === active
      ? "btn-primary"
      : "px-4 py-1.5 rounded-md text-slate-700 hover:bg-slate-100 text-sm font-medium";

  container.innerHTML = `
    <div class="flex items-center justify-between px-6 py-3 border-b bg-white">
      <div class="flex items-center gap-4">
        <a href="/pages/teams.html" class="font-bold text-[color:var(--color-primary)]">TaskFlow</a>
        <span class="text-slate-700">${escapeHtml(teamName || "팀")}</span>
      </div>
      <nav class="flex items-center gap-2">
        <a href="/pages/board.html?team_id=${encodeURIComponent(teamId)}"   class="${tabClass("kanban")}">칸반</a>
        <a href="/pages/chat.html?team_id=${encodeURIComponent(teamId)}"    class="${tabClass("chat")}">채팅</a>
        <a href="/pages/members.html?team_id=${encodeURIComponent(teamId)}" class="${tabClass("members")}">멤버</a>
      </nav>
      <div class="flex items-center gap-3 text-sm">
        <span class="text-slate-500 hidden sm:inline">${escapeHtml(userEmail)}</span>
        <span id="themeToggleSlot"></span>
        <button id="globalLogoutBtn" class="text-slate-500 hover:text-slate-900">로그아웃</button>
      </div>
    </div>
  `;

  renderThemeToggle(document.getElementById("themeToggleSlot"));

  document.getElementById("globalLogoutBtn").addEventListener("click", async () => {
    try { await api("/auth/logout", { method: "POST" }); } catch {}
    clearToken();
    location.replace("/pages/login.html");
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

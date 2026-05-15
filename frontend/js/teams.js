import { api } from "/js/api.js";
import { clearToken, requireAuthOrRedirect } from "/js/auth.js";
import { toast } from "/js/toast.js";

requireAuthOrRedirect();

const listEl = document.getElementById("teamList");
const createForm = document.getElementById("createForm");
const joinForm = document.getElementById("joinForm");
const emptyBanner = document.getElementById("emptyBanner");
const logoutBtn = document.getElementById("logoutBtn");
const userEmailEl = document.getElementById("userEmail");

async function refresh() {
  listEl.innerHTML = '<div class="text-slate-500 text-sm">로딩...</div>';
  try {
    const [me, teams] = await Promise.all([api("/auth/me"), api("/teams")]);
    userEmailEl.textContent = me.email;
    render(teams, me);
  } catch (err) {
    listEl.innerHTML = '<div class="text-red-600 text-sm">팀 목록을 불러오지 못했습니다.</div>';
    toast(err.msg);
  }
}

function render(teams, me) {
  emptyBanner.classList.toggle("hidden", teams.length > 0);
  if (!teams.length) {
    listEl.innerHTML = '<div class="text-slate-500 text-sm col-span-full">팀이 없습니다.</div>';
    return;
  }
  listEl.innerHTML = teams
    .map((t) => {
      const isCurrent = me.current_team_id === t.id;
      return `
        <a href="/pages/board.html?team_id=${t.id}"
           class="block bg-white rounded-2xl shadow-sm border p-5 hover:shadow-md transition ${isCurrent ? "ring-2 ring-[color:var(--color-primary)]" : ""}">
          <div class="flex items-center justify-between">
            <div class="text-lg font-semibold">${escapeHtml(t.name)}</div>
            ${isCurrent ? '<span class="text-xs px-2 py-0.5 rounded bg-[color:var(--color-primary)] text-white">현재</span>' : ""}
          </div>
          <div class="mt-2 text-xs" style="color:var(--color-text-muted)">초대코드</div>
          <div class="font-mono text-sm tracking-wider">${t.invite_code}</div>
        </a>`;
    })
    .join("");
}

createForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(createForm).entries());
  try {
    const team = await api("/teams", { method: "POST", body: data });
    createForm.reset();
    toast("팀이 생성되었습니다", "info");
    location.replace(`/pages/board.html?team_id=${team.id}`);
  } catch (err) {
    toast(err.msg);
  }
});

joinForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(joinForm);
  const code = (fd.get("invite_code") || "").toString().toUpperCase();
  try {
    const team = await api("/teams/join", { method: "POST", body: { invite_code: code } });
    joinForm.reset();
    toast("팀에 합류했습니다", "info");
    location.replace(`/pages/board.html?team_id=${team.id}`);
  } catch (err) {
    toast(err.msg);
  }
});

logoutBtn.addEventListener("click", async () => {
  try { await api("/auth/logout", { method: "POST" }); } catch {}
  clearToken();
  location.replace("/pages/login.html");
});

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

refresh();

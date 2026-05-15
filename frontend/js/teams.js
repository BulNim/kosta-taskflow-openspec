import { api } from "./api.js";
import { clearToken, requireAuthOrRedirect } from "./auth.js";
import { toast } from "./toast.js";

requireAuthOrRedirect();

const listEl = document.getElementById("teamList");
const createForm = document.getElementById("createForm");
const joinForm = document.getElementById("joinForm");
const logoutBtn = document.getElementById("logoutBtn");

async function refresh() {
  listEl.innerHTML = '<div class="text-slate-500 text-sm">로딩...</div>';
  try {
    const teams = await api("/teams");
    render(teams);
  } catch (err) {
    listEl.innerHTML = '<div class="text-red-600 text-sm">팀 목록을 불러오지 못했습니다.</div>';
    toast(err.msg);
  }
}

function render(teams) {
  if (!teams.length) {
    listEl.innerHTML =
      '<div class="text-slate-500 text-sm col-span-full">아직 속한 팀이 없습니다. 새로 만들거나 초대코드로 합류하세요.</div>';
    return;
  }
  listEl.innerHTML = teams
    .map(
      (t) => `
      <a href="/pages/board.html?team_id=${t.id}"
         class="block bg-white rounded-2xl shadow p-5 hover:shadow-md transition">
        <div class="text-lg font-semibold text-slate-800">${escapeHtml(t.name)}</div>
        <div class="mt-2 text-xs text-slate-500">초대코드</div>
        <div class="font-mono text-sm tracking-wider text-slate-700">${t.invite_code}</div>
      </a>`
    )
    .join("");
}

createForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(createForm).entries());
  try {
    await api("/teams", { method: "POST", body: data });
    createForm.reset();
    toast("팀이 생성되었습니다", "info");
    await refresh();
  } catch (err) {
    toast(err.msg);
  }
});

joinForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(joinForm);
  const code = (fd.get("invite_code") || "").toString().toUpperCase();
  try {
    await api("/teams/join", { method: "POST", body: { invite_code: code } });
    joinForm.reset();
    toast("팀에 합류했습니다", "info");
    await refresh();
  } catch (err) {
    toast(err.msg);
  }
});

logoutBtn.addEventListener("click", async () => {
  try {
    await api("/auth/logout", { method: "POST" });
  } catch {
    /* ignore */
  }
  clearToken();
  location.replace("/pages/login.html");
});

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

refresh();

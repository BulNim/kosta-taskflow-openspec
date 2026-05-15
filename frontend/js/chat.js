import { api } from "./api.js";
import { clearToken, requireAuthOrRedirect } from "./auth.js";
import { toast } from "./toast.js";

requireAuthOrRedirect();

const params = new URLSearchParams(location.search);
const teamId = params.get("team_id");
if (!teamId) location.replace("/pages/teams.html");

document.getElementById("boardLink").href = `/pages/board.html?team_id=${teamId}`;

const POLL_INTERVAL_MS = 5000;
const messagesEl = document.getElementById("messages");
const sendForm = document.getElementById("sendForm");
const inputEl = sendForm.querySelector('input[name="content"]');

let memberMap = new Map();
let lastSeen = null;
let pollTimer = null;
const renderedIds = new Set();

document.getElementById("logoutBtn").addEventListener("click", async () => {
  try { await api("/auth/logout", { method: "POST" }); } catch {}
  clearToken();
  location.replace("/pages/login.html");
});

async function loadTitleAndMembers() {
  try {
    const [teams, members] = await Promise.all([api("/teams"), api(`/teams/${teamId}/members`)]);
    const team = teams.find((t) => String(t.id) === String(teamId));
    if (team) document.getElementById("teamTitle").textContent = `${team.name} - 채팅`;
    memberMap = new Map(members.map((m) => [m.id, m.email]));
  } catch (err) {
    toast(err.msg);
  }
}

function formatTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("ko-KR", { hour12: false });
  } catch {
    return iso;
  }
}

function appendMessage(m) {
  if (renderedIds.has(m.id)) return;
  renderedIds.add(m.id);
  const sender = memberMap.get(m.user_id) || `user#${m.user_id}`;
  const wasAtBottom = messagesEl.scrollTop + messagesEl.clientHeight >= messagesEl.scrollHeight - 20;
  const wrap = document.createElement("div");
  wrap.className = "py-1";
  wrap.innerHTML = `
    <div class="text-xs text-slate-500">
      <span class="font-semibold text-slate-700"></span>
      <span class="ml-2"></span>
    </div>
    <div class="text-sm text-slate-800 break-words whitespace-pre-wrap"></div>`;
  wrap.querySelector(".font-semibold").textContent = sender;
  wrap.querySelector("span.ml-2").textContent = formatTime(m.created_at);
  wrap.querySelector(".text-sm").textContent = m.content;
  messagesEl.appendChild(wrap);
  if (wasAtBottom) messagesEl.scrollTop = messagesEl.scrollHeight;
  lastSeen = m.created_at > lastSeen ? m.created_at : lastSeen;
}

async function loadInitial() {
  messagesEl.innerHTML = "";
  try {
    const list = await api(`/teams/${teamId}/messages`);
    if (!list.length) {
      messagesEl.innerHTML = '<div class="text-slate-400 text-sm">아직 메시지가 없습니다. 첫 메시지를 보내보세요.</div>';
      return;
    }
    messagesEl.innerHTML = "";
    list.forEach(appendMessage);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  } catch (err) {
    toast(err.msg);
  }
}

async function pollOnce() {
  if (!lastSeen) return;
  try {
    const list = await api(`/teams/${teamId}/messages?since=${encodeURIComponent(lastSeen)}`);
    if (list.length) {
      // 첫 메시지 도착 시 placeholder 제거
      const placeholder = messagesEl.querySelector(".text-slate-400");
      if (placeholder) placeholder.remove();
      list.forEach(appendMessage);
    }
  } catch (err) {
    if (err.status !== 401) toast(err.msg);
  }
}

function startPolling() {
  stopPolling();
  pollTimer = setInterval(pollOnce, POLL_INTERVAL_MS);
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

sendForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const content = inputEl.value.trim();
  if (!content) return;
  if (content.length > 1000) return toast("메시지는 1000자 이내여야 합니다");
  inputEl.disabled = true;
  try {
    const created = await api(`/teams/${teamId}/messages`, {
      method: "POST",
      body: { content },
    });
    const placeholder = messagesEl.querySelector(".text-slate-400");
    if (placeholder) placeholder.remove();
    appendMessage(created);
    inputEl.value = "";
  } catch (err) {
    toast(err.msg);
  } finally {
    inputEl.disabled = false;
    inputEl.focus();
  }
});

window.addEventListener("beforeunload", stopPolling);
window.addEventListener("pagehide", stopPolling);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopPolling();
  else startPolling();
});

(async () => {
  await loadTitleAndMembers();
  await loadInitial();
  // lastSeen 시드: 마지막 메시지 시각 or 현재
  if (!lastSeen) lastSeen = new Date(0).toISOString();
  startPolling();
})();

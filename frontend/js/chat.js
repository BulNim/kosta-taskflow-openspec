import { api } from "/js/api.js";
import { requireAuthOrRedirect } from "/js/auth.js";
import { renderHeader } from "/js/header.js";
import { toast } from "/js/toast.js";

requireAuthOrRedirect();

const params = new URLSearchParams(location.search);
const teamId = params.get("team_id");
if (!teamId) location.replace("/pages/teams.html");

await renderHeader({ teamId, active: "chat" });

const POLL_MS = 5000;
const INITIAL_LIMIT = 50;

const messagesEl = document.getElementById("messages");
const sendForm = document.getElementById("sendForm");
const inputEl = sendForm.querySelector('input[name="content"]');

let me = null;
let lastSeen = new Date(0).toISOString();
let pollTimer = null;
const renderedIds = new Set();

async function loadMe() {
  try { me = await api("/auth/me"); } catch {}
}

function fmtTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("ko-KR", { hour12: false, hour: "2-digit", minute: "2-digit" });
  } catch { return iso; }
}

function shortName(email) {
  if (!email) return "user";
  return email.split("@")[0];
}

function appendMessage(m) {
  if (renderedIds.has(m.id)) return;
  renderedIds.add(m.id);
  if (m.created_at > lastSeen) lastSeen = m.created_at;

  const wasAtBottom = messagesEl.scrollTop + messagesEl.clientHeight >= messagesEl.scrollHeight - 20;
  const isSelf = me && m.user_id === me.id;
  const sender = isSelf ? "나" : shortName(m.user_email);

  const wrap = document.createElement("div");
  wrap.className = isSelf ? "text-right" : "";
  wrap.innerHTML = `
    <div class="text-xs" style="color:var(--color-text-muted)">
      <span class="font-semibold" style="color:var(--color-text)"></span>
      <span class="ml-2"></span>
    </div>
    <div class="bubble mt-1 inline-block max-w-[80%] px-3 py-2 rounded-lg whitespace-pre-wrap break-words"></div>
  `;
  wrap.querySelector(".font-semibold").textContent = sender;
  wrap.querySelector("span.ml-2").textContent = fmtTime(m.created_at);
  const bubble = wrap.querySelector(".bubble");
  bubble.textContent = m.content;
  if (isSelf) {
    bubble.style.background = "var(--color-primary)";
    bubble.style.color = "#fff";
  } else {
    bubble.style.background = "#fff";
    bubble.style.border = "1px solid var(--color-border)";
    bubble.style.color = "var(--color-text)";
  }

  messagesEl.appendChild(wrap);
  if (wasAtBottom) messagesEl.scrollTop = messagesEl.scrollHeight;
}

async function loadInitial() {
  messagesEl.innerHTML = "";
  try {
    const list = await api(`/teams/${teamId}/messages?limit=${INITIAL_LIMIT}`);
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
  try {
    const list = await api(`/teams/${teamId}/messages?since=${encodeURIComponent(lastSeen)}`);
    if (list.length) {
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
  pollTimer = setInterval(pollOnce, POLL_MS);
}
function stopPolling() {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
}

sendForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const content = inputEl.value.trim();
  if (!content) return;
  if (content.length > 1000) return toast("메시지는 1000자 이내여야 합니다");
  inputEl.disabled = true;
  try {
    const created = await api(`/teams/${teamId}/messages`, { method: "POST", body: { content } });
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

await loadMe();
await loadInitial();
startPolling();

import { api } from "./api.js";
import { clearToken, requireAuthOrRedirect } from "./auth.js";
import { toast } from "./toast.js";

requireAuthOrRedirect();

const params = new URLSearchParams(location.search);
const teamId = params.get("team_id");
if (!teamId) {
  location.replace("/pages/teams.html");
}

document.getElementById("chatLink").href = `/pages/chat.html?team_id=${teamId}`;

const columns = {
  TODO: document.querySelector('[data-column="TODO"] .cards'),
  DOING: document.querySelector('[data-column="DOING"] .cards'),
  DONE: document.querySelector('[data-column="DONE"] .cards'),
};

document.getElementById("logoutBtn").addEventListener("click", async () => {
  try { await api("/auth/logout", { method: "POST" }); } catch {}
  clearToken();
  location.replace("/pages/login.html");
});

async function loadTitle() {
  try {
    const teams = await api("/teams");
    const team = teams.find((t) => String(t.id) === String(teamId));
    if (team) document.getElementById("teamTitle").textContent = team.name;
  } catch {
    /* ignore */
  }
}

async function loadTasks() {
  Object.values(columns).forEach((c) => (c.innerHTML = ""));
  try {
    const tasks = await api(`/teams/${teamId}/tasks`);
    tasks.forEach(renderCard);
  } catch (err) {
    toast(err.msg);
  }
}

function renderCard(task) {
  const card = document.createElement("article");
  card.dataset.taskId = task.id;
  card.draggable = true;
  card.className = "bg-slate-50 border border-slate-200 rounded-lg p-3 shadow-sm select-none cursor-grab";
  card.innerHTML = `
    <div class="task-title text-sm text-slate-800 break-words whitespace-pre-wrap"></div>
    <div class="mt-2 flex justify-end gap-2 text-xs">
      <button class="edit-btn text-blue-600 hover:underline">수정</button>
      <button class="delete-btn text-red-600 hover:underline">삭제</button>
    </div>`;
  card.querySelector(".task-title").textContent = task.title;

  card.querySelector(".edit-btn").addEventListener("click", () => editCard(task, card));
  card.querySelector(".delete-btn").addEventListener("click", () => deleteCard(task.id, card));

  card.addEventListener("dragstart", () => {
    card.classList.add("dragging");
    card.dataset.fromStatus = task.status;
  });
  card.addEventListener("dragend", () => card.classList.remove("dragging"));

  columns[task.status]?.appendChild(card);
}

async function editCard(task, card) {
  const next = prompt("새 제목 (1~200자)", task.title);
  if (next === null) return;
  const title = next.trim();
  if (!title) return toast("제목은 비울 수 없습니다");
  if (title.length > 200) return toast("제목은 200자 이내여야 합니다");
  try {
    const updated = await api(`/tasks/${task.id}`, { method: "PUT", body: { title } });
    task.title = updated.title;
    card.querySelector(".task-title").textContent = updated.title;
  } catch (err) {
    toast(err.msg);
  }
}

async function deleteCard(id, card) {
  if (!confirm("이 태스크를 삭제할까요?")) return;
  try {
    await api(`/tasks/${id}`, { method: "DELETE" });
    card.remove();
  } catch (err) {
    toast(err.msg);
  }
}

document.querySelectorAll(".add-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const status = btn.closest("[data-column]").dataset.column;
    const title = prompt("새 태스크 제목 (1~200자)");
    if (title === null) return;
    const trimmed = title.trim();
    if (!trimmed) return toast("제목을 입력하세요");
    if (trimmed.length > 200) return toast("제목은 200자 이내여야 합니다");
    try {
      const created = await api(`/teams/${teamId}/tasks`, {
        method: "POST",
        body: { title: trimmed },
      });
      if (status !== "TODO") {
        const moved = await api(`/tasks/${created.id}`, { method: "PUT", body: { status } });
        renderCard(moved);
      } else {
        renderCard(created);
      }
    } catch (err) {
      toast(err.msg);
    }
  });
});

document.querySelectorAll("[data-column]").forEach((section) => {
  section.addEventListener("dragover", (e) => {
    e.preventDefault();
    section.classList.add("drop-target");
  });
  section.addEventListener("dragleave", () => section.classList.remove("drop-target"));
  section.addEventListener("drop", async (e) => {
    e.preventDefault();
    section.classList.remove("drop-target");
    const dragging = document.querySelector(".dragging");
    if (!dragging) return;
    const newStatus = section.dataset.column;
    if (dragging.dataset.fromStatus === newStatus) return;
    const taskId = dragging.dataset.taskId;
    section.querySelector(".cards").appendChild(dragging);
    try {
      await api(`/tasks/${taskId}`, { method: "PUT", body: { status: newStatus } });
      dragging.dataset.fromStatus = newStatus;
    } catch (err) {
      toast(err.msg);
      await loadTasks();
    }
  });
});

loadTitle();
loadTasks();

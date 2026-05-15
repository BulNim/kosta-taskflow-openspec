import { api } from "/js/api.js";
import { requireAuthOrRedirect } from "/js/auth.js";
import { renderHeader } from "/js/header.js";
import { toast } from "/js/toast.js";

requireAuthOrRedirect();

const params = new URLSearchParams(location.search);
const teamId = params.get("team_id");
if (!teamId) location.replace("/pages/teams.html");

await renderHeader({ teamId, active: "kanban" });

const columns = {
  TODO: document.querySelector('[data-column="TODO"] .cards'),
  DOING: document.querySelector('[data-column="DOING"] .cards'),
  DONE: document.querySelector('[data-column="DONE"] .cards'),
};
const counts = {
  TODO: document.querySelector('[data-column="TODO"] .col-count'),
  DOING: document.querySelector('[data-column="DOING"] .col-count'),
  DONE: document.querySelector('[data-column="DONE"] .col-count'),
};
const sections = {
  TODO: document.querySelector('[data-column="TODO"]'),
  DOING: document.querySelector('[data-column="DOING"]'),
  DONE: document.querySelector('[data-column="DONE"]'),
};

let members = [];
let memberMap = new Map();
let me = null;
let currentFilter = "all";
let currentSort = "created_at_desc";

const filterTabs = document.getElementById("filterTabs");
const sortSelect = document.getElementById("sortSelect");
const mobileColTabs = document.getElementById("mobileColTabs");
const fab = document.getElementById("fabAdd");
const sheet = document.getElementById("statusSheet");

function setActiveFilter(value) {
  currentFilter = value;
  filterTabs.dataset.current = value;
  filterTabs.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.filter === value);
  });
}

function setActiveColumn(col) {
  mobileColTabs.dataset.current = col;
  mobileColTabs.querySelectorAll(".mcol-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.col === col);
  });
  Object.entries(sections).forEach(([key, el]) => {
    el.classList.toggle("show", key === col);
  });
}

filterTabs.addEventListener("click", (e) => {
  const btn = e.target.closest(".filter-btn");
  if (!btn) return;
  setActiveFilter(btn.dataset.filter);
  loadTasks();
});

sortSelect.addEventListener("change", () => {
  currentSort = sortSelect.value;
  loadTasks();
});

mobileColTabs.addEventListener("click", (e) => {
  const btn = e.target.closest(".mcol-btn");
  if (!btn) return;
  setActiveColumn(btn.dataset.col);
});

setActiveFilter("all");
setActiveColumn("TODO");

async function loadMembers() {
  try {
    const list = await api(`/teams/${teamId}/members`);
    members = list;
    memberMap = new Map(list.map((m) => [m.id, m.email]));
  } catch (err) {
    toast(err.msg);
  }
  try {
    me = await api("/auth/me");
  } catch { /* api.js가 401 처리 */ }
}

async function loadTasks() {
  Object.values(columns).forEach((c) => (c.innerHTML = ""));
  Object.values(counts).forEach((c) => (c.textContent = "0"));
  try {
    const tasks = await api(`/teams/${teamId}/tasks?filter=${currentFilter}&sort=${currentSort}`);
    const grouped = { TODO: 0, DOING: 0, DONE: 0 };
    tasks.forEach((t) => {
      renderCard(t);
      grouped[t.status] = (grouped[t.status] || 0) + 1;
    });
    Object.entries(grouped).forEach(([s, n]) => (counts[s].textContent = String(n)));
  } catch (err) {
    toast(err.msg);
  }
}

function shortEmail(email) {
  if (!email) return "(미할당)";
  return "@" + email.split("@")[0];
}

function renderCard(task) {
  const card = document.createElement("article");
  card.dataset.taskId = task.id;
  card.dataset.status = task.status;
  card.draggable = true;
  card.className = "card cursor-grab text-sm";
  const assigneeLabel = task.assignee_id ? shortEmail(memberMap.get(task.assignee_id)) : "(미할당)";
  card.innerHTML = `
    <div class="task-title font-medium break-words whitespace-pre-wrap"></div>
    <div class="mt-1 flex items-center justify-between text-xs" style="color:var(--color-text-muted)">
      <span>#<span class="task-id">${task.id}</span> · <span class="task-assignee">${escapeHtml(assigneeLabel)}</span></span>
      <span class="hidden md:flex gap-2 desktop-actions">
        <button class="edit-btn hover:underline text-blue-600">수정</button>
        <button class="delete-btn hover:underline text-red-600">삭제</button>
      </span>
    </div>`;
  card.querySelector(".task-title").textContent = task.title;

  card.querySelector(".edit-btn").addEventListener("click", () => editCard(task, card));
  card.querySelector(".delete-btn").addEventListener("click", () => deleteCard(task.id, card));

  card.addEventListener("dragstart", () => {
    card.classList.add("dragging");
    card.dataset.fromStatus = task.status;
  });
  card.addEventListener("dragend", () => card.classList.remove("dragging"));

  // 모바일: 카드 탭 → bottom-sheet
  card.addEventListener("click", (e) => {
    if (window.matchMedia("(min-width: 768px)").matches) return;
    if (e.target.closest(".desktop-actions")) return;
    openSheet(task, card);
  });

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
    // count 갱신
    const status = card.dataset.status;
    counts[status].textContent = String(parseInt(counts[status].textContent || "0") - 1);
  } catch (err) {
    toast(err.msg);
  }
}

// 인라인 추가 폼
function attachAddBtn(btn) {
  btn.addEventListener("click", () => {
    const status = btn.closest("[data-column]").dataset.column;
    spawnInlineForm(status);
  });
}
document.querySelectorAll(".add-btn").forEach(attachAddBtn);

fab.addEventListener("click", () => {
  spawnInlineForm(mobileColTabs.dataset.current);
  setActiveColumn(mobileColTabs.dataset.current);
});

function spawnInlineForm(status) {
  const container = columns[status];
  const existing = container.querySelector(".inline-form");
  if (existing) {
    existing.querySelector("input[name=title]").focus();
    return;
  }
  const form = document.createElement("article");
  form.className = "inline-form card border-2 !border-[color:var(--color-primary)]";
  form.innerHTML = `
    <input name="title" class="w-full font-medium bg-transparent focus:outline-none" placeholder="제목 입력" />
    <div class="mt-2 flex items-center gap-2 text-sm">
      <label style="color:var(--color-text-muted)">담당자:</label>
      <select name="assignee_id" class="input-base !py-1 !w-auto">
        <option value="">(미할당)</option>
        ${members
          .map((m) => `<option value="${m.id}" ${me && m.id === me.id ? "selected" : ""}>@${escapeHtml(m.email.split("@")[0])}</option>`)
          .join("")}
      </select>
    </div>
    <p class="text-xs mt-1" style="color:var(--color-text-muted)">Enter: 저장 · Esc: 취소</p>
  `;
  container.prepend(form);
  const titleInput = form.querySelector("input[name=title]");
  titleInput.focus();

  const cleanup = () => form.remove();
  titleInput.addEventListener("keydown", async (e) => {
    if (e.key === "Escape") return cleanup();
    if (e.key !== "Enter") return;
    e.preventDefault();
    const title = titleInput.value.trim();
    if (!title) return toast("제목을 입력하세요");
    if (title.length > 200) return toast("제목은 200자 이내여야 합니다");
    const assigneeSel = form.querySelector("select[name=assignee_id]");
    const assignee_id = assigneeSel.value ? Number(assigneeSel.value) : null;
    try {
      const created = await api(`/teams/${teamId}/tasks`, {
        method: "POST",
        body: { title, assignee_id },
      });
      cleanup();
      // 상태가 TODO가 기본인데, 추가한 컬럼이 다른 경우 즉시 상태 이동
      if (created.status !== status) {
        const moved = await api(`/tasks/${created.id}`, { method: "PUT", body: { status } });
        renderCard(moved);
      } else {
        renderCard(created);
      }
      counts[status].textContent = String(parseInt(counts[status].textContent || "0") + 1);
    } catch (err) {
      toast(err.msg);
    }
  });
}

// 드래그 앤 드롭
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
    await moveCard(dragging, newStatus);
  });
});

async function moveCard(card, newStatus) {
  const taskId = card.dataset.taskId;
  const oldStatus = card.dataset.status;
  columns[newStatus].appendChild(card);
  card.dataset.status = newStatus;
  card.dataset.fromStatus = newStatus;
  try {
    await api(`/tasks/${taskId}`, { method: "PUT", body: { status: newStatus } });
    counts[oldStatus].textContent = String(parseInt(counts[oldStatus].textContent || "0") - 1);
    counts[newStatus].textContent = String(parseInt(counts[newStatus].textContent || "0") + 1);
  } catch (err) {
    toast(err.msg);
    await loadTasks();
  }
}

// Bottom sheet (모바일)
let sheetTaskCtx = null;
function openSheet(task, card) {
  sheetTaskCtx = { task, card };
  sheet.classList.add("show");
  sheet.querySelector(".sheet").classList.add("show");
}
function closeSheet() {
  sheet.classList.remove("show");
  sheet.querySelector(".sheet").classList.remove("show");
  sheetTaskCtx = null;
}
sheet.addEventListener("click", async (e) => {
  if (e.target === sheet) return closeSheet();
  const btn = e.target.closest("button");
  if (!btn || !sheetTaskCtx) return;
  const { task, card } = sheetTaskCtx;
  if (btn.dataset.action === "cancel") return closeSheet();
  if (btn.dataset.action === "edit") {
    closeSheet();
    return editCard(task, card);
  }
  if (btn.dataset.action === "delete") {
    closeSheet();
    return deleteCard(task.id, card);
  }
  const newStatus = btn.dataset.status;
  if (newStatus && newStatus !== card.dataset.status) {
    await moveCard(card, newStatus);
  }
  closeSheet();
});

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

await loadMembers();
await loadTasks();

// =============================================================
// js/script.js — UI logic (DOM, form, buttons).
// Talks to the server ONLY through TaskAPI (see api.js).
// =============================================================

// ---------- DOM elements ----------
const form = document.getElementById('task-form');
const formTitle = document.getElementById('form-title');
const taskIdInput = document.getElementById('task-id');
const titleInput = document.getElementById('title');
const descInput = document.getElementById('description');
const descCount = document.getElementById('desc-count');
const dueDateInput = document.getElementById('dueDate');
const priorityInput = document.getElementById('priority');
const statusGroup = document.getElementById('status-group');
const statusInput = document.getElementById('status');
const fileInput = document.getElementById('file');
const currentFileBox = document.getElementById('current-file');
const currentFileLink = document.getElementById('current-file-link');
const removeFileCheckbox = document.getElementById('removeFile');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');

const messageBox = document.getElementById('message');
const taskList = document.getElementById('task-list');
const loadingText = document.getElementById('loading');
const emptyState = document.getElementById('empty-state');
const summaryText = document.getElementById('task-summary');
const filterButtons = document.querySelectorAll('.filter-btn');

// ---------- Settings ----------
const MAX_FILE_SIZE_MB = 5;
const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'txt'];

// ---------- State ----------
let currentFilter = 'All';
let messageTimer = null;

// =============================================================
// Messages
// =============================================================
function showMessage(text, type = 'success') {
  messageBox.textContent = text;
  messageBox.className = `message ${type}`;
  clearTimeout(messageTimer);
  messageTimer = setTimeout(() => messageBox.classList.add('hidden'), 5000);
  messageBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// =============================================================
// Helpers
// =============================================================

// Prevent HTML injection when showing user text
function escapeHTML(text) {
  const div = document.createElement('div');
  div.textContent = text == null ? '' : String(text);
  return div.innerHTML;
}

// "2026-09-30T00:00:00.000Z" -> "Sep 30, 2026"
function formatDate(isoString) {
  if (!isoString) return 'No due date';
  const date = new Date(isoString);
  return date.toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC',
  });
}

// ISO date -> "YYYY-MM-DD" for <input type="date">
function toDateInputValue(isoString) {
  return isoString ? isoString.substring(0, 10) : '';
}

// Is the task past its due date and still pending?
function isOverdue(task) {
  if (!task.dueDate || task.status === 'Completed') return false;
  const today = new Date().toISOString().substring(0, 10);
  return toDateInputValue(task.dueDate) < today;
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// =============================================================
// Client-side validation (the server validates again!)
// =============================================================
function validateForm() {
  const errors = [];
  titleInput.classList.remove('invalid');
  descInput.classList.remove('invalid');

  const title = titleInput.value.trim();
  if (!title) {
    errors.push('Task title cannot be empty.');
    titleInput.classList.add('invalid');
  } else if (title.length > 100) {
    errors.push('Task title must be 100 characters or less.');
    titleInput.classList.add('invalid');
  }

  if (descInput.value.trim().length > 500) {
    errors.push('Description must be 500 characters or less.');
    descInput.classList.add('invalid');
  }

  if (dueDateInput.value && Number.isNaN(new Date(dueDateInput.value).getTime())) {
    errors.push('Due date is not valid.');
  }

  const file = fileInput.files[0];
  if (file) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      errors.push('Invalid file type. Allowed: ' + ALLOWED_EXTENSIONS.join(', ').toUpperCase() + '.');
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      errors.push(`File is too large. Maximum size is ${MAX_FILE_SIZE_MB} MB.`);
    }
  }

  return errors;
}

// Build FormData from the form (used for both create and update)
function buildFormData(isEdit) {
  const formData = new FormData();
  formData.append('title', titleInput.value.trim());
  formData.append('description', descInput.value.trim());
  formData.append('dueDate', dueDateInput.value); // "" = no due date
  formData.append('priority', priorityInput.value);

  if (isEdit) {
    formData.append('status', statusInput.value);
    if (removeFileCheckbox.checked) formData.append('removeFile', 'true');
  }

  if (fileInput.files[0]) {
    formData.append('file', fileInput.files[0]); // field name must be "file"
  }
  return formData;
}

// =============================================================
// Load and display tasks
// =============================================================
async function loadTasks() {
  loadingText.classList.remove('hidden');
  emptyState.classList.add('hidden');

  try {
    const status = currentFilter === 'All' ? '' : currentFilter;
    const tasks = await TaskAPI.getAll(status);
    renderTasks(tasks);
  } catch (error) {
    taskList.innerHTML = '';
    summaryText.textContent = '';
    showMessage(error.message, 'error');
  } finally {
    loadingText.classList.add('hidden');
  }
}

function renderTasks(tasks) {
  taskList.innerHTML = '';

  if (tasks.length === 0) {
    emptyState.textContent =
      currentFilter === 'All' ? 'No tasks yet. Add your first task above!' : `No ${currentFilter.toLowerCase()} tasks.`;
    emptyState.classList.remove('hidden');
    summaryText.textContent = '';
    return;
  }

  const completed = tasks.filter((t) => t.status === 'Completed').length;
  summaryText.textContent =
    currentFilter === 'All'
      ? `${tasks.length} task(s) — ${tasks.length - completed} pending, ${completed} completed`
      : `${tasks.length} ${currentFilter.toLowerCase()} task(s)`;

  tasks.forEach((task) => taskList.appendChild(createTaskElement(task)));
}

function createTaskElement(task) {
  const li = document.createElement('li');
  const isCompleted = task.status === 'Completed';
  li.className = `task-item${isCompleted ? ' completed' : ''}`;
  li.dataset.id = task._id;

  const overdue = isOverdue(task);
  const fileHTML = task.file
    ? `<span class="task-file">📎 <a href="${escapeHTML(TaskAPI.fileUrl(task.file.path))}" target="_blank" rel="noopener">${escapeHTML(task.file.originalName)}</a> (${formatFileSize(task.file.size)})</span>`
    : '';

  li.innerHTML = `
    <div class="task-top">
      <h3 class="task-title">${escapeHTML(task.title)}</h3>
      <div>
        <span class="badge badge-priority-${task.priority.toLowerCase()}">${escapeHTML(task.priority)}</span>
        <span class="badge badge-status-${task.status.toLowerCase()}">${isCompleted ? '✔ ' : ''}${escapeHTML(task.status)}</span>
      </div>
    </div>
    ${task.description ? `<p class="task-desc">${escapeHTML(task.description)}</p>` : ''}
    <div class="task-meta">
      <span class="${overdue ? 'overdue' : ''}">📅 Due: ${formatDate(task.dueDate)}${overdue ? ' (Overdue)' : ''}</span>
      <span>🕒 Created: ${new Date(task.createdAt).toLocaleString()}</span>
      ${fileHTML}
    </div>
    <div class="task-actions">
      ${
        isCompleted
          ? '<button class="btn btn-small btn-undo" data-action="pending">↩ Mark as Pending</button>'
          : '<button class="btn btn-small btn-complete" data-action="complete">✔ Mark as Completed</button>'
      }
      <button class="btn btn-small btn-edit" data-action="edit">✏ Edit</button>
      <button class="btn btn-small btn-delete" data-action="delete">🗑 Delete</button>
    </div>
  `;
  return li;
}

// =============================================================
// Create / Update (form submit)
// =============================================================
async function handleSubmit(event) {
  event.preventDefault();

  const errors = validateForm();
  if (errors.length) {
    showMessage(errors.join(' '), 'error');
    return;
  }

  const id = taskIdInput.value;
  const isEdit = Boolean(id);
  const formData = buildFormData(isEdit);

  submitBtn.disabled = true;
  submitBtn.textContent = isEdit ? 'Saving...' : 'Adding...';

  try {
    if (isEdit) {
      await TaskAPI.update(id, formData);
      showMessage('Task updated successfully.');
    } else {
      await TaskAPI.create(formData);
      showMessage('Task added successfully.');
    }
    resetForm();
    await loadTasks(); // refresh the list after every change
  } catch (error) {
    showMessage(error.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = taskIdInput.value ? 'Save Changes' : 'Add Task';
  }
}

// =============================================================
// Edit mode
// =============================================================
async function startEdit(id) {
  try {
    const task = await TaskAPI.getOne(id); // always get the latest data from the server

    taskIdInput.value = task._id;
    titleInput.value = task.title;
    descInput.value = task.description || '';
    descCount.textContent = descInput.value.length;
    dueDateInput.value = toDateInputValue(task.dueDate);
    priorityInput.value = task.priority;
    statusInput.value = task.status;
    fileInput.value = '';
    removeFileCheckbox.checked = false;

    if (task.file) {
      currentFileLink.textContent = task.file.originalName;
      currentFileLink.href = TaskAPI.fileUrl(task.file.path);
      currentFileBox.classList.remove('hidden');
    } else {
      currentFileBox.classList.add('hidden');
    }

    statusGroup.classList.remove('hidden');
    formTitle.textContent = 'Edit Task';
    submitBtn.textContent = 'Save Changes';
    cancelBtn.classList.remove('hidden');

    form.scrollIntoView({ behavior: 'smooth' });
    titleInput.focus();
  } catch (error) {
    showMessage(error.message, 'error');
  }
}

function resetForm() {
  form.reset();
  taskIdInput.value = '';
  descCount.textContent = '0';
  titleInput.classList.remove('invalid');
  descInput.classList.remove('invalid');
  statusGroup.classList.add('hidden');
  currentFileBox.classList.add('hidden');
  formTitle.textContent = 'Add New Task';
  submitBtn.textContent = 'Add Task';
  cancelBtn.classList.add('hidden');
}

// =============================================================
// Task buttons: complete / pending / edit / delete
// (one listener on the list = "event delegation")
// =============================================================
async function handleTaskAction(event) {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const id = button.closest('.task-item').dataset.id;
  const action = button.dataset.action;

  try {
    if (action === 'complete') {
      await TaskAPI.markCompleted(id);
      showMessage('Task marked as completed.');
    } else if (action === 'pending') {
      await TaskAPI.markPending(id);
      showMessage('Task changed back to pending.');
    } else if (action === 'edit') {
      await startEdit(id);
      return; // no list refresh needed
    } else if (action === 'delete') {
      if (!confirm('Are you sure you want to delete this task?')) return;
      await TaskAPI.remove(id);
      if (taskIdInput.value === id) resetForm();
      showMessage('Task deleted.');
    }
    await loadTasks();
  } catch (error) {
    showMessage(error.message, 'error');
  }
}

// =============================================================
// Event listeners
// =============================================================
form.addEventListener('submit', handleSubmit);
cancelBtn.addEventListener('click', resetForm);
taskList.addEventListener('click', handleTaskAction);

descInput.addEventListener('input', () => {
  descCount.textContent = descInput.value.length;
});

filterButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    filterButtons.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    loadTasks();
  });
});

// Load tasks when the page opens
loadTasks();

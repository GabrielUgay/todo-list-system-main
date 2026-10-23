// =============================================================
// js/api.js — ALL communication with the Express server lives here.
// Every function uses fetch() and returns the JSON "data" from the API,
// or throws an Error with a user-friendly message.
// =============================================================

// Where is the server?
// - Opened from the Express server (http://localhost:5000)  -> same origin, use ''
// - Opened as a file or with VS Code Live Server (port 5500) -> call http://localhost:5000
const API_BASE_URL =
  window.location.protocol === 'file:' || window.location.port === '5500'
    ? 'http://localhost:5000'
    : '';

const TASKS_URL = `${API_BASE_URL}/api/tasks`;

// Shared helper: send the request, read the JSON, and handle errors
async function request(url, options = {}) {
  let response;
  try {
    response = await fetch(url, options);
  } catch (networkError) {
    // fetch() only throws when the server cannot be reached at all
    throw new Error('Cannot connect to the server. Is it running? (npm run dev)');
  }

  let body = null;
  try {
    body = await response.json();
  } catch (e) {
    // Response was not JSON (should not happen with this API)
  }

  if (!response.ok || (body && body.success === false)) {
    const message = (body && body.message) || `Request failed (HTTP ${response.status})`;
    throw new Error(message);
  }

  return body;
}

const TaskAPI = {
  // GET /api/tasks  (status is optional: 'Pending' or 'Completed')
  async getAll(status) {
    const url = status ? `${TASKS_URL}?status=${encodeURIComponent(status)}` : TASKS_URL;
    const body = await request(url);
    return body.data;
  },

  // GET /api/tasks/:id
  async getOne(id) {
    const body = await request(`${TASKS_URL}/${id}`);
    return body.data;
  },

  // POST /api/tasks — formData can contain a file (field name "file")
  // Note: do NOT set Content-Type yourself; the browser sets it for FormData.
  async create(formData) {
    const body = await request(TASKS_URL, { method: 'POST', body: formData });
    return body.data;
  },

  // PUT /api/tasks/:id — formData can contain a new file or removeFile=true
  async update(id, formData) {
    const body = await request(`${TASKS_URL}/${id}`, { method: 'PUT', body: formData });
    return body.data;
  },

  // PATCH /api/tasks/:id/complete
  async markCompleted(id) {
    const body = await request(`${TASKS_URL}/${id}/complete`, { method: 'PATCH' });
    return body.data;
  },

  // PATCH /api/tasks/:id/pending
  async markPending(id) {
    const body = await request(`${TASKS_URL}/${id}/pending`, { method: 'PATCH' });
    return body.data;
  },

  // DELETE /api/tasks/:id
  async remove(id) {
    const body = await request(`${TASKS_URL}/${id}`, { method: 'DELETE' });
    return body.data;
  },

  // Full URL of an uploaded file (task.file.path looks like "/uploads/abc.pdf")
  fileUrl(filePath) {
    return `${API_BASE_URL}${filePath}`;
  },
};

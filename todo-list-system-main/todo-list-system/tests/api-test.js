// =============================================================
// tests/api-test.js — automatic API tests (no extra packages needed)
//
// HOW TO RUN:
//   1. Start MongoDB and the server:   npm run dev
//   2. In a SECOND terminal:            npm run test:api
//
// It creates test tasks, checks every endpoint, then deletes them.
// Requires Node.js 18+ (built-in fetch, FormData and Blob).
// =============================================================
const BASE = process.env.API_URL || 'http://localhost:5000';
const TASKS = `${BASE}/api/tasks`;

let passed = 0;
let failed = 0;
const createdIds = [];

function check(name, condition, details = '') {
  if (condition) {
    passed++;
    console.log(`  ✅ ${name}`);
  } else {
    failed++;
    console.log(`  ❌ ${name}${details ? '  → ' + details : ''}`);
  }
}

   async function call(method, url, body) {
     const options = { method };
     if (body instanceof FormData) options.body = body;
  else if (body) {
    options.headers = { 'Content-Type': 'application/json' };
    options.body = JSON.stringify(body);
  }
  const res = await fetch(url, options);
  const json = await res.json().catch(() => null);
  return { status: res.status, json };
}

function form(fields, file) {
  const fd = new FormData();
  Object.entries(fields).forEach(([k, v]) => fd.append(k, v));
  if (file) fd.append('file', new Blob([file.content], { type: file.type }), file.name);
  return fd;
}

async function run() {
  console.log(`\nTesting API at ${TASKS}\n`);

  // 0. Server + database health
  console.log('0. Health check');
  const health = await call('GET', `${BASE}/api/health`);
  check('Server is running and database is connected', health.status === 200, JSON.stringify(health.json));
  if (health.status !== 200) {
    console.log('\nStop: start MongoDB and the server first (npm run dev).');
    process.exit(1);
  }

  // 1. Create
  console.log('\n1. Create a task');
  let r = await call('POST', TASKS, form({
    title: 'Test task', description: 'Created by api-test.js', dueDate: '2026-12-31', priority: 'High',
  }));
  check('POST /api/tasks returns 201', r.status === 201, JSON.stringify(r.json));
  const task = r.json && r.json.data;
  if (task) createdIds.push(task._id);
  check('Default status is Pending', task && task.status === 'Pending');
  check('createdAt is set', task && Boolean(task.createdAt));

  // 2. View
  console.log('\n2. View tasks');
  r = await call('GET', TASKS);
  check('GET /api/tasks returns a list', r.status === 200 && Array.isArray(r.json.data));
  check('New task is in the list', r.json.data.some((t) => t._id === task._id));
  r = await call('GET', `${TASKS}/${task._id}`);
  check('GET /api/tasks/:id returns the task', r.status === 200 && r.json.data.title === 'Test task');

  // 3. Update
  console.log('\n3. Update a task');
  r = await call('PUT', `${TASKS}/${task._id}`, form({ title: 'Updated title', priority: 'Low' }));
  check('PUT /api/tasks/:id returns 200', r.status === 200, JSON.stringify(r.json));
  check('Title and priority were changed', r.json.data.title === 'Updated title' && r.json.data.priority === 'Low');
  r = await call('PUT', `${TASKS}/${task._id}`, { description: 'Updated with JSON' });
  check('PUT also accepts JSON', r.status === 200 && r.json.data.description === 'Updated with JSON');

  // 4. Upload
  console.log('\n4. Upload a file');
  r = await call('POST', TASKS, form(
    { title: 'Task with file' },
    { content: 'Hello from the test', type: 'text/plain', name: 'notes.txt' }
  ));
  check('Task with file created (201)', r.status === 201, JSON.stringify(r.json));
  const fileTask = r.json && r.json.data;
  if (fileTask) createdIds.push(fileTask._id);
  check('File info saved in MongoDB', fileTask && fileTask.file && fileTask.file.originalName === 'notes.txt');
  if (fileTask && fileTask.file) {
    const fileRes = await fetch(BASE + fileTask.file.path);
    check('Uploaded file can be opened at ' + fileTask.file.path, fileRes.status === 200);
  }
  r = await call('POST', TASKS, form(
    { title: 'Bad file' },
    { content: 'MZ', type: 'application/x-msdownload', name: 'virus.exe' }
  ));
  check('.exe file is rejected with 400', r.status === 400, JSON.stringify(r.json));

  // 5. Complete
  console.log('\n5. Mark as completed');
  r = await call('PATCH', `${TASKS}/${task._id}/complete`);
  check('Status is Completed', r.status === 200 && r.json.data.status === 'Completed');

  // 6. Back to pending
  console.log('\n6. Change back to pending');
  r = await call('PATCH', `${TASKS}/${task._id}/pending`);
  check('Status is Pending again', r.status === 200 && r.json.data.status === 'Pending');

  // 7. Delete
  console.log('\n7. Delete a task');
  r = await call('DELETE', `${TASKS}/${task._id}`);
  check('DELETE returns 200', r.status === 200);
  r = await call('GET', `${TASKS}/${task._id}`);
  check('Deleted task now returns 404', r.status === 404);

  // 8. Invalid input
  console.log('\n8. Invalid input');
  r = await call('POST', TASKS, form({ title: '   ' }));
  check('Empty title → 400', r.status === 400, r.json && r.json.message);
  r = await call('POST', TASKS, form({ title: 'x', priority: 'Urgent' }));
  check('Invalid priority → 400', r.status === 400, r.json && r.json.message);
  r = await call('POST', TASKS, form({ title: 'x', dueDate: 'not-a-date' }));
  check('Invalid due date → 400', r.status === 400, r.json && r.json.message);
  r = await call('POST', TASKS, form({ title: 'x', description: 'a'.repeat(501) }));
  check('Description over 500 chars → 400', r.status === 400, r.json && r.json.message);
  r = await call('PUT', `${TASKS}/${fileTask._id}`, form({ status: 'Done' }));
  check('Invalid status → 400', r.status === 400, r.json && r.json.message);

  // 9. Invalid task ID
  console.log('\n9. Invalid task ID');
  r = await call('GET', `${TASKS}/123`);
  check('Badly formatted ID → 400', r.status === 400, r.json && r.json.message);
  r = await call('GET', `${TASKS}/000000000000000000000000`);
  check('Valid format but not found → 404', r.status === 404, r.json && r.json.message);
  r = await call('GET', `${BASE}/api/unknown`);
  check('Unknown route → 404', r.status === 404);

  // 10. Database/server errors are tested manually — see docs/TESTING.md
  console.log('\n10. Database/server errors: test manually (stop MongoDB, see docs/TESTING.md)');

  // Clean up
  for (const id of createdIds) await call('DELETE', `${TASKS}/${id}`);

  console.log(`\nResult: ${passed} passed, ${failed} failed\n`);
  process.exit(failed ? 1 : 0);
}

run().catch((err) => {
  console.error('\nCould not run tests:', err.message);
  console.error('Is the server running at', BASE, '?');
  process.exit(1);
});

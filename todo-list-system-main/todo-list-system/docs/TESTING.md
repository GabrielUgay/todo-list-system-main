# Testing Instructions

There are three ways to test. Use all three before your presentation.

1. **Automatic tests** — `npm run test:api` (fastest)
2. **Manual UI tests** — in the browser
3. **API tests** — with Postman, Thunder Client, or `curl`

Before testing: MongoDB must be running and the server started with `npm run dev`.

---

## 1. Automatic API tests

Open a **second terminal** (keep the server running in the first one):

```bash
npm run test:api
```

It creates test tasks, checks tests 1–9 below, then deletes the test tasks. Expected ending:

```
Result: 26 passed, 0 failed
```

---

## 2. Manual test cases (browser)

Open **http://localhost:5000**. To check the database, use **MongoDB Compass** → `todo_db` → `tasks`, or open `http://localhost:5000/api/tasks` in a browser tab.

| # | Test | Steps | Expected result |
|---|---|---|---|
| 1 | **Create a task** | Fill title "Math homework", description, due date, priority High → *Add Task* | Green "Task added successfully." Task appears at the top with **Pending** badge. It is in MongoDB with `createdAt`. |
| 2 | **View tasks** | Refresh the page. Click *All*, *Pending*, *Completed* | Tasks still there after refresh (loaded from MongoDB). Filters show the right tasks. |
| 3 | **Update a task** | Click *Edit* → change title and priority → *Save Changes* | "Task updated successfully." Changes shown. `updatedAt` changed in MongoDB. |
| 4 | **Upload a file** | Create a task with a PDF or image. Click the 📎 link | File opens in a new tab. The file exists in `server/uploads/`. The task in MongoDB has a `file` object. |
| 4b | Wrong file type | Try uploading a `.exe` or `.zip` | Red error "Invalid file type…". No task created. |
| 4c | Replace/remove file | Edit a task with a file → choose a new file (or tick *Remove this file*) → Save | New file shown (or no file). Old file is gone from `server/uploads/`. |
| 5 | **Mark as completed** | Click *✔ Mark as Completed* | Green left bar, ✔ Completed badge, title crossed out. `status: "Completed"` in MongoDB. |
| 6 | **Back to pending** | On a completed task click *↩ Mark as Pending* | Normal look again. `status: "Pending"` in MongoDB. |
| 7 | **Delete a task** | Click *🗑 Delete* → OK | "Task deleted." Task gone from list and MongoDB. Its file is gone from `server/uploads/`. |
| 8 | **Invalid input** | Submit with empty title. Type more than 500 characters in description | Red error message; nothing saved. Title box turns red. |
| 9 | **Invalid task ID** | Open `http://localhost:5000/api/tasks/123` and `http://localhost:5000/api/tasks/000000000000000000000000` | `400` "Invalid task ID" and `404` "Task not found". |
| 10 | **Database/server errors** | See below | Clear error messages, server does not crash. |

### Test 10 — database and server errors

**a) Database stops while the server is running**
1. Keep the server running. Stop MongoDB:
   - Windows: *Services* → *MongoDB Server* → Stop (or `net stop MongoDB` as admin)
   - Mac: `brew services stop mongodb-community`
   - Linux: `sudo systemctl stop mongod`
   - Docker: `docker stop todo-mongo`
2. Wait about 10–30 seconds (the driver needs a moment to notice), then refresh the page or add a task.
3. **Expected:** red message "Database is unavailable. Please try again later." `GET /api/health` shows `"database": "disconnected"` (status 503). The terminal shows `⚠️ MongoDB disconnected`.
4. Start MongoDB again. After a few seconds the terminal shows `✅ MongoDB reconnected` and the app works again.

**b) Database is not running when the server starts**
Stop MongoDB, then run `npm run dev`. **Expected:** `❌ Could not connect to MongoDB` with a hint, and the server exits.

**c) Server is not running**
Stop the server (`Ctrl + C`) and click any button on the page. **Expected:** red message "Cannot connect to the server. Is it running?"

**d) Wrong connection string**
Put a wrong `MONGODB_URI` in `.env` and start the server. **Expected:** `❌ Could not connect to MongoDB`.

---

## 3. Testing the API with Postman / Thunder Client

[Postman](https://www.postman.com/downloads/) or the VS Code extension **Thunder Client** both work.

### Create a task with a file
- Method: `POST` — URL: `http://localhost:5000/api/tasks`
- Body → **form-data**:

| Key | Type | Value |
|---|---|---|
| title | Text | Read chapter 3 |
| description | Text | Pages 40-60 |
| dueDate | Text | 2026-10-05 |
| priority | Text | High |
| file | **File** | choose a PDF |

- Click *Send* → status **201**. Copy the `_id` from the response.

### Other requests

| Test | Method | URL | Body |
|---|---|---|---|
| View all | GET | `http://localhost:5000/api/tasks` | — |
| View pending only | GET | `http://localhost:5000/api/tasks?status=Pending` | — |
| View one | GET | `http://localhost:5000/api/tasks/<id>` | — |
| Update | PUT | `http://localhost:5000/api/tasks/<id>` | raw JSON: `{ "title": "New title", "priority": "Low" }` |
| Complete | PATCH | `http://localhost:5000/api/tasks/<id>/complete` | — |
| Pending | PATCH | `http://localhost:5000/api/tasks/<id>/pending` | — |
| Delete | DELETE | `http://localhost:5000/api/tasks/<id>` | — |
| Invalid input | POST | `http://localhost:5000/api/tasks` | raw JSON: `{ "title": "", "priority": "Urgent" }` → 400 |
| Invalid ID | GET | `http://localhost:5000/api/tasks/abc` | — → 400 |

### Using the browser only
GET requests can be opened directly in the address bar:
- `http://localhost:5000/api/health`
- `http://localhost:5000/api/tasks`
- `http://localhost:5000/api/tasks?status=Completed`

### Using curl (terminal)

```bash
# Create (with file)
curl -X POST http://localhost:5000/api/tasks -F "title=Read chapter 3" -F "priority=High" -F "file=@./notes.pdf"

# View all
curl http://localhost:5000/api/tasks

# Update
curl -X PUT http://localhost:5000/api/tasks/<id> -H "Content-Type: application/json" -d "{\"title\":\"New title\"}"

# Complete / Pending
curl -X PATCH http://localhost:5000/api/tasks/<id>/complete
curl -X PATCH http://localhost:5000/api/tasks/<id>/pending

# Delete
curl -X DELETE http://localhost:5000/api/tasks/<id>
```

---

## Test result checklist (for your documentation)

| # | Test | Pass/Fail | Tested by | Date |
|---|---|---|---|---|
| 1 | Create a task | | | |
| 2 | View tasks | | | |
| 3 | Update a task | | | |
| 4 | Upload a file | | | |
| 5 | Mark as completed | | | |
| 6 | Back to pending | | | |
| 7 | Delete a task | | | |
| 8 | Invalid input | | | |
| 9 | Invalid task ID | | | |
| 10 | Database/server errors | | | |

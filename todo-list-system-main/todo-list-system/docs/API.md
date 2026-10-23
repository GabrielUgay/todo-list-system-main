# API Documentation

**Base URL:** `http://localhost:5000/api`

All responses are JSON in this format:

```json
// Success
{ "success": true, "message": "Task created", "data": { ... } }

// Error
{ "success": false, "message": "Task title cannot be empty" }
```

## Endpoints Summary

| Method | Endpoint | What it does |
|---|---|---|
| GET | `/api/health` | Checks if the server and database are running |
| GET | `/api/tasks` | Gets all tasks (newest first). Optional filters `?status=` and `?priority=` |
| GET | `/api/tasks/:id` | Gets one task |
| POST | `/api/tasks` | Creates a task (with an optional file) |
| PUT | `/api/tasks/:id` | Updates a task (and optionally replaces or removes its file) |
| PATCH | `/api/tasks/:id/complete` | Sets status to **Completed** |
| PATCH | `/api/tasks/:id/pending` | Sets status back to **Pending** |
| DELETE | `/api/tasks/:id` | Deletes a task and its uploaded file |
| GET | `/uploads/:filename` | Opens an uploaded file (not under `/api`) |

> **Design note:** the original plan had only `/complete`. We added `/pending` so "undo" is just as clear, instead of one endpoint that flips the status (a toggle can give the wrong result if the button is clicked twice).

---

## Task object

```json
{
  "_id": "66f5a1c2e4b0a1b2c3d4e5f6",
  "title": "Finish math assignment",
  "description": "Chapter 5, numbers 1-20",
  "dueDate": "2026-09-30T00:00:00.000Z",
  "priority": "High",
  "status": "Pending",
  "file": {
    "originalName": "assignment.pdf",
    "filename": "1727340000000-123456789.pdf",
    "path": "/uploads/1727340000000-123456789.pdf",
    "mimetype": "application/pdf",
    "size": 204800
  },
  "createdAt": "2026-09-26T10:00:00.000Z",
  "updatedAt": "2026-09-26T10:00:00.000Z",
  "__v": 0
}
```
`file` is `null` when no file is attached. `dueDate` is `null` when there is no due date.

---

## GET /api/health

Response `200` (or `503` if the database is down):
```json
{ "success": true, "server": "running", "database": "connected" }
```

## GET /api/tasks

Query parameters (optional):

| Name | Values |
|---|---|
| `status` | `Pending`, `Completed` |
| `priority` | `Low`, `Medium`, `High` |

Example: `GET /api/tasks?status=Pending`

Response `200`:
```json
{ "success": true, "count": 2, "data": [ { ...task }, { ...task } ] }
```

## GET /api/tasks/:id

Response `200`: `{ "success": true, "data": { ...task } }`
Errors: `400` invalid ID, `404` not found.

## POST /api/tasks

Body: **`multipart/form-data`** (use `FormData`) or JSON if there is no file.

| Field | Required | Rules |
|---|---|---|
| `title` | ✅ | 1–100 characters |
| `description` | | max 500 characters |
| `dueDate` | | valid date, e.g. `2026-09-30`; empty = no due date |
| `priority` | | `Low`, `Medium`, `High` (default `Medium`) |
| `status` | | `Pending`, `Completed` (default `Pending`) |
| `file` | | PDF, DOC, DOCX, JPG, JPEG, PNG, GIF, WEBP, TXT — max 5 MB |

Response `201`: `{ "success": true, "message": "Task created", "data": { ...task } }`
Errors: `400` validation error or invalid file type/size.

## PUT /api/tasks/:id

Same fields as POST, but **all are optional** — only send what changes.

Extra field:

| Field | Meaning |
|---|---|
| `removeFile` | `"true"` removes the current attachment |

Sending a new `file` replaces the old one (the old file is deleted from disk).

Response `200`: `{ "success": true, "message": "Task updated", "data": { ...task } }`
Errors: `400`, `404`.

## PATCH /api/tasks/:id/complete

No body. Response `200`: `{ "success": true, "message": "Task marked as Completed", "data": { ...task } }`

## PATCH /api/tasks/:id/pending

No body. Response `200`: `{ "success": true, "message": "Task marked as Pending", "data": { ...task } }`

## DELETE /api/tasks/:id

Response `200`: `{ "success": true, "message": "Task deleted", "data": { "id": "..." } }`
Errors: `400`, `404`.

---

## Status Codes

| Code | Meaning | Example |
|---|---|---|
| 200 | OK | Task found / updated / deleted |
| 201 | Created | Task created |
| 400 | Bad Request | Empty title, wrong priority, invalid date, bad file type, invalid ID like `123` |
| 404 | Not Found | Task ID does not exist, or unknown route |
| 500 | Server Error | Unexpected bug (details are printed in the server terminal) |
| 503 | Service Unavailable | MongoDB is not connected |

## Validation — where it happens

| Check | Frontend (`script.js`) | Server |
|---|---|---|
| Title required / length | ✅ | ✅ controller + model |
| Description length | ✅ | ✅ controller + model |
| Valid due date | ✅ | ✅ controller |
| Priority/status values | (dropdowns) | ✅ controller + model `enum` |
| File type and size | ✅ | ✅ Multer `fileFilter` + `limits` |
| Invalid task ID | — | ✅ `validateObjectId` middleware |
| DB/server errors | shows message | ✅ `errorHandler` + DB check in `server.js` |

The frontend checks are for a nicer experience; the **server checks are the real protection** because anyone can call the API directly with Postman.

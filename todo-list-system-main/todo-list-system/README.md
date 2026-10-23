# 📝 To-Do List Management System

A simple web application for managing daily tasks. Users can **create, view, update, delete, upload files to, and complete** tasks.

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, vanilla JavaScript (`fetch()` + `FormData`) |
| Backend | Node.js + Express.js (REST API) |
| Database | MongoDB with Mongoose |
| File uploads | Multer (files saved in `server/uploads/`) |
| Containerization | Docker (optional, handled by one member — see [docs/DOCKER.md](docs/DOCKER.md)) |

---

## 1. System Architecture

```
┌──────────────────────────────┐
│  Browser                     │  client/index.html, css/style.css
│  HTML / CSS / JavaScript     │  js/script.js  (UI)
│                              │  js/api.js     (all fetch() calls)
└──────────────┬───────────────┘
               │  HTTP requests with fetch()  (JSON or FormData)
               ▼
┌──────────────────────────────┐
│  Express.js REST API         │  server/routes/taskRoutes.js
│  /api/tasks                  │  server/middleware/ (upload, validation, errors)
└──────────────┬───────────────┘
               │  calls controller functions
               ▼
┌──────────────────────────────┐
│  Node.js Server              │  server/server.js
│  Controllers + Mongoose      │  server/controllers/taskController.js
│                              │  server/models/Task.js
└──────────────┬───────────────┘
               │  Mongoose queries
               ▼
┌──────────────────────────────┐
│  MongoDB                     │  database: todo_db, collection: tasks
└──────────────────────────────┘
        Uploaded files → server/uploads/  (MongoDB stores only the file info)
```

### How the parts communicate

1. The user fills in the form in the browser. `script.js` validates it and builds a `FormData` object (text fields + optional file).
2. `api.js` sends it with `fetch()` to the Express server, e.g. `POST /api/tasks`.
3. Express runs the route's middleware: **Multer** saves the file to `server/uploads/`, and invalid IDs are rejected.
4. The **controller** validates the fields and uses the **Mongoose model** to save the task in **MongoDB**.
5. The server replies with **JSON** (`{ success, message, data }`). The browser reloads the task list and shows a success or error message.

The same Express server also serves the frontend (`client/`) and the uploaded files (`/uploads/...`), so everything runs at **http://localhost:5000**.

---

## 2. Folder Structure

```
todo-list-system/
│
├── client/                         ← FRONTEND (Member 1 & 2)
│   ├── index.html                  Page layout: form + task list
│   ├── css/
│   │   └── style.css               All styles
│   └── js/
│       ├── api.js                  All fetch() calls to the server
│       └── script.js               UI logic: form, buttons, rendering
│
├── server/                         ← BACKEND (Member 3 & 4)
│   ├── server.js                   Entry point: Express app, static files, start
│   ├── config/
│   │   └── db.js                   MongoDB connection (Mongoose)
│   ├── models/
│   │   └── Task.js                 Task schema + validation
│   ├── routes/
│   │   └── taskRoutes.js           URL → controller mapping
│   ├── controllers/
│   │   └── taskController.js       CRUD + status logic
│   ├── middleware/
│   │   ├── upload.js               Multer file upload settings
│   │   ├── validateObjectId.js     Rejects invalid task IDs
│   │   └── errorHandler.js         Turns errors into JSON messages
│   └── uploads/                    Uploaded files are saved here
│       └── .gitkeep
│
├── tests/
│   └── api-test.js                 Automatic API tests (npm run test:api)
│
├── docs/
│   ├── API.md                      API documentation
│   ├── TESTING.md                  Testing instructions
│   ├── TEAM-GUIDE.md               Work division + Git workflow
│   └── DOCKER.md                   Docker setup (Docker member only)
│
├── Dockerfile                      ← DOCKER (Member 5 only)
├── docker-compose.yml
├── .dockerignore
│
├── .env                            Your local settings (NOT committed)
├── .env.example                    Template for .env (committed)
├── .gitignore
├── nodemon.json                    Auto-restart settings for development
├── package.json
└── README.md
```

---

## 3. Getting Started (without Docker)

### Requirements
- **Node.js 18 or newer** — check with `node -v`
- **MongoDB**, either:
  - installed locally ([MongoDB Community Server](https://www.mongodb.com/try/download/community)), or
  - a free **MongoDB Atlas** cluster (cloud)
- Optional: [MongoDB Compass](https://www.mongodb.com/products/compass) to look at the data

### Steps

```bash
# 1. Go into the project folder
cd todo-list-system

# 2. Install packages
npm install

# 3. Create your .env file from the template
cp .env.example .env          # Windows: copy .env.example .env

# 4. Edit .env if needed (MongoDB Atlas users: paste your connection string)

# 5. Make sure MongoDB is running, then start the server
npm run dev                   # auto-restarts when you edit server files
# or
npm start                     # normal start
```

You should see:
```
✅ MongoDB connected: 127.0.0.1/todo_db
🚀 Server running at http://localhost:5000
```

Open **http://localhost:5000** in your browser.

> Tip: always open the app through `http://localhost:5000`. If you use VS Code Live Server (port 5500) instead, `api.js` automatically sends requests to `http://localhost:5000`, but the Express server must still be running.

---

## 4. NPM Packages

| Package | Type | What it is used for |
|---|---|---|
| `express` | dependency | Web server and REST API routing |
| `mongoose` | dependency | Connects to MongoDB, defines the Task schema, validates data |
| `dotenv` | dependency | Loads settings (PORT, MONGODB_URI) from the `.env` file |
| `cors` | dependency | Lets the browser call the API from another origin (e.g. Live Server) |
| `multer` | dependency | Handles `multipart/form-data` file uploads and saves files to disk |
| `nodemon` | devDependency | Restarts the server automatically when you change code |

No other packages are needed. The tests use Node's built-in `fetch`.

### npm scripts

| Command | What it does |
|---|---|
| `npm start` | Starts the server with Node |
| `npm run dev` | Starts the server with nodemon (auto-restart) |
| `npm run test:api` | Runs the automatic API tests (server must be running) |

---

## 5. Features

| Feature | How it works |
|---|---|
| **Create task** | Form → `POST /api/tasks` (FormData). Title, description, due date, priority, optional file. Status starts as *Pending*; `createdAt` is set automatically. |
| **View tasks** | `GET /api/tasks` on page load and after every change. Filter buttons: All / Pending / Completed. |
| **Update task** | *Edit* loads the task into the form → `PUT /api/tasks/:id`. Title, description, due date, priority, status, and file can be changed. |
| **Upload file** | Choose a file in the form. Allowed: PDF, DOC, DOCX, JPG, PNG, GIF, WEBP, TXT (max 5 MB). |
| **Complete / Pending** | `PATCH /api/tasks/:id/complete` and `PATCH /api/tasks/:id/pending`. Completed tasks have a green bar, a ✔ badge, and a crossed-out title. |
| **Delete task** | `DELETE /api/tasks/:id` — also deletes the uploaded file. |
| **Errors** | Every error from the server is shown in a red message box at the top of the page. |

### Where are uploaded files stored?

- **Multer** saves each file in **`server/uploads/`** with a unique name like `1727340000000-123456789.pdf`, so files never overwrite each other.
- **MongoDB stores only the file information** in the task's `file` field: original name, saved filename, URL path, type, and size.
- **`server.js` serves the folder** with `app.use('/uploads', express.static(...))`, so the file is opened at `http://localhost:5000/uploads/<filename>`.
- When a task is deleted, or its file is replaced/removed, the old file is deleted from the folder too.
- `server/uploads/*` is in `.gitignore`: uploaded files are **not** shared through Git. Each member has their own local files.

---

## 6. Task Model (MongoDB)

| Field | Type | Rules |
|---|---|---|
| `title` | String | Required, 1–100 characters, trimmed |
| `description` | String | Optional, max 500 characters |
| `dueDate` | Date | Optional, must be a valid date |
| `priority` | String | `Low`, `Medium` (default), `High` |
| `status` | String | `Pending` (default), `Completed` |
| `file` | Object | Optional: `originalName`, `filename`, `path`, `mimetype`, `size` |
| `createdAt` | Date | Automatic |
| `updatedAt` | Date | Automatic |

---

## 7. Documentation

- 📘 **API documentation** → [docs/API.md](docs/API.md)
- 🧪 **Testing instructions** → [docs/TESTING.md](docs/TESTING.md)
- 👥 **Team work division & Git workflow** → [docs/TEAM-GUIDE.md](docs/TEAM-GUIDE.md)
- 🐳 **Docker setup (Docker member)** → [docs/DOCKER.md](docs/DOCKER.md)

---

## 8. Assumptions

1. **No login/users.** Everyone who opens the app sees the same task list (no authentication, as requested).
2. **One file per task.** Uploading a new file while editing replaces the old one.
3. **Past due dates are allowed** (a task can be overdue). Overdue pending tasks are shown in red.
4. **Two statuses only:** `Pending` and `Completed`.
5. **Delete is included** because the task list requires a Delete button, even though the project description lists only create/read/update.
6. **Files are stored on the server's disk**, not inside MongoDB — simpler and the usual approach for small projects.
7. **Max upload size is 5 MB** (change `MAX_FILE_SIZE_MB` in `.env` and `client/js/script.js`).

---

## 9. Troubleshooting

| Problem | Fix |
|---|---|
| `❌ Could not connect to MongoDB` | MongoDB is not running, or `MONGODB_URI` in `.env` is wrong. Start MongoDB (Windows: *Services → MongoDB Server*; Mac: `brew services start mongodb-community`). For Atlas, allow your IP under *Network Access*. |
| `❌ MONGODB_URI is missing` | You have no `.env` file. Run `cp .env.example .env`. |
| `EADDRINUSE: port 5000` | Another program uses port 5000. Change `PORT` in `.env` (e.g. 5001). On Mac, *AirPlay Receiver* often uses 5000. |
| Page says *Cannot connect to the server* | The Node server is not running. Run `npm run dev`. |
| Page says *Database is unavailable* | The server is running but MongoDB stopped. Start MongoDB again. |
| `localhost` MongoDB fails on Node 18+ | Use `127.0.0.1` instead of `localhost` in `MONGODB_URI`. |

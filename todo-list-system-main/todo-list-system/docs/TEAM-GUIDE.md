# Team Guide — Work Division & Git Workflow

## Work Division (5 members)

Each member **owns** specific files. Only the owner edits them regularly; others ask first. This avoids most Git merge conflicts.

| Member | Role | Main files (owns) | Tasks |
|---|---|---|---|
| **Member 1** | UI / HTML & CSS | `client/index.html`, `client/css/style.css` | Page layout, form, task card design, completed vs pending look, mobile layout |
| **Member 2** | Frontend JavaScript | `client/js/script.js`, `client/js/api.js` | `fetch()` calls, `FormData`, rendering tasks, edit mode, buttons, error messages, refresh after changes |
| **Member 3** | Node.js / Express API | `server/server.js`, `server/routes/taskRoutes.js`, `server/controllers/taskController.js`, `server/middleware/*` | Endpoints, Multer uploads, input validation, error handling, API docs (`docs/API.md`) |
| **Member 4** | MongoDB / Mongoose | `server/config/db.js`, `server/models/Task.js`, `.env.example` | Database connection, Task schema & validation, MongoDB/Atlas setup, Compass checks, testing (`docs/TESTING.md`, `tests/`) |
| **Member 5** | Docker | `Dockerfile`, `docker-compose.yml`, `.dockerignore`, `docs/DOCKER.md` | Containerize app + MongoDB. Does **not** change app code; asks Member 3/4 if something must change |

**Shared files** (edit carefully, one person at a time, tell the group first):
`package.json`, `README.md`, `.gitignore`

> Only one person should run `npm install <package>` (it changes `package.json` and `package-lock.json`). Suggestion: **Member 3**. Everyone else just runs `npm install` after pulling.

### How the parts connect (the "contract")

Members 2 and 3 must agree on the API — it is written in `docs/API.md`. If Member 3 changes an endpoint or a field name, update `docs/API.md` **and** tell Member 2.

Members 3 and 4 must agree on field names in `server/models/Task.js` (`title`, `description`, `dueDate`, `priority`, `status`, `file`).

Member 1 and 2 must agree on HTML `id`s and CSS class names used by `script.js` (for example `task-form`, `task-list`, `.task-item.completed`). Don't rename an `id` without telling Member 2.

### Suggested order

| Step | Who | What |
|---|---|---|
| 1 | Member 4 | Set up MongoDB (local or Atlas), share how to connect (not the password — send it privately) |
| 2 | Member 3 | Server runs, API works in Postman |
| 3 | Member 1 | HTML/CSS page (can start at the same time as step 2) |
| 4 | Member 2 | Connect page to API with `fetch()` |
| 5 | Everyone | Run all tests in `docs/TESTING.md` |
| 6 | Member 5 | Docker setup after the app works without Docker |

---

## Git Workflow

### One-time setup (group leader)
```bash
git init
git add .
git commit -m "Initial project structure"
git branch -M main
git remote add origin https://github.com/<your-group>/todo-list-system.git
git push -u origin main
```
Add every member as a collaborator on GitHub (*Settings → Collaborators*).

### Each member
```bash
git clone https://github.com/<your-group>/todo-list-system.git
cd todo-list-system
npm install
cp .env.example .env        # Windows: copy .env.example .env
```

### Daily workflow — one branch per member/feature
```bash
git checkout main
git pull                              # 1. get the latest code
git checkout -b feature/ui-styles     # 2. your own branch

# ... work on YOUR files ...

git add client/css/style.css          # 3. add only your files
git commit -m "Style completed tasks"
git push -u origin feature/ui-styles  # 4. push your branch
```
5. On GitHub, open a **Pull Request** into `main`. Another member reviews and merges it.

Branch name ideas: `feature/ui`, `feature/frontend-js`, `feature/api`, `feature/database`, `feature/docker`.

### Rules that prevent problems
1. **Pull before you start working** every day.
2. **Never commit `.env`** (it is in `.gitignore`). Share passwords privately.
3. **Never commit `node_modules/`** or uploaded files.
4. **Small commits** with clear messages, e.g. `Add due date validation`.
5. **Stay in your own files.** If you must edit someone else's file, tell them first.
6. **Don't push directly to `main`** — use Pull Requests.

### Fixing a merge conflict
If Git says `CONFLICT`, open the file and look for:
```
<<<<<<< HEAD
your version
=======
their version
>>>>>>> main
```
Keep the correct code, delete the marker lines, then:
```bash
git add <file>
git commit -m "Resolve merge conflict"
```

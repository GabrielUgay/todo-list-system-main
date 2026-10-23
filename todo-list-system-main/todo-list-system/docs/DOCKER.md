# Docker Setup (for the Docker member only)

> **Other members do NOT need Docker.** The app runs normally with `npm run dev` + a local MongoDB or Atlas (see README). Docker is an extra way to run the same app.

## What Docker does here

| Container | Image | Purpose |
|---|---|---|
| `todo-app` | built from our `Dockerfile` | Node.js + Express server + frontend |
| `todo-mongo` | official `mongo:7` | MongoDB database |

Both containers are started together with **Docker Compose**. They talk over a private Docker network, where the app reaches the database using the service name **`mongo`**:
```
MONGODB_URI=mongodb://mongo:27017/todo_db
```
(Without Docker, the URI is `mongodb://127.0.0.1:27017/todo_db` — that is why this value is set in `docker-compose.yml`, not in `.env`.)

## Files the Docker member owns

| File | Purpose |
|---|---|
| `Dockerfile` | Recipe to build the app image (Node 20 Alpine → `npm install --omit=dev` → copy code → `node server/server.js`) |
| `docker-compose.yml` | Runs the app + MongoDB, sets environment variables, ports, and volumes |
| `.dockerignore` | Keeps `node_modules`, `.env`, uploads, docs, and tests out of the image |

## Requirements
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/Mac) or Docker Engine + Compose plugin (Linux)
- Check: `docker --version` and `docker compose version`

## Build and run

```bash
# From the project folder (where docker-compose.yml is)
docker compose up --build          # build image + start both containers
# or in the background:
docker compose up --build -d
```

Open **http://localhost:5000**. Health check: http://localhost:5000/api/health

## Useful commands

| Command | What it does |
|---|---|
| `docker compose up --build -d` | Build and start in the background |
| `docker compose ps` | Show running containers |
| `docker compose logs -f app` | Show server logs (live) |
| `docker compose logs -f mongo` | Show database logs |
| `docker compose restart app` | Restart only the app |
| `docker compose down` | Stop and remove containers (**data is kept**) |
| `docker compose down -v` | Stop and **delete all data** (tasks + uploads) |
| `docker compose exec mongo mongosh todo_db` | Open the MongoDB shell, e.g. `db.tasks.find()` |
| `docker compose exec app sh` | Open a shell inside the app container |

## Environment variables

Set in `docker-compose.yml` under `app → environment`:

| Variable | Value in Docker | Meaning |
|---|---|---|
| `PORT` | `5000` | Port inside the container |
| `MONGODB_URI` | `mongodb://mongo:27017/todo_db` | `mongo` = database service name |
| `MAX_FILE_SIZE_MB` | `5` | Upload limit |
| `CLIENT_ORIGIN` | `*` | CORS setting |

The `.env` file is **not** copied into the image (see `.dockerignore`). Values from `docker-compose.yml` are used instead.

**Using MongoDB Atlas instead of the mongo container:** remove the `mongo` service and `depends_on`, and set `MONGODB_URI` to your Atlas string. To avoid putting the password in the file, use `env_file: .env` under `app` instead of the `MONGODB_URI` line.

## Data persistence (volumes)

| Volume | Mounted at | Keeps |
|---|---|---|
| `mongo-data` | `/data/db` (mongo) | All tasks |
| `uploads-data` | `/app/server/uploads` (app) | Uploaded files |

Data survives `docker compose down` and restarts. Only `docker compose down -v` deletes it.

## Without Compose (optional, manual way)

```bash
docker network create todo-net
docker run -d --name todo-mongo --network todo-net -v mongo-data:/data/db mongo:7
docker build -t todo-app .
docker run -d --name todo-app --network todo-net -p 5000:5000 \
  -e MONGODB_URI=mongodb://todo-mongo:27017/todo_db \
  -v uploads-data:/app/server/uploads todo-app
```

## Testing inside Docker
With the containers running, the same tests work from your computer:
```bash
npm run test:api
```
Database error test: `docker stop todo-mongo` → the app shows "Database is unavailable". `docker start todo-mongo` → it reconnects.

## Troubleshooting

| Problem | Fix |
|---|---|
| `port is already allocated` (5000 or 27017) | Stop the local server/MongoDB, or change the left side of `ports`, e.g. `"5001:5000"` → open http://localhost:5001 |
| App says *Could not connect to MongoDB* on first start | MongoDB was still starting. Run `docker compose restart app` (the app also has `restart: unless-stopped`) |
| Code changes not showing | Rebuild: `docker compose up --build` |
| Start completely fresh | `docker compose down -v` then `docker compose up --build` |

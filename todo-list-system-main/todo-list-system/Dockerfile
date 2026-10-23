# =============================================================
# Dockerfile — builds an image of the To-Do List app (Node.js + Express)
# Managed by the Docker member. The app still runs WITHOUT Docker.
# =============================================================

# 1. Start from an official, small Node.js image
FROM node:20-alpine

# 2. Folder inside the container where the app lives
WORKDIR /app

# 3. Install dependencies first (better build caching)
COPY package*.json ./
RUN npm install --omit=dev

# 4. Copy the rest of the project (see .dockerignore for what is skipped)
COPY . .

# 5. Make sure the uploads folder exists
RUN mkdir -p server/uploads

# 6. The port the server listens on
ENV PORT=5000
EXPOSE 5000

# 7. Start the server
CMD ["node", "server/server.js"]

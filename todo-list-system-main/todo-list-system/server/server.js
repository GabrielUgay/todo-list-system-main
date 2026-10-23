// =============================================================
// server.js — entry point of the backend
//
// Flow:  Browser (client/)  --fetch()-->  Express REST API (/api/tasks)
//        --> controllers  --> Mongoose  --> MongoDB
//
// This one server does three jobs:
//   1. Serves the frontend (client/ folder) at  http://localhost:5000
//   2. Serves uploaded files at                  http://localhost:5000/uploads/...
//   3. Provides the REST API at                  http://localhost:5000/api/tasks
// =============================================================
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const connectDB = require('./config/db');
const taskRoutes = require('./routes/taskRoutes');
const { UPLOAD_DIR } = require('./middleware/upload');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const { rateLimit } = require("express-rate-limit");

const app = express();
const PORT = process.env.PORT || 5000;

// Source used: https://www.npmjs.com/package/express-rate-limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  ipv6Subnet: 56
})

// ---------- Use Rate Limiting ----------
app.use(limiter)

// ---------- Global middleware ----------
app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' })); // allow the frontend to call the API
app.use(express.json());                                      // read JSON bodies
app.use(express.urlencoded({ extended: true }));              // read normal form bodies

// Simple request logger (helps when testing)
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) console.log(`${req.method} ${req.originalUrl}`);
  next();
});

// ---------- Static files ----------
app.use(express.static(path.join(__dirname, '..', 'client'))); // the frontend
app.use('/uploads', express.static(UPLOAD_DIR));               // uploaded files

// ---------- API ----------

// Health check: is the server up, and is the database connected?
app.get('/api/health', (req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const dbState = states[mongoose.connection.readyState] || 'unknown';
  res.status(dbState === 'connected' ? 200 : 503).json({
    success: dbState === 'connected',
    server: 'running',
    database: dbState,
  });
});

// If the database is down, answer immediately with a clear message
app.use('/api/tasks', (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Database is unavailable. Please try again later.',
    });
  }
  next();
});

app.use('/api/tasks', taskRoutes);

// ---------- Errors ----------
app.use('/api', notFound);  // unknown /api/... routes
app.use(errorHandler);      // every other error

// ---------- Start ----------
async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`API:      http://localhost:${PORT}/api/tasks`);
    console.log(`Health:   http://localhost:${PORT}/api/health`);
  });
}

start();

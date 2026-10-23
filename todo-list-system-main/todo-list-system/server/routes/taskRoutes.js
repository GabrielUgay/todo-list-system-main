// =============================================================
// routes/taskRoutes.js
// Maps each URL + HTTP method to a controller function.
// All routes here start with /api/tasks (see server.js).
// =============================================================
const express = require('express');
const router = express.Router();

const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  completeTask,
  markTaskPending,
  deleteTask,
} = require('../controllers/taskController');
const { uploadSingleFile } = require('../middleware/upload');
const validateObjectId = require('../middleware/validateObjectId');

// /api/tasks
router
  .route('/')
  .get(getTasks)                          // View all tasks
  .post(uploadSingleFile, createTask);    // Create a task (+ optional file)

// /api/tasks/:id
router
  .route('/:id')
  .get(validateObjectId, getTaskById)                        // View one task
  .put(validateObjectId, uploadSingleFile, updateTask)       // Update a task (+ optional new file)
  .delete(validateObjectId, deleteTask);                     // Delete a task

// Status changes
router.patch('/:id/complete', validateObjectId, completeTask);   // Mark as Completed
router.patch('/:id/pending', validateObjectId, markTaskPending); // Change back to Pending

module.exports = router;

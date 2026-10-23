// =============================================================
// controllers/taskController.js
// The actual logic for each API endpoint (CRUD + status + upload).
// Every function either sends a JSON response or passes an error
// to the error handler with next(error).
// =============================================================
const Task = require('../models/Task');
const { PRIORITIES, STATUSES } = require('../models/Task');
const { deleteUploadedFile } = require('../middleware/upload');

// Source: https://www.npmjs.com/package/xss-filters:
const xssFilters = require("xss-filters");

// ---------- Helpers ----------

// Build the "file" object saved in MongoDB from Multer's req.file
function buildFileInfo(file) {
  return {
    originalName: file.originalname,
    filename: file.filename,
    path: `/uploads/${file.filename}`,
    mimetype: file.mimetype,
    size: file.size,
  };
}

// Create an error with an HTTP status code
function httpError(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

// Validate and clean the fields sent by the client.
// isUpdate = true means fields are optional (only send what changed).
function validateTaskInput(body, isUpdate = false) {
  const errors = [];
  const data = {};

  // Title
  if (body.title !== undefined || !isUpdate) {
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (!title) errors.push('Task title cannot be empty');
    else if (title.length > 100) errors.push('Task title must be 100 characters or less');
    else data.title = xssFilters.inHTMLData(title);
  }

  // Description
  if (body.description !== undefined) {
    const description = String(body.description).trim();
    if (description.length > 500) errors.push('Description must be 500 characters or less');
    else data.description = xssFilters.inHTMLData(description);
  }

  // Due date ("" means no due date)
  if (body.dueDate !== undefined) {
    if (body.dueDate === '' || body.dueDate === null) {
      data.dueDate = null;
    } else {
      const date = new Date(body.dueDate);
      if (Number.isNaN(date.getTime())) errors.push('Due date is not a valid date');
      else data.dueDate = date;
    }
  }

  // Priority
  if (body.priority !== undefined && body.priority !== '') {
    if (!PRIORITIES.includes(body.priority)) {
      errors.push('Priority must be one of: ' + PRIORITIES.join(', '));
    } else data.priority = body.priority;
  }

  // Status
  if (body.status !== undefined && body.status !== '') {
    if (!STATUSES.includes(body.status)) {
      errors.push('Status must be one of: ' + STATUSES.join(', '));
    } else data.status = body.status;
  }

  return { errors, data };
}

// ---------- Controllers ----------

// GET /api/tasks  — list all tasks (optional filters: ?status=Pending&priority=High)
async function getTasks(req, res, next) {
  try {
    const filter = {};
    const { status, priority } = req.query;

    if (status) {
      if (!STATUSES.includes(status)) {
        throw httpError(400, 'Status filter must be one of: ' + STATUSES.join(', '));
      }
      filter.status = status;
    }
    if (priority) {
      if (!PRIORITIES.includes(priority)) {
        throw httpError(400, 'Priority filter must be one of: ' + PRIORITIES.join(', '));
      }
      filter.priority = priority;
    }

    // Newest tasks first
    const tasks = await Task.find(filter).sort({ createdAt: -1 });

    res.json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    next(error);
  }
}

// GET /api/tasks/:id  — get one task
async function getTaskById(req, res, next) {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) throw httpError(404, 'Task not found');

    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
}

// POST /api/tasks  — create a task (multipart/form-data or JSON)
async function createTask(req, res, next) {
  try {
    const { errors, data } = validateTaskInput(req.body, false);
    if (errors.length) {
      return next(Object.assign(httpError(400, errors.join('. ')), { errors }));
    }

    data.title

    if (req.file) data.file = buildFileInfo(req.file);

    const task = await Task.create(data);

    res.status(201).json({ success: true, message: 'Task created', data: task });
  } catch (error) {
    next(error);
  }
}

// PUT /api/tasks/:id  — update a task (title, description, dueDate, priority, status, file)
// Send removeFile=true to delete the current attachment.
async function updateTask(req, res, next) {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) throw httpError(404, 'Task not found');

    const { errors, data } = validateTaskInput(req.body, true);
    if (errors.length) {
      return next(Object.assign(httpError(400, errors.join('. ')), { errors }));
    }

    const oldFilename = task.file ? task.file.filename : null;
    const removeFile = req.body.removeFile === 'true' || req.body.removeFile === true;

    Object.assign(task, data);

    if (req.file) {
      task.file = buildFileInfo(req.file); // replace with the new file
    } else if (removeFile) {
      task.file = null;
    }

    await task.save(); // runs the model validation again

    // Only delete the old file after the database was updated successfully
    if (oldFilename && (req.file || removeFile)) deleteUploadedFile(oldFilename);

    res.json({ success: true, message: 'Task updated', data: task });
  } catch (error) {
    next(error);
  }
}

// PATCH /api/tasks/:id/complete  — mark as Completed
// PATCH /api/tasks/:id/pending   — change back to Pending
function setStatus(newStatus) {
  return async function (req, res, next) {
    try {
      const task = await Task.findByIdAndUpdate(
        req.params.id,
        { status: newStatus },
        { new: true, runValidators: true }
      );
      if (!task) throw httpError(404, 'Task not found');

      res.json({ success: true, message: `Task marked as ${newStatus}`, data: task });
    } catch (error) {
      next(error);
    }
  };
}

// DELETE /api/tasks/:id  — delete a task and its uploaded file
async function deleteTask(req, res, next) {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) throw httpError(404, 'Task not found');

    if (task.file) deleteUploadedFile(task.file.filename);

    res.json({ success: true, message: 'Task deleted', data: { id: task._id } });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  completeTask: setStatus('Completed'),
  markTaskPending: setStatus('Pending'),
  deleteTask,
};

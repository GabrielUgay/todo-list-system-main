// =============================================================
// models/Task.js
// Defines the shape of a "task" document stored in MongoDB.
// Mongoose validates every task before saving it.
// =============================================================
const mongoose = require('mongoose');

// Allowed values (exported so the controller can reuse them)
const PRIORITIES = ['Low', 'Medium', 'High'];
const STATUSES = ['Pending', 'Completed'];

// Information about an uploaded file (sub-document)
const fileSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true }, // name on the user's computer
    filename: { type: String, required: true },     // name saved in server/uploads
    path: { type: String, required: true },         // URL path, e.g. /uploads/abc.pdf
    mimetype: { type: String, required: true },     // e.g. application/pdf
    size: { type: Number, required: true },         // in bytes
  },
  { _id: false }
);

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      minlength: [1, 'Task title cannot be empty'],
      maxlength: [100, 'Task title must be 100 characters or less'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Description must be 500 characters or less'],
    },
    dueDate: {
      type: Date,
      default: null,
    },
    priority: {
      type: String,
      enum: {
        values: PRIORITIES,
        message: 'Priority must be one of: ' + PRIORITIES.join(', '),
      },
      default: 'Medium',
    },
    status: {
      type: String,
      enum: {
        values: STATUSES,
        message: 'Status must be one of: ' + STATUSES.join(', '),
      },
      default: 'Pending',
    },
    file: {
      type: fileSchema,
      default: null,
    },
  },
  {
    // Automatically adds createdAt and updatedAt fields
    timestamps: true,
  }
);

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
module.exports.PRIORITIES = PRIORITIES;
module.exports.STATUSES = STATUSES;

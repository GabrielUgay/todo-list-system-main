// =============================================================
// middleware/validateObjectId.js
// Checks that :id in the URL is a valid MongoDB ObjectId
// BEFORE we query the database. Example of an invalid ID: /api/tasks/123
// =============================================================
const mongoose = require('mongoose');

function validateObjectId(req, res, next) {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: `Invalid task ID: "${req.params.id}"`,
    });
  }
  next();
}

module.exports = validateObjectId;

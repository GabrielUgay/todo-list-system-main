// =============================================================
// middleware/errorHandler.js
// Central place that turns ANY error into a JSON response.
// Controllers just call next(error) and this file decides
// the status code and the message shown to the user.
// =============================================================
const mongoose = require('mongoose');
const { deleteUploadedFile } = require('./upload');

// 404 for unknown API routes, e.g. GET /api/something
function notFound(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // If a file was uploaded but the request failed, remove the file
  if (req.file) deleteUploadedFile(req.file.filename);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong on the server';
  let errors;

  // Mongoose validation error (e.g. empty title, wrong priority)
  if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    errors = Object.values(err.errors).map((e) => e.message);
    message = errors.join('. ');
  }

  // Mongoose cast error (e.g. invalid date or invalid ObjectId)
  else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid value for "${err.path}": ${JSON.stringify(err.value)}`;
  }

  // Invalid JSON body sent to the API
  else if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Invalid JSON in request body';
  }

  // Database is not reachable
  else if (
    err.name === 'MongoServerSelectionError' ||
    err.name === 'MongoNetworkError' ||
    /buffering timed out/i.test(err.message || '')
  ) {
    statusCode = 503;
    message = 'Database is unavailable. Please try again later.';
  }

  if (statusCode >= 500) {
    console.error('🔥 Server error:', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
  });
}

module.exports = { notFound, errorHandler };

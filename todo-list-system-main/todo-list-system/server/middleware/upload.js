// =============================================================
// middleware/upload.js
// File upload handling with Multer.
//
// WHERE FILES ARE STORED:
//   Files are saved on the server's disk in the folder  server/uploads/
//   Each file gets a unique name (timestamp + random number) so two
//   users uploading "notes.pdf" never overwrite each other.
//
// HOW THE SERVER ACCESSES THEM:
//   server.js serves that folder at the URL  /uploads
//   so a file saved as  server/uploads/1712345-123.pdf
//   is opened in the browser at  http://localhost:5000/uploads/1712345-123.pdf
//   MongoDB only stores the file INFO (name, path, type, size), not the file itself.
// =============================================================
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
const MAX_FILE_SIZE_MB = Number(process.env.MAX_FILE_SIZE_MB) || 5;

// Make sure the uploads folder exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Allowed file types: PDF, Word documents, images, and plain text
const ALLOWED_TYPES = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'text/plain': '.txt',
};
const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.txt'];

// 1) Where and how to save the file
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

// 2) Reject files that are not in the allowed list
function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  const typeOk = Object.prototype.hasOwnProperty.call(ALLOWED_TYPES, file.mimetype);
  const extOk = ALLOWED_EXTENSIONS.includes(ext);

  if (typeOk && extOk) {
    cb(null, true);
  } else {
    const err = new Error('Invalid file type. Allowed: PDF, DOC, DOCX, JPG, PNG, GIF, WEBP, TXT');
    err.statusCode = 400;
    cb(err);
  }
}

// 3) Build the Multer instance
const multerUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 },
});

// 4) Wrap it so Multer errors become friendly JSON messages
//    The form field name for the file must be "file".
function uploadSingleFile(req, res, next) {
  multerUpload.single('file')(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        err.message = `File is too large. Maximum size is ${MAX_FILE_SIZE_MB} MB`;
      } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        err.message = 'Unexpected file field. Use the field name "file"';
      }
      err.statusCode = 400;
    }
    next(err);
  });
}

// Helper: delete a file from the uploads folder (used on update/delete)
function deleteUploadedFile(filename) {
  if (!filename) return;
  const filePath = path.join(UPLOAD_DIR, path.basename(filename));
  fs.unlink(filePath, (err) => {
    if (err && err.code !== 'ENOENT') {
      console.warn('Could not delete file:', filePath, err.message);
    }
  });
}

module.exports = { uploadSingleFile, deleteUploadedFile, UPLOAD_DIR };

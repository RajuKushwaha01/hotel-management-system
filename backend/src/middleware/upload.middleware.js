const multer = require('multer');
const path = require('path');
const ApiError = require('../utils/ApiError');

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const storage = multer.memoryStorage(); // buffer in memory, then upload to Cloudinary from the controller

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new ApiError(400, `File type ${file.mimetype} is not allowed. Use JPEG, PNG, WEBP, or PDF.`), false);
  }
  // Reject double-extension tricks like "resume.pdf.exe"
  const ext = path.extname(file.originalname).toLowerCase();
  const safeExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
  if (!safeExtensions.includes(ext)) {
    return cb(new ApiError(400, 'Invalid file extension.'), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE, files: 5 },
});

module.exports = { upload };
const multer = require('multer');

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  if (err instanceof multer.MulterError) {
    statusCode = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large (max 5 MB)' : `Upload error: ${err.message}`;
  }
  if (err.name === 'CastError') { statusCode = 400; message = 'Invalid identifier'; }
  if (err.name === 'ZodError') { statusCode = 400; message = err.errors?.[0]?.message || 'Invalid input'; }

  console.error(`[ERROR] ${req.method} ${req.originalUrl} - ${message}`);

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

const notFound = (req, res, next) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
};

module.exports = { errorHandler, notFound };
/**
 * Global error handler – must be the last middleware registered in app.js.
 * Converts all errors into a consistent JSON API error response.
 */

// ── Catch-all 404 for unknown routes ──────────────────────────────────────────
const notFound = (req, res, next) => {
  const error = new Error(`Route not found – ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// ── Centralised error responder ────────────────────────────────────────────────
const errorHandler = (err, req, res, _next) => {

  // ── Ignore aborted connection errors ─────────────────────────────────────
  // ECONNABORTED / ECONNRESET = browser closed connection before response
  // These are not real server errors — just log and move on
  if (
    err.code === 'ECONNABORTED' ||
    err.code === 'ECONNRESET'   ||
    err.code === 'EPIPE'        ||
    req.aborted
  ) {
    console.warn(`⚠️  Connection aborted by client: ${req.method} ${req.originalUrl}`);
    return; // Do not try to send response — connection is gone
  }

  // ── Skip if response already sent ────────────────────────────────────────
  if (res.headersSent) {
    return;
  }

  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message    = err.message;

  // ── Mongoose bad ObjectId ─────────────────────────────────────────────────
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message    = 'Resource not found';
  }

  // ── Mongoose duplicate key ────────────────────────────────────────────────
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
  }

  // ── Mongoose validation error ─────────────────────────────────────────────
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  }

  // ── JWT errors ────────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message    = 'Invalid token';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message    = 'Token expired – please log in again';
  }

  // ── Multer / upload errors ────────────────────────────────────────────────
  if (err.name === 'MulterError') {
    statusCode = 400;
    message    = `Upload error: ${err.message}`;
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };
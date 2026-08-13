import mongoose from 'mongoose';

export function notFound(req, res, next) {
  res
    .status(404)
    .json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// Central error handler — converts known errors to clean HTTP responses and
// never leaks stack traces or internal details.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong';

  if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  } else if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `This ${field} is already in use`;
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid id';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (statusCode >= 500) {
    console.error(err);
    message = 'Internal server error';
  }

  res.status(statusCode).json({ message });
}

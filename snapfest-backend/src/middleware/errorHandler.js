import { logError } from '../config/logger.js';

// Global error handling middleware
export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Safely log error (don't let logging errors break error handling)
  try {
    logError('Application error occurred', err, {
      reqId: req.reqId,
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      user: req.user ? `${req.user._id} (${req.user.role})` : 'anonymous'
    });
  } catch (logErr) {
    console.error('Failed to log error:', logErr);
    console.error('Original error:', err.message);
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  // Mongoose/MongoDB duplicate key (code 11000)
  if (err.code === 11000 || err.name === 'MongoServerError') {
    const field = err.keyPattern ? Object.keys(err.keyPattern)[0] : (err.keyValue ? Object.keys(err.keyValue)[0] : 'field');
    const message = `A record with this ${field} already exists`;
    error = { message, statusCode: 409 };
  }

  // Azure Cosmos DB unique constraint violation
  // Error format: "Error=117, Details='...Unique index constraint violation...'"
  // Also check error.error property which might contain the error string
  const errorMessage = err.message || '';
  const errorError = err.error || '';
  const errorString = typeof errorError === 'string' ? errorError : '';
  
  if (errorMessage.includes('Unique index constraint violation') ||
      errorMessage.includes('Error=117') ||
      errorString.includes('Unique index constraint violation') ||
      errorString.includes('Error=117')) {
    const message = 'A record with this information already exists. Please use different values.';
    error = { message, statusCode: 409 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: 401 };
  }
  
  if (err.name === 'TokenExpiredError')
  {
    const message = 'Token expired';
    error = { message, statusCode: 401 };
  }

  // Default error response
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// 404 handler
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Async error handler wrapper
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Custom error class
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Handle unhandled promise rejections
export const handleUnhandledRejection = () => {
  process.on('unhandledRejection', (err, promise) => {
    console.log('Unhandled Rejection:', err.message);
    // Close server & exit process
    process.exit(1);
  });
};

// Handle uncaught exceptions
export const handleUncaughtException = () => {
  process.on('uncaughtException', (err) => {
    console.log('Uncaught Exception:', err.message);
    // Close server & exit process
    process.exit(1);
  });
};



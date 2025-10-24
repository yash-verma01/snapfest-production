import morgan from 'morgan';
import { morganStream, logInfo, logError } from '../config/logger.js';

// Custom morgan token for request ID
morgan.token('reqId', (req) => req.reqId || 'unknown');

// Custom morgan token for response time in ms
morgan.token('responseTime', (req, res) => {
  if (!req._startTime) return '-';
  const responseTime = Date.now() - req._startTime;
  return `${responseTime}ms`;
});

// Custom morgan token for user info
morgan.token('user', (req) => {
  if (req.user) {
    return `${req.user._id} (${req.user.role})`;
  }
  return 'anonymous';
});

// Custom morgan token for request body (for POST/PUT/PATCH)
morgan.token('reqBody', (req) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
    // Don't log sensitive data
    const sanitizedBody = { ...req.body };
    if (sanitizedBody.password) sanitizedBody.password = '[REDACTED]';
    if (sanitizedBody.token) sanitizedBody.token = '[REDACTED]';
    if (sanitizedBody.secret) sanitizedBody.secret = '[REDACTED]';
    return JSON.stringify(sanitizedBody);
  }
  return '-';
});

// Create morgan middleware with custom format
const requestLogger = morgan(
  ':remote-addr - :user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] :responseTime ":referrer" ":user-agent" :reqBody',
  {
    stream: morganStream,
    skip: (req, res) => {
      // Skip logging for health checks and static files
      return req.url === '/api/health' || req.url === '/' || req.url.startsWith('/uploads/');
    }
  }
);

// Enhanced request logging middleware
export const enhancedRequestLogger = (req, res, next) => {
  // Generate unique request ID
  req.reqId = Math.random().toString(36).substr(2, 9);
  req._startTime = Date.now();
  
  // Log request start
  logInfo('Request started', {
    reqId: req.reqId,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    user: req.user ? `${req.user._id} (${req.user.role})` : 'anonymous'
  });
  
  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const responseTime = Date.now() - req._startTime;
    
    logInfo('Request completed', {
      reqId: req.reqId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      contentLength: res.get('Content-Length') || 0
    });
    
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

// Error logging middleware
export const errorLogger = (err, req, res, next) => {
  logError('Request error', err, {
    reqId: req.reqId,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    user: req.user ? `${req.user._id} (${req.user.role})` : 'anonymous',
    body: req.body
  });
  
  next(err);
};

export default requestLogger;

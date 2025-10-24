# SnapFest Backend

Event management platform backend API.

## Project Structure

```
snapfest-backend/
├── src/
│   ├── controllers/     # Route handlers
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── middleware/     # Middleware functions
│   ├── services/       # Business logic
│   ├── utils/          # Utility functions
│   └── config/         # Configuration files
├── uploads/            # File uploads
├── .env               # Environment variables
├── server.js         # Main server file
└── package.json      # Dependencies
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Setup environment variables in `.env`

3. Start development server:
```bash
npm run dev
```

4. Start production server:
```bash
npm start
```

## API Endpoints

- Health Check: `GET /api/health`

## Logging

The backend now includes comprehensive logging with Winston and Morgan:

### Log Files
- `logs/combined.log` - All application logs
- `logs/access.log` - HTTP request/response logs
- `logs/error.log` - Error logs only

### Log Monitoring
```bash
# Interactive log monitor
npm run logs

# Monitor specific log files
npm run logs:combined
npm run logs:access
npm run logs:error

# Or use the monitor script directly
./monitor-logs.sh
```

### Log Features
- Request/response logging with unique request IDs
- User authentication tracking
- Error logging with stack traces
- Performance metrics (response times)
- Request body logging (with sensitive data redaction)
- Automatic log rotation (5MB files, 5 file retention)

## Environment Variables

- `PORT`: Server port (default: 5001)
- `LOG_LEVEL`: Logging level (default: info)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: JWT secret key
- `JWT_EXPIRE`: JWT expiration time







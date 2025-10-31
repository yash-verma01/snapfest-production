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

## Authentication Flow (Clerk Cookie Sessions)

### Overview

This application uses **Clerk cookie-based authentication** instead of JWT tokens. Session cookies are automatically managed by Clerk and sent with every request.

**Key Changes:**
- ✅ **Removed** JWT token flow (`getToken()`, `Authorization` headers)
- ✅ **Uses** HTTP-only session cookies (secure, automatic)
- ✅ **Backend** uses `@clerk/express` middleware to parse cookies
- ✅ **Frontend** sends cookies automatically via `withCredentials: true`

### How It Works

1. **User Signs In**: Clerk sets a secure HTTP-only session cookie
2. **Frontend Makes Request**: Browser automatically includes the cookie (no code needed)
3. **Backend Middleware**: `clerkMiddleware()` parses the cookie and attaches `req.auth`
4. **Our Middleware**: `authenticate()` reads `req.auth` and creates/updates user in database
5. **Route Handler**: Receives `req.user`, `req.userId`, `req.userRole`

### Environment Variables

**Required for Authentication:**
- `CLERK_PUBLISHABLE_KEY`: Your Clerk publishable key (starts with `pk_test_...` or `pk_live_...`)
- `CLERK_SECRET_KEY`: Your Clerk secret key (starts with `sk_test_...` or `sk_live_...`)

**Optional (Legacy):**
- `JWT_SECRET`: Kept for backward compatibility (not used for Clerk auth)

**Other Variables:**
- `PORT`: Server port (default: 5001)
- `LOG_LEVEL`: Logging level (default: info)
- `MONGODB_URI`: MongoDB connection string
- `ADMIN_EMAIL`: Admin user email
- `ADMIN_PASSWORD`: Admin user password

### Setup Instructions

1. **Get Clerk Keys:**
   - Go to https://dashboard.clerk.com
   - Navigate to API Keys
   - Copy `Publishable Key` → set as `CLERK_PUBLISHABLE_KEY`
   - Copy `Secret Key` → set as `CLERK_SECRET_KEY`

2. **Configure Frontend Origins:**
   - In Clerk Dashboard → Settings → Allowed Origins
   - Add: `http://localhost:3000`, `http://localhost:3002` (dev)
   - Add your production domains (e.g., `https://snapfest.vercel.app`)

3. **Add Keys to `.env`:**
   ```bash
   CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   ```

4. **Start Server:**
   ```bash
   npm start
   ```
   The server will validate that Clerk keys are present and exit with a clear error if missing.

### CORS Configuration

The backend is configured to accept cookies from:
- All `localhost` ports (development)
- Specific production domains (configured in `server.js`)

CORS settings:
```javascript
credentials: true  // Required for cookies
allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Clerk-Authorization']
```

### User Sync Flow

When a user signs in via Clerk:

1. Frontend: User signs in → Clerk sets session cookie
2. Frontend: Calls `POST /api/users/sync` (cookies sent automatically)
3. Backend: `clerkMiddleware()` parses cookie → attaches `req.auth`
4. Backend: `authenticate()` middleware:
   - Reads `req.auth.userId` (Clerk user ID)
   - Creates user document in MongoDB if it doesn't exist
   - Updates user if email/name changed in Clerk
   - Attaches `req.user` to request
5. Controller: Returns user data

**No JWT templates needed** - cookie-based authentication works out of the box!

### Testing Locally

1. **Clear cookies** in browser devtools
2. **Start backend**: `cd snapfest-backend && npm start`
3. **Start frontend**: `cd snapfest-frontend && npm run dev`
4. **Sign up/sign in** via Clerk (Google or email)
5. **Check Network tab**: 
   - ✅ Request to `/api/users/sync` should include `Cookie` header
   - ✅ Request should NOT include `Authorization: Bearer ...` header
6. **Check backend logs**: Should see user created in MongoDB
7. **Check MongoDB**: Verify user document has `clerkId` field

### Troubleshooting

**Error: "Publishable key is missing"**
- Add `CLERK_PUBLISHABLE_KEY` to `.env` file
- Restart backend server

**Error: "Access denied. Please sign in."**
- User is not signed in
- Session cookie may have expired
- Check browser cookies: should see `__session` cookie

**CORS Errors:**
- Ensure frontend origin is in Clerk Dashboard → Allowed Origins
- Ensure `credentials: true` in CORS config (already set)
- Ensure `withCredentials: true` in axios config (already set)

**User Not Created in Database:**
- Check backend logs for authentication errors
- Verify `CLERK_SECRET_KEY` is correct
- Verify Clerk middleware is mounted before routes (it is)
- Check MongoDB connection

## Environment Variables

- `PORT`: Server port (default: 5001)
- `LOG_LEVEL`: Logging level (default: info)
- `MONGODB_URI`: MongoDB connection string
- `CLERK_PUBLISHABLE_KEY`: **Required** - Clerk publishable key
- `CLERK_SECRET_KEY`: **Required** - Clerk secret key
- `JWT_SECRET`: Legacy - kept for backward compatibility (not used for Clerk auth)







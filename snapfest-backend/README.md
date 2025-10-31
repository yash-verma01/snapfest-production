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
- `ADMIN_EMAILS`: Optional comma-separated list of admin emails (fallback if `publicMetadata.role` not set)
  - Example: `ADMIN_EMAILS=admin1@example.com,admin2@example.com`

**Legacy Variables (Deprecated for Clerk auth):**
- `ADMIN_EMAIL`: Legacy admin user email (may be used by old admin login flow)
- `ADMIN_PASSWORD`: Legacy admin user password (may be used by old admin login flow)

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

### User Model Simplification

**Important:** All authentication and verification are now fully handled by Clerk. The local User schema now only stores application-specific data like name, phone, and profileImage.

**Removed Fields (handled by Clerk):**
- `password`, `resetPasswordToken`, `resetPasswordExpire` - Password management
- `isEmailVerified`, `emailVerificationToken`, `emailVerificationExpire` - Email verification
- `isPhoneVerified`, `phoneVerificationOTP`, `phoneVerificationExpire` - Phone verification

**Current User Schema Fields:**
- `clerkId` (required, unique) - Links to Clerk account
- `email`, `name`, `phone` - Profile information
- `role`, `profileImage`, `isActive`, `lastLogin` - Application data
- `address` - Optional address object
- `createdAt`, `updatedAt` - Timestamps

**Migration:**
If you have existing users with old authentication fields, run the migration script:
```bash
node scripts/migrate-remove-old-user-fields.js
```
⚠️ **Important:** Always run migrations in staging first and ensure you have a database backup!

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

## Admin Access

### Overview

Admin access is controlled via Clerk's `publicMetadata.role`. Admins sign in via Clerk (same as regular users), and the backend checks their `publicMetadata.role === 'admin'` to grant admin route access.

**Important:** No separate admin login flow is needed. Admins use the same Clerk sign-in as regular users.

### Setting Up Admin Users

#### Method 1: Via Clerk Dashboard (Recommended)

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to **Users** → Select the user you want to make admin
3. Go to **Public metadata** section
4. Add the following JSON:
   ```json
   {
     "role": "admin"
   }
   ```
5. Click **Save**

#### Method 2: Via Environment Variable (Fallback)

If `publicMetadata.role` is not set, you can use the `ADMIN_EMAILS` environment variable as a fallback:

1. Add to `.env`:
   ```env
   ADMIN_EMAILS=admin1@example.com,admin2@example.com
   ```
2. The middleware will check if the signed-in user's email matches one in this list

⚠️ **Security Note:** `publicMetadata` is readable client-side. Only use it for role flags, **never store secrets** there.

### How Admin Access Works

1. **User Signs In**: Admin signs in via Clerk (same flow as regular users)
2. **Backend Middleware**: `requireAdminClerk` middleware runs on `/api/admin/*` routes:
   - Checks if Clerk session exists (401 if not authenticated)
   - Reads `publicMetadata.role` from Clerk session
   - Grants access if `publicMetadata.role === 'admin'`
   - Falls back to `ADMIN_EMAILS` env if metadata not available
   - Returns 403 if authenticated but not admin
3. **Route Handler**: Receives `req.admin` object with `{ email, userId, method }`

### Admin Routes Protection

All `/api/admin/*` routes (except `/api/admin/auth/*`) are protected by `requireAdminClerk` middleware, which is applied at the router level in `server.js`.

**Protected Routes Include:**
- `/api/admin/dashboard`
- `/api/admin/analytics`
- `/api/admin/users`
- `/api/admin/bookings`
- `/api/admin/packages`
- `/api/admin/beatbloom`
- `/api/admin/venues`
- `/api/admin/events`
- And all other admin management endpoints

### Optional: Admin Audit Log

The system can optionally create `Admin` records in MongoDB for audit purposes:

- **Model**: `models/Admin.js`
- **Fields**: `clerkId`, `email`, `role`, `lastLogin`, `createdAt`, `updatedAt`
- **Does NOT store**: Passwords (admin authentication is handled by Clerk)
- **Updated on**: Each admin request (non-blocking - DB failures won't block admin operations)

### Testing Admin Access

1. **Set up admin user in Clerk Dashboard** (see above)
2. **Sign in via Clerk** using the admin user's email
3. **Call admin API** (e.g., `GET /api/admin/dashboard`)
4. **Expected**: 
   - ✅ 200 OK with data (if `publicMetadata.role === 'admin'`)
   - ❌ 403 Forbidden (if not admin)
   - ❌ 401 Unauthorized (if not signed in)

**Example curl test:**
```bash
# Sign in via Clerk first (get session cookie), then:
curl -X GET http://localhost:5001/api/admin/dashboard \
  -H "Cookie: __session=..." \
  -v
```

**Example with fetch (browser):**
```javascript
// After signing in via Clerk (cookies sent automatically)
const response = await fetch('http://localhost:5001/api/admin/dashboard', {
  credentials: 'include' // Required for cookies
});
const data = await response.json();
console.log(data);
```

### Troubleshooting

**Issue: Getting 403 "Admin access required" even after setting publicMetadata.role**
- ✅ Check Clerk Dashboard → Users → [User] → Public metadata → Ensure `{ "role": "admin" }` is saved
- ✅ Verify user is signed in (check `__session` cookie)
- ✅ Check backend logs for `requireAdminClerk` debug messages (in development mode)
- ✅ Try `ADMIN_EMAILS` fallback as temporary workaround

**Issue: Getting 401 "Authentication required"**
- ✅ Ensure `clerkMiddleware()` is registered in `server.js` (should be on line ~110)
- ✅ Check that `CLERK_SECRET_KEY` is set in `.env`
- ✅ Verify frontend is sending cookies (`credentials: 'include'` in fetch/axios)

**Issue: publicMetadata not found in session**
- ✅ Middleware will automatically fetch from Clerk API as fallback
- ✅ Ensure `CLERK_SECRET_KEY` is correctly set
- ✅ Check backend logs for API fetch errors

### General Troubleshooting
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







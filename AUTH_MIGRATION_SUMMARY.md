# Authentication Migration: JWT Tokens → Clerk Cookie Sessions

## Summary

Migrated authentication flow from JWT token-based to Clerk cookie-based sessions. All backend authentication now uses HTTP-only session cookies managed by Clerk middleware. Frontend no longer needs to call `getToken()` or send `Authorization` headers for Clerk authentication.

**Commit Message Suggestion:**
```
chore(auth): remove JWT flow; switch to Clerk cookie sessions and middleware
```

---

## Files Modified

### Backend Changes

#### 1. `snapfest-backend/src/middleware/auth.js`
**Changes:**
- ✅ Removed JWT token verification (`verifyClerkToken`, `AuthService.verifyToken`)
- ✅ Removed `Authorization` header parsing for JWT tokens
- ✅ Removed legacy system JWT fallback
- ✅ Updated `authenticate()` to use only `getAuth(req)` from Clerk middleware (cookie-based)
- ✅ Updated `optionalAuth()` to use Clerk session cookies
- ✅ Updated `validateToken()` to validate sessions instead of tokens
- ✅ Added comprehensive comments explaining cookie-based flow

**Key Changes:**
```javascript
// OLD: JWT token parsing with multiple fallbacks
const authHeader = req.headers.authorization;
const token = authHeader.substring(7);
const decoded = AuthService.verifyToken(token);

// NEW: Cookie-based session from Clerk middleware
const clerkAuth = getAuth(req);
if (!clerkAuth?.userId) {
  return res.status(401).json({ success: false, message: 'Access denied. Please sign in.' });
}
```

#### 2. `snapfest-backend/server.js`
**Changes:**
- ✅ Added validation for `CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`
- ✅ Server exits with clear error if keys are missing
- ✅ Added comment explaining cookie-based authentication

**Key Changes:**
```javascript
// Added validation
if (!process.env.CLERK_PUBLISHABLE_KEY) {
  console.error('❌ CLERK_PUBLISHABLE_KEY is missing in .env file!');
  process.exit(1);
}
```

#### 3. `snapfest-backend/src/controllers/userController.js`
**Changes:**
- ✅ Updated `syncClerkUser` comment to reflect cookie-based authentication
- ✅ Updated route access description from "Clerk or legacy JWT" to "Clerk cookie session"

#### 4. `snapfest-backend/README.md`
**Changes:**
- ✅ Added comprehensive "Authentication Flow (Clerk Cookie Sessions)" section
- ✅ Documented environment variables
- ✅ Added setup instructions
- ✅ Added testing and troubleshooting guides

### Frontend Changes

#### 5. `snapfest-frontend/src/App.jsx`
**Changes:**
- ✅ Removed `getToken()` calls and JWT template logic
- ✅ Removed `Authorization` header injection
- ✅ Simplified sync to just call `userAPI.sync()` (cookies sent automatically)
- ✅ Added comments explaining cookie-based flow

**Key Changes:**
```javascript
// OLD: Manual token retrieval and Authorization header
let token = await getToken({ template: 'integration' });
await userAPI.sync({ headers: { Authorization: `Bearer ${token}` } });

// NEW: Simple call - cookies sent automatically
await userAPI.sync();
```

#### 6. `snapfest-frontend/src/services/api.js`
**Changes:**
- ✅ Updated request interceptor comment to explain cookie-based auth
- ✅ Removed Clerk JWT token handling from interceptor
- ✅ Updated `userAPI.sync()` signature (removed config parameter)

**Key Changes:**
```javascript
// OLD: Added Authorization header for Clerk tokens
const clerkToken = await window.Clerk.session.getToken();
config.headers.Authorization = `Bearer ${clerkToken}`;

// NEW: Cookies sent automatically via withCredentials: true
// No manual token handling needed
```

---

## Environment Variables

### Required (Backend `.env`)
- `CLERK_PUBLISHABLE_KEY`: Clerk publishable key (starts with `pk_test_...` or `pk_live_...`)
- `CLERK_SECRET_KEY`: Clerk secret key (starts with `sk_test_...` or `sk_live_...`)

### Removed Dependencies
- ❌ No JWT template configuration needed in Clerk Dashboard
- ❌ No `CLERK_JWT_TEMPLATE_ID` env variable needed

### Kept (Legacy/Backward Compatibility)
- `JWT_SECRET`: Kept for backward compatibility (not used for Clerk auth)

---

## Testing Checklist

### Prerequisites
1. ✅ Backend `.env` has `CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`
2. ✅ Frontend `.env` has `VITE_CLERK_PUBLISHABLE_KEY`
3. ✅ Clerk Dashboard has frontend origins in "Allowed Origins"

### Test Steps

1. **Clear Browser Cookies**
   - Open DevTools → Application → Cookies
   - Delete all cookies for `localhost`

2. **Start Backend**
   ```bash
   cd snapfest-backend
   npm start
   ```
   - ✅ Should see: "✅ Clerk keys loaded successfully"
   - ❌ Should NOT see: "Publishable key is missing" error

3. **Start Frontend**
   ```bash
   cd snapfest-frontend
   npm run dev
   ```
   - ✅ App should load without errors

4. **Sign Up/Sign In**
   - Navigate to `/sign-up` or `/sign-in`
   - Sign up with Google or email/password
   - ✅ Should redirect to `/user/profile`

5. **Check Network Tab**
   - Open DevTools → Network
   - Find `POST /api/users/sync` request
   - ✅ Request should include `Cookie` header (contains `__session`)
   - ❌ Request should NOT include `Authorization: Bearer ...` header
   - ✅ Response should be 200 OK with user data

6. **Check Backend Logs**
   - ✅ Should NOT see "Publishable key is missing" errors
   - ✅ Should see user sync success

7. **Check MongoDB**
   ```bash
   # Connect to MongoDB
   mongo
   use snapfest
   db.users.findOne({ clerkId: { $exists: true } })
   ```
   - ✅ User document should exist
   - ✅ User should have `clerkId` field
   - ✅ User should have `email`, `name`, `isEmailVerified` fields

8. **Test Protected Route**
   - Navigate to `/user/profile`
   - ✅ Should load without errors
   - ✅ Should display user data

9. **Test Profile Update**
   - Update profile information
   - Submit changes
   - ✅ Should save successfully
   - ✅ Check MongoDB: user document should be updated

10. **Test CORS (if applicable)**
    - Use a different origin (e.g., `http://localhost:3002`)
    - ✅ Should work if origin is in Clerk Dashboard → Allowed Origins
    - ✅ Cookies should be sent and received

---

## Rollback Plan

If issues arise, revert the following commits or restore files from backup:

### Quick Rollback Steps

1. **Revert Backend Middleware**
   ```bash
   git checkout HEAD~1 snapfest-backend/src/middleware/auth.js
   ```
   Restores JWT token fallback logic

2. **Revert Frontend Changes**
   ```bash
   git checkout HEAD~1 snapfest-frontend/src/App.jsx
   git checkout HEAD~1 snapfest-frontend/src/services/api.js
   ```
   Restores `getToken()` calls and Authorization header injection

3. **Revert Server Configuration**
   ```bash
   git checkout HEAD~1 snapfest-backend/server.js
   ```
   Removes Clerk keys validation (though keys are still needed for middleware)

4. **Restore JWT Template**
   - Go to Clerk Dashboard → JWT Templates
   - Create template named "integration" if needed
   - Update frontend code to use template

### Important Notes
- Rollback requires both backend and frontend changes
- If rolling back, ensure JWT template exists in Clerk Dashboard
- Legacy token support is removed - may need to add back `verifyClerkToken` function

---

## Files Summary

### Modified Files
1. `snapfest-backend/src/middleware/auth.js` - Removed JWT, uses cookies only
2. `snapfest-backend/server.js` - Added Clerk keys validation
3. `snapfest-backend/src/controllers/userController.js` - Updated comments
4. `snapfest-backend/README.md` - Added comprehensive auth documentation
5. `snapfest-frontend/src/App.jsx` - Removed `getToken()`, simplified sync
6. `snapfest-frontend/src/services/api.js` - Removed Clerk JWT handling

### No Changes Needed (Already Correct)
- ✅ `snapfest-frontend/src/services/api.js` - Already has `withCredentials: true`
- ✅ `snapfest-backend/server.js` - Already has `credentials: true` in CORS
- ✅ `snapfest-backend/server.js` - Already has `clerkMiddleware()` mounted

---

## Edge Cases & Operational Notes

### Retained JWT Templates
- If JWT templates exist in Clerk Dashboard for third-party integrations, **do not remove them**
- Only removed JWT usage for internal backend authentication
- Document any retained JWT template purposes

### Cross-Domain Cookies
- If frontend and backend are on different top-level domains:
  - Configure Clerk Dashboard → Cookie Domain settings
  - Ensure cookies are set with correct domain attributes
  - Test cookie sharing across subdomains if needed

### Middleware Order
- ✅ Clerk middleware is mounted before routes (correct)
- ✅ Body parsing is after Clerk middleware (correct)
- ✅ CORS is before Clerk middleware (correct - allows cookie parsing)

### Public Routes
- Public routes (e.g., `/api/packages`, `/api/events`) do not use `authenticate()` middleware
- Clerk middleware still runs globally but doesn't block public routes
- This is correct behavior

---

## Success Criteria

✅ **All acceptance criteria met:**
1. ✅ No `getToken()` calls for ordinary backend authentication
2. ✅ No `Authorization: Bearer ...` headers sent for Clerk auth
3. ✅ Frontend sends session cookies automatically
4. ✅ Backend uses Clerk middleware to verify cookies
5. ✅ User documents created/updated using `clerkId` from middleware
6. ✅ README updated with cookie-based auth documentation
7. ✅ Environment variables documented

---

## Next Steps (Post-Migration)

1. **Monitor Production**
   - Watch for authentication errors in logs
   - Monitor user sync success rate
   - Check MongoDB for user creation issues

2. **Clean Up (Optional)**
   - Remove unused JWT template from Clerk Dashboard (if not needed for third-party)
   - Remove `JWT_SECRET` from `.env` (if not used elsewhere)
   - Archive old JWT-related code comments

3. **Documentation Updates**
   - Update API documentation to mention cookie-based auth
   - Update deployment guides with Clerk keys requirement
   - Share migration summary with team

---

## Questions or Issues?

If you encounter issues:
1. Check browser Network tab - verify cookies are being sent
2. Check backend logs - verify Clerk keys are loaded
3. Check MongoDB - verify users are being created
4. Check Clerk Dashboard - verify allowed origins are configured
5. Review this document - ensure all steps were followed

---

**Migration completed successfully!** 🎉


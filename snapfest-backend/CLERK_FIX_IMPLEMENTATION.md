# Clerk Authentication Fix Implementation

## Changes Implemented

### 1. ✅ Enhanced CORS Configuration (`server.js`)
- Added explicit `credentials: true` for cookie transmission
- Added `Cookie` and `Set-Cookie` to `allowedHeaders`
- Added `exposedHeaders: ['Set-Cookie']`
- Added `maxAge` for preflight caching

### 2. ✅ Added Cookie Debugging Middleware (`server.js`)
- Temporary middleware to log cookie presence and values
- Shows which cookies are received for each API request
- Helps diagnose cookie transmission issues

### 3. ✅ Added Test Route `/api/test/clerk` (`server.js`)
- Verifies if Clerk session is being parsed correctly
- Shows `getAuth(req)` output
- Displays cookie information
- Fetches user data from Clerk API if session exists

### 4. ✅ Enhanced Clerk Middleware Configuration
- Explicitly configured `publishableKey` and `secretKey`
- Middleware runs before all routes

## What to Check Next

### Critical: Verify Clerk Secret Key

1. **Go to Clerk Dashboard:**
   - https://dashboard.clerk.com
   - Navigate to **API Keys**
   - Copy the **Secret Key** (starts with `sk_test_...`)

2. **Verify in `.env` file:**
   ```bash
   cd snapfest-backend
   # Open .env file
   CLERK_SECRET_KEY=sk_test_... # Must EXACTLY match Dashboard
   CLERK_PUBLISHABLE_KEY=pk_test_... # Must match frontend
   ```

3. **Restart backend server:**
   ```bash
   npm run dev
   ```

### Verify Cookie Transmission

1. **Test the `/api/test/clerk` route:**
   - Sign in as admin on `http://localhost:3002`
   - Open browser DevTools → Network tab
   - Visit `http://localhost:5001/api/test/clerk` (or call it via frontend)
   - Check the response:
     ```json
     {
       "hasSession": true,
       "auth": {
         "isAuthenticated": true,
         "userId": "user_..."
       },
       "cookies": {
         "hasSession": true,
         "sessionValue": "..."
       }
     }
     ```

2. **If `hasSession: false`:**
   - Check browser DevTools → Application → Cookies
   - Find `__session` cookie for `localhost`
   - Check its attributes:
     - **Domain:** Should be `localhost` (not `localhost:3002`)
     - **SameSite:** Should be `Lax` or `None` (not `Strict`)
     - **Path:** Should be `/`
     - **HttpOnly:** Should be `true`
     - **Secure:** Should be `false` for localhost (true in production)

3. **Update Clerk Dashboard Cookie Settings:**
   - Go to Clerk Dashboard → Settings → Sessions
   - Ensure Cookie SameSite is set to `Lax` or `None`
   - Save changes

### Frontend Verification

1. **Check `withCredentials` is enabled:**
   - File: `snapfest-frontend/src/services/api.js`
   - Line 8: `withCredentials: true` ✅ (already configured)

2. **Check Axios instance:**
   ```javascript
   const api = axios.create({
     baseURL: 'http://localhost:5001/api',
     withCredentials: true, // ✅ Must be true
   });
   ```

3. **Verify requests include cookies:**
   - Open DevTools → Network tab
   - Make any API request (e.g., `/api/admin/dashboard`)
   - Click on the request → Headers tab
   - Check **Request Headers** → Look for `Cookie:` header
   - Should contain `__session=...` or `__session_R-SCx821=...`

## Testing Steps

### Step 1: Test Clerk Session Parsing
```bash
# 1. Restart backend
cd snapfest-backend
npm run dev

# 2. In browser (while logged in as admin):
# Visit: http://localhost:5001/api/test/clerk
# Or call from frontend console:
fetch('http://localhost:5001/api/test/clerk', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log)
```

**Expected Output:**
```json
{
  "success": true,
  "hasSession": true,
  "auth": {
    "isAuthenticated": true,
    "userId": "user_...",
    "sessionId": "..."
  },
  "cookies": {
    "hasSession": true,
    "sessionValue": "..."
  },
  "user": {
    "userId": "user_...",
    "email": "admin@example.com",
    "publicMetadata": {
      "role": "admin"
    }
  }
}
```

### Step 2: Test Admin Routes

1. **Sign in as admin** on `http://localhost:3002`
2. **Try accessing:**
   - `/api/admin/dashboard` → Should return 200 (not 401)
   - `/api/admin/profile` → Should return 200 (not 401)
   - `/api/users/sync` → Should return 200 (not 401)

### Step 3: Test Non-Admin User

1. **Sign in as regular user** (not admin)
2. **Try accessing:**
   - `/api/admin/dashboard` → Should return 403 (Forbidden)
   - `/api/users/sync` → Should return 200 (allowed)

## Troubleshooting

### Issue: `hasSession: false` in `/api/test/clerk`

**Possible Causes:**
1. ❌ `CLERK_SECRET_KEY` doesn't match Clerk Dashboard
2. ❌ Cookie not being sent from frontend (check Network tab → Headers)
3. ❌ Cookie SameSite=Strict (blocks cross-port cookies)
4. ❌ Cookie domain mismatch

**Solutions:**
1. ✅ Verify `CLERK_SECRET_KEY` in `.env` matches Dashboard exactly
2. ✅ Check browser DevTools → Application → Cookies → `__session`
3. ✅ Update Clerk Dashboard → Settings → Sessions → Cookie SameSite = `Lax`
4. ✅ Clear cookies and sign in again

### Issue: Cookie present but `isAuthenticated: false`

**This is the current issue!**

**Possible Causes:**
1. ❌ Secret key mismatch (most likely)
2. ❌ Cookie encrypted with different instance key
3. ❌ Clerk middleware configuration issue

**Solutions:**
1. ✅ **Double-check `CLERK_SECRET_KEY` matches Dashboard**
2. ✅ Clear all Clerk cookies and sign in fresh
3. ✅ Check if multiple Clerk instances exist
4. ✅ Verify `CLERK_PUBLISHABLE_KEY` matches frontend `.env`

### Issue: Admin access denied (403)

**Check:**
1. ✅ User has `publicMetadata.role === 'admin'` in Clerk Dashboard
2. ✅ Middleware is checking `publicMetadata.role`
3. ✅ Fallback `ADMIN_EMAILS` env var (if used)

**Verify in Clerk Dashboard:**
- Go to Users → [Admin User] → Public Metadata
- Should have: `{ "role": "admin" }`

## Next Steps

1. **Restart backend server** after updating `.env`
2. **Test `/api/test/clerk`** route
3. **Check backend logs** for cookie debug output
4. **Verify admin routes** work correctly
5. **Test with regular user** to ensure they're blocked

## Files Changed

1. ✅ `snapfest-backend/server.js`
   - Enhanced CORS configuration
   - Added cookie debugging middleware
   - Added `/api/test/clerk` test route

2. ✅ `snapfest-backend/src/middleware/requireAdminClerk.js`
   - Already configured correctly (no changes needed)

3. ✅ `snapfest-frontend/src/services/api.js`
   - Already has `withCredentials: true` (no changes needed)

## Summary

The core issue is that `getAuth(req)` returns `isAuthenticated: false` even though the `__session` cookie is present. This suggests:

1. **Most likely:** `CLERK_SECRET_KEY` mismatch between `.env` and Clerk Dashboard
2. **Possible:** Cookie encryption mismatch (different instance key)
3. **Possible:** Clerk middleware not parsing cookies correctly

**Immediate Action:**
1. Verify `CLERK_SECRET_KEY` in `.env` matches Clerk Dashboard exactly
2. Clear cookies and sign in fresh
3. Test `/api/test/clerk` route
4. Check backend logs for cookie debug output

If cookies are present but session isn't recognized, it's almost certainly a secret key mismatch.


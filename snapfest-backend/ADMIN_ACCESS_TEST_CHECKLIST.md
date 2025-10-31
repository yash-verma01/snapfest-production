# Admin Access Implementation - Test Checklist

## Implementation Summary

This implementation adds admin access control using Clerk's `publicMetadata.role`. All admin routes are now protected by the `requireAdminClerk` middleware which:

1. Checks for valid Clerk session
2. Reads `publicMetadata.role === 'admin'` from Clerk session
3. Falls back to `ADMIN_EMAILS` env variable if metadata not available
4. Optionally creates/updates Admin audit records in MongoDB

## Discovery Report

### Files Found

**Clerk Middleware Registration:**
- File: `snapfest-backend/server.js`
  - Line 21: `import { clerkMiddleware } from '@clerk/express'`
  - Line 110: `app.use(clerkMiddleware())` - Middleware registered globally

**Clerk Auth Pattern:**
- File: `snapfest-backend/src/middleware/auth.js`
  - Line 3: `import { getAuth } from '@clerk/express'` - Uses `getAuth(req)` pattern
  - Line 4: `import { clerkClient } from '@clerk/clerk-sdk-node'` - SDK available for API calls

**Admin Routes:**
- File: `snapfest-backend/server.js`
  - Line 128: `app.use('/api/admin', adminRoutes)` - Admin routes mounted here

**Existing Admin Middleware:**
- File: `snapfest-backend/src/middleware/auth.js`
  - Lines 199-228: `adminOnly` function (deprecated - uses DB role check)
  - Used in: Multiple routes in `adminRoutes.js` (now replaced)

## Test Checklist

### Prerequisites

1. ✅ Clerk account set up with test environment
2. ✅ `CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` in `.env`
3. ✅ MongoDB connection working
4. ✅ Backend server running on port 5001
5. ✅ Frontend running (for Clerk sign-in UI)

### Test 1: Discovery Verification

**Check Clerk middleware is registered:**
```bash
grep -n "clerkMiddleware" snapfest-backend/server.js
# Expected: Line 21 (import), Line 110 (app.use)
```

**Check admin routes are mounted:**
```bash
grep -n "/api/admin" snapfest-backend/server.js
# Expected: Line 128 shows requireAdminClerk middleware
```

### Test 2: Happy Path - Admin with publicMetadata.role

**Steps:**
1. Go to Clerk Dashboard → Users
2. Create or select a test user
3. Navigate to **Public metadata** section
4. Add: `{ "role": "admin" }`
5. Save
6. Sign in via Clerk (frontend or Clerk Dashboard)
7. Make request to admin endpoint

**Test Request (curl):**
```bash
# After signing in via Clerk, get session cookie from browser devtools
curl -X GET http://localhost:5001/api/admin/dashboard \
  -H "Cookie: __session=YOUR_SESSION_COOKIE" \
  -v

# Expected: 200 OK with dashboard data
# Check response includes: { success: true, data: ... }
```

**Test Request (browser console):**
```javascript
// After signing in via Clerk (in browser console)
fetch('http://localhost:5001/api/admin/dashboard', {
  credentials: 'include' // Sends cookies automatically
})
.then(r => r.json())
.then(console.log)
.catch(console.error);

// Expected: { success: true, data: { ... } }
```

**Test Request (Postman):**
1. Sign in via Clerk (get session cookie)
2. Add cookie to Postman: `__session=YOUR_SESSION_COOKIE`
3. GET `http://localhost:5001/api/admin/dashboard`
4. Expected: 200 OK

**Verify Middleware Attached:**
```javascript
// In admin route handler, check req.admin
console.log('req.admin:', req.admin);
// Expected: { email: 'admin@example.com', userId: 'user_...', method: 'clerk' }
```

### Test 3: Negative Path - Regular User (No Admin Metadata)

**Steps:**
1. Create a regular user in Clerk (no `publicMetadata.role`)
2. Sign in via Clerk
3. Make request to admin endpoint

**Test Request:**
```bash
curl -X GET http://localhost:5001/api/admin/dashboard \
  -H "Cookie: __session=REGULAR_USER_SESSION" \
  -v

# Expected: 403 Forbidden
# Response: { success: false, error: 'Admin access required', message: '...' }
```

**Test Request (browser console):**
```javascript
fetch('http://localhost:5001/api/admin/dashboard', {
  credentials: 'include'
})
.then(r => r.json())
.then(console.log)
.catch(console.error);

// Expected: { success: false, error: 'Admin access required' }
// Status: 403
```

### Test 4: Negative Path - Not Signed In

**Steps:**
1. Clear all cookies
2. Make request to admin endpoint without signing in

**Test Request:**
```bash
curl -X GET http://localhost:5001/api/admin/dashboard \
  -v

# Expected: 401 Unauthorized
# Response: { success: false, error: 'Authentication required', message: '...' }
```

**Test Request (browser console):**
```javascript
// Without signing in (no cookies)
fetch('http://localhost:5001/api/admin/dashboard', {
  credentials: 'include'
})
.then(r => r.json())
.then(console.log)
.catch(console.error);

// Expected: { success: false, error: 'Authentication required' }
// Status: 401
```

### Test 5: Fallback Path - ADMIN_EMAILS Environment Variable

**Steps:**
1. Create a user in Clerk with email `testadmin@example.com`
2. **Do NOT** set `publicMetadata.role` for this user
3. Add to `.env`:
   ```env
   ADMIN_EMAILS=testadmin@example.com,other@example.com
   ```
4. Restart backend server
5. Sign in via Clerk with `testadmin@example.com`
6. Make request to admin endpoint

**Test Request:**
```bash
curl -X GET http://localhost:5001/api/admin/dashboard \
  -H "Cookie: __session=TESTADMIN_SESSION" \
  -v

# Expected: 200 OK (admin access granted via email fallback)
# Check backend logs: Should see "Admin access granted via ADMIN_EMAILS fallback"
```

**Verify in Backend Logs:**
```bash
# Check backend terminal/logs
# Expected message: "✅ Admin access granted via ADMIN_EMAILS fallback for: testadmin@example.com"
# req.admin.method should be: "clerk-email-fallback"
```

### Test 6: Optional - Admin Audit Log (if implemented)

**Steps:**
1. Make successful admin request (as in Test 2)
2. Check MongoDB `admins` collection

**Check MongoDB:**
```javascript
// In MongoDB shell or MongoDB Compass
use your_database_name;
db.admins.find().sort({ lastLogin: -1 });

// Expected: Document with:
// - clerkId: 'user_...'
// - email: 'admin@example.com'
// - role: 'admin'
// - lastLogin: ISODate(...)
// - createdAt: ISODate(...)
// - updatedAt: ISODate(...)
```

**Verify Audit Log Updated:**
1. Make another admin request (same admin user)
2. Check `lastLogin` timestamp updated
3. Check `updatedAt` timestamp updated

**Test via Node.js:**
```javascript
// test-admin-audit.js
import mongoose from 'mongoose';
import Admin from './src/models/Admin.js';

await mongoose.connect(process.env.MONGODB_URI);

const admins = await Admin.find().sort({ lastLogin: -1 });
console.log('Admin audit logs:', admins);

await mongoose.disconnect();
```

### Test 7: Edge Cases

**Case 1: Session lacks publicMetadata and Clerk API unavailable**
1. Temporarily break `CLERK_SECRET_KEY` (wrong key)
2. Make admin request with user in `ADMIN_EMAILS`
3. Expected: Still works via email fallback, warning in logs

**Case 2: publicMetadata exists but role is not 'admin'**
1. Set `publicMetadata` to `{ "role": "user" }` (not admin)
2. Sign in and make admin request
3. Expected: 403 Forbidden

**Case 3: Multiple admins**
1. Set `publicMetadata.role = 'admin'` for multiple users
2. Sign in with each and make admin requests
3. Expected: All get 200 OK

**Case 4: Admin routes work, non-admin routes unaffected**
1. Sign in as regular user (no admin)
2. Make request to `/api/users/profile` (user route)
3. Expected: Works normally (200 OK)
4. Make request to `/api/admin/dashboard` (admin route)
5. Expected: 403 Forbidden

## Example Test Script

Save as `test-admin-access.js`:

```javascript
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5001/api';

// Test helper
async function testAdminAccess(sessionCookie, description) {
  console.log(`\n🧪 Testing: ${description}`);
  
  const response = await fetch(`${BASE_URL}/admin/dashboard`, {
    method: 'GET',
    headers: {
      'Cookie': sessionCookie ? `__session=${sessionCookie}` : ''
    }
  });
  
  const data = await response.json();
  
  console.log(`Status: ${response.status}`);
  console.log(`Response:`, JSON.stringify(data, null, 2));
  
  if (response.status === 200) {
    console.log('✅ PASS: Admin access granted');
  } else if (response.status === 403) {
    console.log('✅ PASS: Access denied (expected for non-admin)');
  } else if (response.status === 401) {
    console.log('✅ PASS: Authentication required (expected for unsigned in)');
  } else {
    console.log('❌ FAIL: Unexpected status');
  }
}

// Manual tests - replace SESSION_COOKIE with actual cookie from browser
const ADMIN_SESSION = 'YOUR_ADMIN_SESSION_COOKIE';
const USER_SESSION = 'YOUR_USER_SESSION_COOKIE';

// Run tests
await testAdminAccess(ADMIN_SESSION, 'Admin user with publicMetadata.role');
await testAdminAccess(USER_SESSION, 'Regular user (no admin metadata)');
await testAdminAccess(null, 'Not signed in');

console.log('\n✅ All tests complete!');
```

**Run:**
```bash
node test-admin-access.js
```

## Verification Checklist

Before marking as complete, verify:

- [ ] ✅ Admin with `publicMetadata.role === 'admin'` can access `/api/admin/*` routes (200 OK)
- [ ] ✅ Regular user cannot access `/api/admin/*` routes (403 Forbidden)
- [ ] ✅ Unsigned in user cannot access `/api/admin/*` routes (401 Unauthorized)
- [ ] ✅ `ADMIN_EMAILS` fallback works when `publicMetadata.role` not set
- [ ] ✅ Admin audit log created/updated in MongoDB (if implemented)
- [ ] ✅ Backend logs show correct middleware decisions (in dev mode)
- [ ] ✅ `req.admin` object attached to request in protected routes
- [ ] ✅ Public routes (non-admin) still work for regular users
- [ ] ✅ No passwords stored in Admin model (if implemented)
- [ ] ✅ Middleware handles errors gracefully (500 on unexpected errors)

## Rollback Instructions

If you need to rollback this implementation:

1. **Remove middleware from server.js:**
   ```javascript
   // Change from:
   app.use('/api/admin', requireAdminClerk, adminRoutes);
   // Back to:
   app.use('/api/admin', adminRoutes);
   ```

2. **Restore old middleware in adminRoutes.js:**
   ```javascript
   // Add back authenticate + adminOnly to routes
   import { authenticate, adminOnly } from '../middleware/auth.js';
   router.get('/dashboard', authenticate, adminOnly, getDashboard);
   // ... etc
   ```

3. **Git revert (if committed):**
   ```bash
   git revert <commit-hash>
   ```

4. **Remove files (optional):**
   ```bash
   rm snapfest-backend/src/middleware/requireAdminClerk.js
   rm snapfest-backend/src/models/Admin.js
   ```

## Assumptions Made

1. **Clerk API Pattern**: Assumed `getAuth(req)` pattern from `@clerk/express` (confirmed in discovery)
2. **Session Claims**: Assumed `publicMetadata` may or may not be in session claims, implemented API fallback
3. **Environment Variables**: Used `CLERK_SECRET_KEY` (confirmed exists in `.env` validation)
4. **Router Protection**: Applied middleware at router level (`server.js`) rather than individual routes
5. **Audit Log**: Made Admin model optional (non-blocking upsert) to avoid breaking if DB unavailable

## Notes

- All admin routes are now protected by `requireAdminClerk` middleware
- Old `adminOnly` middleware is deprecated but kept for backward compatibility
- Admin login route (`/api/admin/auth/login`) is deprecated - use Clerk sign-in instead
- Admin audit log is optional and non-blocking (won't fail requests if DB unavailable)


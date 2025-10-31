# Clerk Session Debugging Guide

## Current Issue

Cookies are present (`__session`, `__session_R-SCx821`) but Clerk middleware returns `isAuthenticated: false`.

## Debug Steps

1. **Check Cookie Format:**
   - Cookies should be named `__session` or `__session_<instance_id>`
   - Check if cookies are HTTP-only and secure (set by Clerk)

2. **Verify Clerk Keys:**
   - Ensure `CLERK_SECRET_KEY` in `.env` matches your Clerk Dashboard
   - Ensure `CLERK_PUBLISHABLE_KEY` matches frontend

3. **Check Cookie Domain/Path:**
   - Cookies from `localhost:3002` should be sent to `localhost:5001`
   - Verify `credentials: true` in CORS and axios config

4. **Test Cookie Manually:**
   - Check browser DevTools → Application → Cookies
   - Verify `__session` cookie exists for `localhost`
   - Check cookie value is not empty

## Solutions Applied

1. ✅ Fixed AdminDashboard/AdminProfile to use Clerk hooks instead of AuthContext
2. ✅ Added fallback to check `req.auth()` as function
3. ✅ Added debug logging to see what Clerk returns
4. ✅ Updated middleware to check `sessionClaims` in addition to `claims`

## Next Steps

1. Restart backend server
2. Clear browser cookies
3. Sign in again via Clerk
4. Check backend logs for debug output
5. Verify cookies are being sent correctly

## Expected Logs

When working correctly:
- `getAuth(req).isAuthenticated: true`
- `getAuth(req).userId: user_...`
- No "No Clerk session found" messages


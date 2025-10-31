# Discovery Report: Admin UI Routes, Navigation, and API Calls

## A — Discovery Results

### 1. Admin Routes (AdminApp.jsx)
**File:** `snapfest-frontend/src/AdminApp.jsx`

**Current Routes:**
- ✅ `/` → Redirects to `/admin/dashboard` (line 106)
- ✅ `/sign-in/*` → Clerk SignIn component (line 107)
- ✅ `/sign-up/*` → Clerk SignUp component (line 108)
- ✅ `/admin/dashboard` → AdminDashboard (line 111)
- ✅ `/admin/analytics` → AdminAnalytics (line 112)
- ✅ `/admin/profile` → AdminProfile (line 113)
- ✅ `*` → NotFound (line 116)

**Routes to Remove:** None - AdminApp.jsx already has only admin-specific routes ✅

**Routes to Comment Out:** None needed - no packages/events/venue/about/contact/cart routes exist in AdminApp.jsx ✅

---

### 2. Navigation Links (Navbar.jsx)
**File:** `snapfest-frontend/src/components/Navbar.jsx`

**Links Found:**
- **Desktop Navigation (lines 72-117):**
  - ✅ Home (line 72-77) - Keep for admin
  - ❌ Packages (line 78-83) - Hide for admin
  - ❌ Events (line 84-89) - Hide for admin
  - ❌ Venues (line 90-95) - Hide for admin
  - ❌ About (line 96-101) - Hide for admin
  - ❌ Contact (line 102-107) - Hide for admin
  - ❌ Cart (line 108-116) - Hide for admin

- **Mobile Navigation (lines 219-352):**
  - ✅ Home (line 223-230) - Keep for admin
  - ❌ Packages (line 231-238) - Hide for admin
  - ❌ Events (line 239-246) - Hide for admin
  - ❌ Venues (line 247-254) - Hide for admin
  - ❌ About (line 255-262) - Hide for admin
  - ❌ Contact (line 263-270) - Hide for admin
  - ❌ Cart (line 273-280) - Hide for admin

**Action Required:** Conditionally hide these links when `user?.publicMetadata?.role === 'admin'`

---

### 3. Components Using Cart API

**Files That Call Cart API:**

1. **`hooks/useCart.js`** (lines 280-316)
   - `useEffect` hook automatically calls `fetchCart()` on mount
   - This triggers `cartAPI.getCart()` → `/api/cart` API call
   - **Issue:** `PackageCard` component uses `useCart` hook

2. **`components/cards/PackageCard.jsx`** (line 8, 22)
   - Imports `useCart` hook
   - Calls `useCart()` which triggers cart API on component mount
   - **Issue:** `Home.jsx` uses `PackageCard` component

3. **`pages/Home.jsx`** (line 4, 488)
   - Imports `PackageCard` component
   - Renders `PackageCard` components (line 488+)
   - **Issue:** Home page might be used in admin context (though AdminApp redirects to dashboard)

**Action Required:** 
- Update `useCart.js` to skip cart fetching for admin users
- Or update `PackageCard.jsx` to conditionally disable cart functionality for admin

---

### 4. API Calls from Admin Pages

**Files Making API Calls:**
- ❌ `pages/Home.jsx` (if rendered) → Uses `PackageCard` → Triggers cart API
- ✅ `pages/AdminDashboard.jsx` → Only admin APIs (no cart/packages/events for browsing)
- ✅ `pages/AdminProfile.jsx` → Only profile APIs
- ✅ `pages/AdminAnalytics.jsx` → Only analytics APIs

**Action Required:** Ensure `Home.jsx` doesn't trigger cart API when used in admin context

---

### 5. Backend Routes to Add Fallbacks

**Backend Routes:**
- `/api/cart` → Should return empty response for admin UI (instead of 401)
- `/api/packages` (if called from admin) → Should return empty or basic response
- `/api/events` (if called from admin) → Should return empty or basic response

**Action Required:** Add admin check in backend cart/packages/events routes to return empty responses

---

## Summary

### Frontend Changes Needed:
1. ✅ **Routes:** No changes needed - AdminApp already has correct routes
2. ❌ **Navbar.jsx:** Hide packages/events/venue/about/contact/cart links for admin users
3. ❌ **useCart.js:** Skip cart fetching for admin users
4. ❌ **PackageCard.jsx:** Optionally disable cart functionality for admin users

### Backend Changes Needed:
5. ❌ **cartController.js:** Return empty response for admin users (instead of 401)
6. ❌ **packageController.js:** Optional - return basic response for admin users
7. ❌ **eventController.js:** Optional - return basic response for admin users

---

## Files to Modify:

1. `snapfest-frontend/src/components/Navbar.jsx` - Hide navigation links for admin
2. `snapfest-frontend/src/hooks/useCart.js` - Skip cart fetching for admin users
3. `snapfest-backend/src/controllers/cartController.js` - Add admin fallback
4. (Optional) `snapfest-backend/src/controllers/packageController.js` - Add admin fallback
5. (Optional) `snapfest-backend/src/controllers/eventController.js` - Add admin fallback


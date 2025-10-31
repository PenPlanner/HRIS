# Session Notes - Authentication & Service Worker Fixes

**Date:** 2025-11-01
**Branch:** `pwa-improvements`
**Last Commit:** `b95f6af` - Fix authentication redirect issues and service worker conflicts

---

## Current Status

### ✅ What's Working
- RBAC database schema fully implemented (migration 005)
- User signup creates account in Supabase
- User profile automatically created with trigger
- First user automatically becomes Super Admin
- Login authentication works (credentials verified)
- Service worker now skips auth pages

### ❌ What's NOT Working Yet
- **Login redirect still fails** - User gets stuck after "Creating account..." or "Login Successful!"
- Service worker redirect mode error (even after fixes)
- User cannot access dashboard after login without manually typing URL

---

## Critical Issues to Fix Next

### 🔴 PRIORITY 1: Fix Login/Signup Redirect Loop

**Problem:** After user creates account or logs in, they get stuck on login page with network errors.

**Root Cause:** Service worker is intercepting redirects even though we added skip logic.

**Solution Steps:**
1. **Delete test user from Supabase:**
   ```sql
   DELETE FROM user_profiles WHERE email = 'markusanderson81@gmail.com';
   DELETE FROM auth.users WHERE email = 'markusanderson81@gmail.com';
   ```

2. **Test in incognito mode:**
   - Open incognito window
   - Go to http://localhost:3000/login
   - Clear service worker in DevTools (Application → Service Workers → Unregister)
   - Clear all storage (Application → Storage → Clear site data)
   - Hard refresh (Ctrl+Shift+R)
   - Try signup again

3. **If still broken, try this nuclear option:**
   - Temporarily disable service worker registration
   - Edit `app/layout.tsx` and comment out service worker registration
   - Test auth flow without service worker
   - Once working, re-enable and add proper auth bypass

---

## File Changes Made

### 1. [app/login/page.tsx](app/login/page.tsx)
**Changes:**
- Line 31: Changed `router.push("/")` to `window.location.href = "/"`
- Line 51: Changed `router.push("/")` to `window.location.href = "/"`
- Removed router dependency from useEffect

**Why:** Next.js router was causing issues with PWA service worker redirects.

### 2. [public/sw.js](public/sw.js)
**Changes:**
- Line 64-66: Added skip logic for `/login`, `/unauthorized`, `/auth` paths
- Line 129-131: Added `redirect: 'follow'` for navigation requests
- Line 135: Don't cache opaqueredirect responses

**Why:** Service worker was intercepting auth redirects and causing network errors.

### 3. [supabase/migrations/006_fix_user_profiles_rls.sql](supabase/migrations/006_fix_user_profiles_rls.sql)
**New file** - Fixes RLS infinite recursion bug on user_profiles table.

---

## Database Schema Summary

### Tables Created (migration 005)
- `roles` - User roles (Super Admin, Admin, Manager, Technician, Viewer)
- `modules` - System modules (flowcharts, technicians, teams, vehicles, etc.)
- `actions` - Permission actions (read, create, update, delete, manage, execute)
- `permissions` - Module × Action combinations (e.g., 'flowcharts:read')
- `role_permissions` - Maps roles to permissions
- `user_roles` - Maps users to roles
- `user_profiles` - Extended user data with `is_super_admin` flag

### Key Functions
- `has_permission(user_uuid, permission_key)` - Check if user has permission
- `get_user_permissions(user_uuid)` - Get all permissions for user
- `handle_new_user()` - Trigger that auto-creates user_profile on signup

### RLS Policies
- Users can view their own profile
- Super admins can view all profiles
- Users can update their own profile
- **CRITICAL:** INSERT policy allows authenticated users to create their own profile (fixes trigger issue)

---

## Test User Info

**Email:** markusanderson81@gmail.com
**Status:** Partially created (stuck in redirect loop)
**Action needed:** Delete and recreate after fixing redirect

---

## Next Steps for Next AI Session

### Immediate Tasks (Priority Order)

1. **Fix login redirect** (CRITICAL)
   - Test with service worker completely disabled first
   - If that works, refine service worker auth bypass logic
   - Consider using middleware instead of service worker for auth routes

2. **Test complete auth flow**
   - Signup → Email verification (currently disabled) → Login → Dashboard
   - Verify first user gets `is_super_admin = true`
   - Test permissions with `has_permission()` function

3. **Build Admin Panel UI** (`/admin/users`)
   - List all users with their roles
   - Assign/remove roles from users
   - Create custom roles
   - Visual permission matrix (modules × actions)
   - Delete users (super admin only)

4. **Add Route Protection**
   - Create middleware to check auth on protected routes
   - Redirect to `/login` if not authenticated
   - Redirect to `/unauthorized` if missing permissions
   - Add permission checks to UI components (hide/show based on permissions)

5. **Test RBAC with Different Roles**
   - Create users with different roles (Admin, Manager, Technician, Viewer)
   - Verify permissions work correctly
   - Test that non-super-admins can't access admin functions

---

## Important Files to Know

### Authentication
- [lib/auth/hooks.ts](lib/auth/hooks.ts) - `useAuth()`, `usePermission()`, `useRole()`
- [lib/auth/permissions.ts](lib/auth/permissions.ts) - Permission checking utilities
- [lib/auth/types.ts](lib/auth/types.ts) - TypeScript types for auth system
- [components/auth/ProtectedRoute.tsx](components/auth/ProtectedRoute.tsx) - Route protection wrapper
- [components/auth/PermissionGate.tsx](components/auth/PermissionGate.tsx) - UI element permission gate

### Database
- [supabase/migrations/005_rbac_system.sql](supabase/migrations/005_rbac_system.sql) - Main RBAC schema
- [supabase/migrations/006_fix_user_profiles_rls.sql](supabase/migrations/006_fix_user_profiles_rls.sql) - RLS fix
- [scripts/run-migration.md](scripts/run-migration.md) - Migration guide

### Service Worker
- [public/sw.js](public/sw.js) - PWA service worker (causing redirect issues)

---

## Commands to Run Server

```bash
# Kill all node processes and restart
taskkill /F /IM node.exe /T
del ".next\dev\lock"
npm run dev
```

---

## Supabase Dashboard Links

- **Project:** https://supabase.com/dashboard/project/ksbitgseeqjgarskuwhx
- **SQL Editor:** https://supabase.com/dashboard/project/ksbitgseeqjgarskuwhx/sql
- **Auth Users:** https://supabase.com/dashboard/project/ksbitgseeqjgarskuwhx/auth/users
- **Table Editor:** https://supabase.com/dashboard/project/ksbitgseeqjgarskuwhx/editor

---

## Environment Variables

Check [.env.local](.env.local) for:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## User's Last Words

> "lagra allt, notera ner allt så nästa ai kan köra igång direkt. ja måste sova."

**Translation:** Save everything, note everything down so the next AI can start immediately. I need to sleep.

---

## Summary for Next AI

The authentication system is **90% complete** but there's a **critical redirect bug** preventing users from logging in. The service worker is interfering with auth redirects even after adding bypass logic.

**First thing to do:** Try disabling the service worker completely, test auth, then figure out how to make service worker and auth play nicely together.

All database migrations are done. All auth hooks are ready. Just need to fix the redirect and build the admin UI.

Good luck! 🚀

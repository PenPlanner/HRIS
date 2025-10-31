# Run Migration 005 - RBAC System

Follow these steps to enable authentication and RBAC in your Supabase database:

## 1. Enable Supabase Email Auth

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard/project/ksbitgseeqjgarskuwhx)
2. Navigate to **Authentication** → **Providers**
3. Make sure **Email** provider is enabled
4. Disable "Confirm email" if you want to skip email verification during testing (you can enable it later)

## 2. Run Migration 005

1. Go to [SQL Editor](https://supabase.com/dashboard/project/ksbitgseeqjgarskuwhx/sql)
2. Click **New Query**
3. Copy and paste the entire content of [`supabase/migrations/005_rbac_system.sql`](../supabase/migrations/005_rbac_system.sql)
4. Click **Run** or press `Ctrl + Enter`
5. Wait for success message

## 3. Verify Migration

After running the migration, verify the tables were created:

```sql
-- Check if tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('roles', 'modules', 'actions', 'permissions', 'role_permissions', 'user_roles', 'user_profiles');

-- Check seed data
SELECT name, description, is_system_role FROM roles;
SELECT name, display_name FROM modules;
SELECT name, display_name FROM actions;
SELECT COUNT(*) as permission_count FROM permissions;
```

## 4. Create Your First Admin User

### Option A: Through the App UI

1. Start your dev server: `npm run dev`
2. Go to [http://localhost:3000/login](http://localhost:3000/login)
3. Click "Need an account? Sign Up"
4. Fill in:
   - **Full Name**: Your name
   - **Email**: Your email (e.g., `admin@example.com`)
   - **Password**: Strong password (min 6 characters)
5. Click "Create Account"
6. The first user automatically becomes **Super Admin**!

### Option B: Through Supabase Dashboard

1. Go to [Authentication → Users](https://supabase.com/dashboard/project/ksbitgseeqjgarskuwhx/auth/users)
2. Click **Add User** → **Create new user**
3. Enter:
   - **Email**: Your email
   - **Password**: Your password
   - **Auto Confirm User**: ✓ (check this to skip email verification)
4. Click **Create user**
5. The trigger will automatically create a user_profile and set them as super admin

## 5. Verify Super Admin Status

Check if your user is a super admin:

```sql
-- Replace with your actual user email
SELECT
  up.email,
  up.full_name,
  up.is_super_admin,
  up.created_at
FROM user_profiles up
WHERE up.email = 'admin@example.com';
```

## 6. Test Authentication

1. Go to [http://localhost:3000/login](http://localhost:3000/login)
2. Sign in with your credentials
3. You should be redirected to the homepage
4. Open browser console and check for auth logs

## 7. Test Permissions

Check your permissions:

```sql
-- Replace with your user ID (you can find it in auth.users table)
SELECT * FROM get_user_permissions('your-user-id-here');

-- Or check if you have a specific permission
SELECT has_permission('your-user-id-here', 'flowcharts:read');
```

## Troubleshooting

### Migration fails with "relation already exists"
The migration uses `CREATE TABLE IF NOT EXISTS`, so it should be idempotent. If it fails, check which tables already exist:
```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

### User profile not created automatically
Check if the trigger exists:
```sql
SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'users';
```

### Can't sign in
- Make sure Email provider is enabled in Supabase Auth settings
- Check browser console for errors
- Verify `.env.local` has correct Supabase URL and anon key

### Not super admin
Only the first user becomes super admin. Check:
```sql
SELECT COUNT(*) FROM user_profiles;
```
If > 1, manually set super admin:
```sql
UPDATE user_profiles SET is_super_admin = true WHERE email = 'your-email@example.com';
```

## Next Steps

After migration is complete:
- [ ] Sign in to the app
- [ ] Verify you have super admin access
- [ ] Test creating additional users
- [ ] Assign roles to users
- [ ] Build admin panel UI (next task!)

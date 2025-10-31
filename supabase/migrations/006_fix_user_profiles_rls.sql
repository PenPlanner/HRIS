-- Fix RLS Policies for user_profiles to allow trigger to work
-- The issue: The trigger can't insert into user_profiles because RLS blocks it

-- Drop ALL existing policies on user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Only super admins can create profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow trigger and super admins to create profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can create own profile during signup" ON user_profiles;
DROP POLICY IF EXISTS "Users can view profiles" ON user_profiles;
DROP POLICY IF EXISTS "Only super admins can delete profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow signup trigger to create profiles" ON user_profiles;

-- Recreate policies with correct logic
-- SELECT: Users can view their own profile OR super admins can view all
CREATE POLICY "Users can view profiles" ON user_profiles
FOR SELECT USING (
  id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.id = auth.uid() AND up.is_super_admin = true
  )
);

-- UPDATE: Users can only update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
FOR UPDATE USING (id = auth.uid());

-- INSERT: Allow all authenticated users to insert their own profile
-- This is critical for the signup trigger to work!
-- We check that the ID being inserted matches the authenticated user
CREATE POLICY "Allow signup to create profile" ON user_profiles
FOR INSERT WITH CHECK (
  auth.uid() = id
);

-- DELETE: Only super admins can delete profiles
CREATE POLICY "Only super admins can delete profiles" ON user_profiles
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.id = auth.uid() AND up.is_super_admin = true
  )
);

-- Make sure RLS is enabled
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

COMMENT ON POLICY "Allow signup to create profile" ON user_profiles IS
'Allows the handle_new_user() trigger to insert a profile for the newly created user';

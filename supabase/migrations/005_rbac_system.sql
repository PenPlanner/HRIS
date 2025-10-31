-- RBAC (Role-Based Access Control) System
-- Kraftfullt system för att dela ut granulära permissions till olika roller

-- ============================================
-- Roles Table
-- ============================================
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_system_role BOOLEAN DEFAULT FALSE, -- För att skydda system-roller från att raderas
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Modules och Actions
-- ============================================
CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE, -- t.ex. 'flowcharts', 'technicians', 'teams'
  display_name TEXT NOT NULL, -- t.ex. 'Flowcharts', 'Technicians', 'Teams'
  description TEXT,
  icon TEXT, -- För UI
  route_prefix TEXT, -- t.ex. '/flowcharts', '/technicians'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE, -- t.ex. 'read', 'create', 'update', 'delete'
  display_name TEXT NOT NULL, -- t.ex. 'View', 'Create', 'Edit', 'Delete'
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Permissions (Module + Action combinations)
-- ============================================
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  action_id UUID REFERENCES actions(id) ON DELETE CASCADE,
  permission_key TEXT NOT NULL UNIQUE, -- t.ex. 'flowcharts:read', 'technicians:create'
  display_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(module_id, action_id)
);

-- ============================================
-- Role Permissions (Koppla roller till permissions)
-- ============================================
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  granted_by UUID REFERENCES auth.users(id),
  UNIQUE(role_id, permission_id)
);

-- ============================================
-- User Roles (Koppla users till roller)
-- ============================================
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, role_id)
);

-- ============================================
-- User Profile (Extra user data)
-- ============================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  initials TEXT,
  technician_id UUID REFERENCES technicians(id), -- Koppla till tekniker om relevant
  is_super_admin BOOLEAN DEFAULT FALSE, -- För första admin som kan göra allt
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id);
CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role_id);
CREATE INDEX idx_permissions_module ON permissions(module_id);
CREATE INDEX idx_permissions_action ON permissions(action_id);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_technician ON user_profiles(technician_id);

-- ============================================
-- RLS Policies
-- ============================================

-- Roles
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view roles" ON roles FOR SELECT USING (true);
CREATE POLICY "Only super admins can modify roles" ON roles FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND is_super_admin = true
  )
);

-- Modules
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view modules" ON modules FOR SELECT USING (true);

-- Actions
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view actions" ON actions FOR SELECT USING (true);

-- Permissions
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view permissions" ON permissions FOR SELECT USING (true);

-- Role Permissions
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view role permissions" ON role_permissions FOR SELECT USING (true);
CREATE POLICY "Only super admins can modify role permissions" ON role_permissions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND is_super_admin = true
  )
);

-- User Roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own roles" ON user_roles FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND is_super_admin = true
  )
);
CREATE POLICY "Only super admins can assign roles" ON user_roles FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND is_super_admin = true
  )
);

-- User Profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (
  id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.id = auth.uid() AND up.is_super_admin = true
  )
);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Only super admins can create profiles" ON user_profiles FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND is_super_admin = true
  )
);

-- ============================================
-- Functions
-- ============================================

-- Check if user has permission
CREATE OR REPLACE FUNCTION has_permission(
  user_uuid UUID,
  permission_key_param TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Super admin har alltid alla permissions
  IF EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = user_uuid AND is_super_admin = true
  ) THEN
    RETURN TRUE;
  END IF;

  -- Check om användaren har permissionen via sina roller
  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = user_uuid
      AND p.permission_key = permission_key_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get all permissions for a user
CREATE OR REPLACE FUNCTION get_user_permissions(user_uuid UUID)
RETURNS TABLE (
  permission_key TEXT,
  module_name TEXT,
  action_name TEXT,
  display_name TEXT
) AS $$
BEGIN
  -- Om super admin, returnera alla permissions
  IF EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = user_uuid AND is_super_admin = true
  ) THEN
    RETURN QUERY
    SELECT
      p.permission_key,
      m.name as module_name,
      a.name as action_name,
      p.display_name
    FROM permissions p
    JOIN modules m ON p.module_id = m.id
    JOIN actions a ON p.action_id = a.id;
  ELSE
    -- Annars returnera bara permissions från användarens roller
    RETURN QUERY
    SELECT DISTINCT
      p.permission_key,
      m.name as module_name,
      a.name as action_name,
      p.display_name
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    JOIN modules m ON p.module_id = m.id
    JOIN actions a ON p.action_id = a.id
    WHERE ur.user_id = user_uuid;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger för att auto-skapa user_profile vid ny auth.user
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, full_name, is_super_admin)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    -- Första användaren blir super admin
    NOT EXISTS (SELECT 1 FROM user_profiles)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- Seed Data
-- ============================================

-- Insert standard actions
INSERT INTO actions (name, display_name, description) VALUES
  ('read', 'View', 'Can view/read data'),
  ('create', 'Create', 'Can create new records'),
  ('update', 'Edit', 'Can edit existing records'),
  ('delete', 'Delete', 'Can delete records'),
  ('manage', 'Manage', 'Full management access (create, edit, delete)'),
  ('execute', 'Execute', 'Can execute special actions (e.g., start service)')
ON CONFLICT (name) DO NOTHING;

-- Insert modules
INSERT INTO modules (name, display_name, description, icon, route_prefix) VALUES
  ('flowcharts', 'Flowcharts', 'Service flowcharts and procedures', '📋', '/flowcharts'),
  ('technicians', 'Technicians', 'Technician profiles and management', '👷', '/technicians'),
  ('teams', 'Teams', 'Team organization and structure', '👥', '/admin/teams'),
  ('vehicles', 'Vehicles', 'Service vehicle management', '🚗', '/vehicles'),
  ('training', 'Training', 'Training courses and planning', '📚', '/training'),
  ('bug_reports', 'Bug Reports', 'Issue reporting and tracking', '🐛', '/bug-reports'),
  ('admin', 'Admin Panel', 'Administrative functions', '⚙️', '/admin'),
  ('settings', 'Settings', 'System settings', '🔧', '/admin/settings')
ON CONFLICT (name) DO NOTHING;

-- Create permissions (module × action combinations)
INSERT INTO permissions (module_id, action_id, permission_key, display_name, description)
SELECT
  m.id,
  a.id,
  m.name || ':' || a.name,
  m.display_name || ' - ' || a.display_name,
  'Can ' || a.display_name || ' ' || m.display_name
FROM modules m
CROSS JOIN actions a
WHERE
  -- Alla moduler har read
  a.name = 'read'
  -- Eller (alla moduler utom settings har create, update, delete)
  OR (a.name IN ('create', 'update', 'delete') AND m.name != 'settings')
  -- Admin panel har bara manage
  OR (a.name = 'manage' AND m.name = 'admin')
  -- Flowcharts har execute (för att starta service)
  OR (a.name = 'execute' AND m.name = 'flowcharts')
ON CONFLICT (permission_key) DO NOTHING;

-- Create system roles
INSERT INTO roles (name, description, is_system_role) VALUES
  ('Super Admin', 'Full system access - cannot be deleted', true),
  ('Admin', 'Administrative access to most features', true),
  ('Manager', 'Can manage teams, technicians, and view reports', true),
  ('Technician', 'Can view and execute flowcharts, report bugs', true),
  ('Viewer', 'Read-only access to most modules', true)
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to roles

-- Super Admin: Gets all permissions (handled in has_permission function via is_super_admin flag)

-- Admin: All permissions except super admin functions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Admin'
  AND p.permission_key NOT LIKE 'admin:%'
ON CONFLICT DO NOTHING;

-- Manager: Can manage teams, technicians, vehicles, training
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Manager'
  AND (
    p.permission_key LIKE 'teams:%'
    OR p.permission_key LIKE 'technicians:%'
    OR p.permission_key LIKE 'vehicles:%'
    OR p.permission_key LIKE 'training:%'
    OR p.permission_key IN ('flowcharts:read', 'bug_reports:read')
  )
ON CONFLICT DO NOTHING;

-- Technician: Can read most things, execute flowcharts, create bug reports
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Technician'
  AND (
    p.permission_key LIKE '%:read'
    OR p.permission_key = 'flowcharts:execute'
    OR p.permission_key LIKE 'bug_reports:%'
  )
ON CONFLICT DO NOTHING;

-- Viewer: Read-only access
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Viewer'
  AND p.permission_key LIKE '%:read'
ON CONFLICT DO NOTHING;

-- ============================================
-- Comments
-- ============================================
COMMENT ON TABLE roles IS 'User roles for RBAC';
COMMENT ON TABLE modules IS 'System modules (major features)';
COMMENT ON TABLE actions IS 'Permission actions (read, create, update, delete, etc.)';
COMMENT ON TABLE permissions IS 'Granular permissions (module + action combinations)';
COMMENT ON TABLE role_permissions IS 'Maps roles to permissions';
COMMENT ON TABLE user_roles IS 'Maps users to roles';
COMMENT ON TABLE user_profiles IS 'Extended user profile data';

COMMENT ON FUNCTION has_permission IS 'Check if user has a specific permission';
COMMENT ON FUNCTION get_user_permissions IS 'Get all permissions for a user';

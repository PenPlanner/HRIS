/**
 * Authentication and Authorization Types
 */

import { User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  initials: string | null;
  technician_id: string | null;
  is_super_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  is_system_role: boolean;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  permission_key: string;
  module_name: string;
  action_name: string;
  display_name: string;
}

export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  roles: Role[];
  permissions: Permission[];
  isLoading: boolean;
  isSuperAdmin: boolean;
}

export type PermissionKey =
  // Flowcharts
  | 'flowcharts:read'
  | 'flowcharts:create'
  | 'flowcharts:update'
  | 'flowcharts:delete'
  | 'flowcharts:execute'
  // Technicians
  | 'technicians:read'
  | 'technicians:create'
  | 'technicians:update'
  | 'technicians:delete'
  // Teams
  | 'teams:read'
  | 'teams:create'
  | 'teams:update'
  | 'teams:delete'
  // Vehicles
  | 'vehicles:read'
  | 'vehicles:create'
  | 'vehicles:update'
  | 'vehicles:delete'
  // Training
  | 'training:read'
  | 'training:create'
  | 'training:update'
  | 'training:delete'
  // Bug Reports
  | 'bug_reports:read'
  | 'bug_reports:create'
  | 'bug_reports:update'
  | 'bug_reports:delete'
  // Admin
  | 'admin:manage'
  | 'admin:read'
  // Settings
  | 'settings:read';

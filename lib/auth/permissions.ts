/**
 * Permission Checking Utilities
 */

import { supabase } from '../supabase/client';
import { Permission, PermissionKey } from './types';

/**
 * Check if user has a specific permission
 * Uses the has_permission() database function
 */
export async function hasPermission(
  userId: string | undefined,
  permissionKey: PermissionKey
): Promise<boolean> {
  if (!userId) return false;

  try {
    const { data, error } = await supabase.rpc('has_permission' as any, {
      user_uuid: userId,
      permission_key_param: permissionKey,
    } as any);

    if (error) {
      console.error('[hasPermission] Error:', error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error('[hasPermission] Exception:', error);
    return false;
  }
}

/**
 * Get all permissions for a user
 * Uses the get_user_permissions() database function
 */
export async function getUserPermissions(
  userId: string | undefined
): Promise<Permission[]> {
  if (!userId) return [];

  try {
    const { data, error } = await supabase.rpc('get_user_permissions' as any, {
      user_uuid: userId,
    } as any);

    if (error) {
      console.error('[getUserPermissions] Error:', error);
      return [];
    }

    return (data || []) as Permission[];
  } catch (error) {
    console.error('[getUserPermissions] Exception:', error);
    return [];
  }
}

/**
 * Check if user has ANY of the specified permissions
 */
export async function hasAnyPermission(
  userId: string | undefined,
  permissionKeys: PermissionKey[]
): Promise<boolean> {
  if (!userId || permissionKeys.length === 0) return false;

  const results = await Promise.all(
    permissionKeys.map((key) => hasPermission(userId, key))
  );

  return results.some((result) => result === true);
}

/**
 * Check if user has ALL of the specified permissions
 */
export async function hasAllPermissions(
  userId: string | undefined,
  permissionKeys: PermissionKey[]
): Promise<boolean> {
  if (!userId || permissionKeys.length === 0) return false;

  const results = await Promise.all(
    permissionKeys.map((key) => hasPermission(userId, key))
  );

  return results.every((result) => result === true);
}

/**
 * Check module-level access (any action on a module)
 */
export async function hasModuleAccess(
  userId: string | undefined,
  moduleName: string
): Promise<boolean> {
  if (!userId) return false;

  // Get all permissions and check if any match the module
  const permissions = await getUserPermissions(userId);
  return permissions.some((p) => p.module_name === moduleName);
}

/**
 * Group permissions by module for easier UI rendering
 */
export function groupPermissionsByModule(
  permissions: Permission[]
): Record<string, Permission[]> {
  return permissions.reduce((acc, permission) => {
    const module = permission.module_name;
    if (!acc[module]) {
      acc[module] = [];
    }
    acc[module].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);
}

/**
 * Permission Gate Component
 * Conditionally renders children based on user permissions
 */

'use client';

import { useAuth } from '@/lib/auth/hooks';
import { PermissionKey } from '@/lib/auth/types';

interface PermissionGateProps {
  children: React.ReactNode;
  permission?: PermissionKey;
  permissions?: PermissionKey[];
  requireAll?: boolean; // Require all permissions (default: any)
  role?: string;
  roles?: string[];
  requireSuperAdmin?: boolean;
  fallback?: React.ReactNode;
}

export function PermissionGate({
  children,
  permission,
  permissions = [],
  requireAll = false,
  role,
  roles = [],
  requireSuperAdmin = false,
  fallback = null,
}: PermissionGateProps) {
  const { isSuperAdmin, permissions: userPermissions, roles: userRoles } = useAuth();

  // Super admin always has access
  if (isSuperAdmin) {
    return <>{children}</>;
  }

  // Check super admin requirement
  if (requireSuperAdmin) {
    return <>{fallback}</>;
  }

  // Check single permission
  if (permission) {
    const hasPermission = userPermissions.some(
      (p) => p.permission_key === permission
    );
    if (!hasPermission) {
      return <>{fallback}</>;
    }
  }

  // Check multiple permissions
  if (permissions.length > 0) {
    const checkPermission = (perm: PermissionKey) =>
      userPermissions.some((p) => p.permission_key === perm);

    if (requireAll) {
      // Require ALL permissions
      if (!permissions.every(checkPermission)) {
        return <>{fallback}</>;
      }
    } else {
      // Require ANY permission
      if (!permissions.some(checkPermission)) {
        return <>{fallback}</>;
      }
    }
  }

  // Check single role
  if (role) {
    const hasRole = userRoles.some((r) => r.name === role);
    if (!hasRole) {
      return <>{fallback}</>;
    }
  }

  // Check multiple roles
  if (roles.length > 0) {
    const hasAnyRole = userRoles.some((r) => roles.includes(r.name));
    if (!hasAnyRole) {
      return <>{fallback}</>;
    }
  }

  // All checks passed
  return <>{children}</>;
}

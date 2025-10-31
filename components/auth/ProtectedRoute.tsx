/**
 * Protected Route Component
 * Wraps pages that require authentication
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/hooks';
import { PermissionKey } from '@/lib/auth/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requirePermission?: PermissionKey;
  requireRole?: string;
  requireSuperAdmin?: boolean;
  fallbackPath?: string;
}

export function ProtectedRoute({
  children,
  requirePermission,
  requireRole,
  requireSuperAdmin = false,
  fallbackPath = '/login',
}: ProtectedRouteProps) {
  const router = useRouter();
  const { user, profile, roles, permissions, isLoading, isSuperAdmin } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    // Not authenticated
    if (!user) {
      router.push(fallbackPath);
      return;
    }

    // Require super admin
    if (requireSuperAdmin && !isSuperAdmin) {
      router.push('/unauthorized');
      return;
    }

    // Require specific role
    if (requireRole && !isSuperAdmin) {
      const hasRole = roles.some((r) => r.name === requireRole);
      if (!hasRole) {
        router.push('/unauthorized');
        return;
      }
    }

    // Require specific permission
    if (requirePermission && !isSuperAdmin) {
      const hasPermission = permissions.some(
        (p) => p.permission_key === requirePermission
      );
      if (!hasPermission) {
        router.push('/unauthorized');
        return;
      }
    }
  }, [
    user,
    profile,
    roles,
    permissions,
    isLoading,
    isSuperAdmin,
    requirePermission,
    requireRole,
    requireSuperAdmin,
    fallbackPath,
    router,
  ]);

  // Show loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laddar...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return null;
  }

  // Render children if all checks pass
  return <>{children}</>;
}

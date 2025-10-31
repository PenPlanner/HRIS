/**
 * Authentication and Authorization React Hooks
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../supabase/client';
import { AuthState, UserProfile, Role, Permission, PermissionKey } from './types';
import { getUserPermissions, hasPermission as checkPermission } from './permissions';

/**
 * Main authentication hook
 * Provides user, profile, roles, and permissions
 */
export function useAuth(): AuthState & {
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  refreshAuth: () => Promise<void>;
} {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isSuperAdmin = profile?.is_super_admin === true;

  // Load user profile, roles, and permissions
  const loadUserData = useCallback(async (userId: string) => {
    try {
      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('[useAuth] Profile error:', profileError);
        return;
      }

      setProfile(profileData as UserProfile);

      // Load roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('roles(*)')
        .eq('user_id', userId);

      if (rolesError) {
        console.error('[useAuth] Roles error:', rolesError);
      } else {
        const userRoles = rolesData?.map((r: any) => r.roles).filter(Boolean) || [];
        setRoles(userRoles as Role[]);
      }

      // Load permissions
      const userPermissions = await getUserPermissions(userId);
      setPermissions(userPermissions);

      console.log('[useAuth] User data loaded:', {
        profile: profileData,
        roles: rolesData?.length || 0,
        permissions: userPermissions.length,
        isSuperAdmin: profileData?.is_super_admin,
      });
    } catch (error) {
      console.error('[useAuth] Error loading user data:', error);
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('[useAuth] Session error:', error);
          setIsLoading(false);
          return;
        }

        if (session?.user && mounted) {
          setUser(session.user);
          await loadUserData(session.user.id);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('[useAuth] Init error:', error);
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[useAuth] Auth state changed:', event);

        if (session?.user && mounted) {
          setUser(session.user);
          await loadUserData(session.user.id);
        } else if (mounted) {
          setUser(null);
          setProfile(null);
          setRoles([]);
          setPermissions([]);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadUserData]);

  // Sign in
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[useAuth] Sign in error:', error);
        throw error;
      }

      console.log('[useAuth] Signed in successfully');
    } catch (error) {
      console.error('[useAuth] Sign in exception:', error);
      throw error;
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('[useAuth] Sign out error:', error);
        throw error;
      }

      setUser(null);
      setProfile(null);
      setRoles([]);
      setPermissions([]);

      console.log('[useAuth] Signed out successfully');
    } catch (error) {
      console.error('[useAuth] Sign out exception:', error);
      throw error;
    }
  }, []);

  // Sign up
  const signUp = useCallback(async (email: string, password: string, fullName?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        console.error('[useAuth] Sign up error:', error);
        throw error;
      }

      console.log('[useAuth] Signed up successfully');
    } catch (error) {
      console.error('[useAuth] Sign up exception:', error);
      throw error;
    }
  }, []);

  // Refresh auth data
  const refreshAuth = useCallback(async () => {
    if (user) {
      await loadUserData(user.id);
    }
  }, [user, loadUserData]);

  return {
    user,
    profile,
    roles,
    permissions,
    isLoading,
    isSuperAdmin,
    signIn,
    signOut,
    signUp,
    refreshAuth,
  };
}

/**
 * Permission checking hook
 * Returns a function to check if current user has permission
 */
export function usePermission() {
  const { user, isSuperAdmin, permissions } = useAuth();

  const hasPermission = useCallback(
    async (permissionKey: PermissionKey): Promise<boolean> => {
      // Super admin always has all permissions
      if (isSuperAdmin) return true;

      // Check in cached permissions first (faster)
      const hasInCache = permissions.some(
        (p) => p.permission_key === permissionKey
      );

      if (hasInCache) return true;

      // Fallback to database check
      return checkPermission(user?.id, permissionKey);
    },
    [user?.id, isSuperAdmin, permissions]
  );

  return { hasPermission, isSuperAdmin };
}

/**
 * Role checking hook
 * Returns a function to check if current user has role
 */
export function useRole() {
  const { roles, isSuperAdmin } = useAuth();

  const hasRole = useCallback(
    (roleName: string): boolean => {
      if (isSuperAdmin) return true;
      return roles.some((r) => r.name === roleName);
    },
    [roles, isSuperAdmin]
  );

  const hasAnyRole = useCallback(
    (roleNames: string[]): boolean => {
      if (isSuperAdmin) return true;
      return roles.some((r) => roleNames.includes(r.name));
    },
    [roles, isSuperAdmin]
  );

  return { hasRole, hasAnyRole, roles, isSuperAdmin };
}

/**
 * Module access hook
 * Checks if user has any permission on a module
 */
export function useModuleAccess(moduleName: string) {
  const { permissions, isSuperAdmin, isLoading } = useAuth();

  const hasAccess = isSuperAdmin || permissions.some(
    (p) => p.module_name === moduleName
  );

  return { hasAccess, isLoading };
}

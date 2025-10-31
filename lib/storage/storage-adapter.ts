/**
 * Storage Adapter Interface
 *
 * This abstraction layer allows us to seamlessly switch between
 * localStorage (current) and Supabase (future) without changing
 * any business logic code.
 *
 * Usage:
 * import { storage } from '@/lib/storage/storage-adapter';
 *
 * // Read data
 * const data = await storage.get('completed-flowcharts');
 *
 * // Write data
 * await storage.set('completed-flowcharts', data);
 */

export interface StorageAdapter {
  /**
   * Get data from storage
   * @param key - The storage key
   * @returns Promise resolving to the data, or null if not found
   */
  get<T = any>(key: string): Promise<T | null>;

  /**
   * Set data in storage
   * @param key - The storage key
   * @param value - The data to store
   */
  set<T = any>(key: string, value: T): Promise<void>;

  /**
   * Remove data from storage
   * @param key - The storage key
   */
  remove(key: string): Promise<void>;

  /**
   * Clear all data from storage
   */
  clear(): Promise<void>;

  /**
   * Get all keys in storage
   */
  keys(): Promise<string[]>;

  /**
   * Check if a key exists
   */
  has(key: string): Promise<boolean>;

  /**
   * Get multiple values at once (batch operation)
   */
  getMany<T = any>(keys: string[]): Promise<Record<string, T | null>>;

  /**
   * Set multiple values at once (batch operation)
   */
  setMany(items: Record<string, any>): Promise<void>;
}

/**
 * Sync Adapter Interface
 *
 * For Supabase integration, handles offline queue and conflict resolution
 */
export interface SyncAdapter {
  /**
   * Queue a mutation for later sync (when offline)
   */
  queueMutation(
    table: string,
    recordId: string,
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    data: any
  ): Promise<void>;

  /**
   * Sync all pending mutations to server
   */
  syncPending(): Promise<{
    synced: number;
    failed: number;
    conflicts: number;
  }>;

  /**
   * Check if we're currently online
   */
  isOnline(): boolean;

  /**
   * Get pending sync count
   */
  getPendingCount(): Promise<number>;

  /**
   * Get sync conflicts requiring resolution
   */
  getConflicts(): Promise<any[]>;

  /**
   * Resolve a conflict
   */
  resolveConflict(
    conflictId: string,
    resolution: 'local' | 'remote' | 'manual',
    data?: any
  ): Promise<void>;
}

/**
 * Device Info for tracking which device made changes
 */
export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
}

/**
 * Get device info for tracking
 */
export function getDeviceInfo(): DeviceInfo {
  // Generate or retrieve stable device ID
  let deviceId = localStorage.getItem('device-id');
  if (!deviceId) {
    deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('device-id', deviceId);
  }

  // Detect device type
  const userAgent = navigator.userAgent.toLowerCase();
  const isTablet = /ipad|android(?!.*mobile)/.test(userAgent);
  const isMobile = /mobile|iphone|ipod|android/.test(userAgent);

  return {
    deviceId,
    deviceName: localStorage.getItem('device-name') || 'Unknown Device',
    deviceType: isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop',
  };
}

/**
 * Set device name (user-friendly)
 */
export function setDeviceName(name: string) {
  localStorage.setItem('device-name', name);
}

/**
 * Storage Module - Main Export
 *
 * This module provides a unified storage interface that abstracts away
 * the underlying storage mechanism (localStorage, IndexedDB, or Supabase).
 *
 * Usage:
 * import { storage, sync } from '@/lib/storage';
 *
 * // Use storage adapter
 * const data = await storage.get('my-key');
 * await storage.set('my-key', { foo: 'bar' });
 *
 * // Use sync manager for offline queue
 * await sync.queueMutation('technicians', '123', 'UPDATE', data);
 * const result = await sync.syncPending();
 */

import { StorageAdapter, SyncAdapter } from './storage-adapter';
import { localStorageAdapter } from './local-storage-adapter';
import { indexedDBAdapter } from './indexeddb-adapter';
import { supabaseAdapter } from './supabase-adapter';
import { syncManager } from './sync-manager';

/**
 * Storage Configuration
 */
export const STORAGE_CONFIG = {
  // Which adapter to use: 'localStorage', 'indexedDB', or 'supabase'
  // Supabase is now enabled for cloud storage with offline support!
  preferredAdapter: 'supabase' as 'localStorage' | 'indexedDB' | 'supabase',

  // Enable offline queue (for Supabase integration)
  enableOfflineQueue: true,

  // Auto-sync interval (in ms) - 0 to disable
  autoSyncInterval: 60000, // 1 minute

  // Maximum sync attempts before giving up
  maxSyncAttempts: 3,
};

/**
 * Get the appropriate storage adapter based on configuration and availability
 */
function getStorageAdapter(): StorageAdapter {
  // Check if we're in browser
  if (typeof window === 'undefined') {
    console.log('[Storage] Server-side detected, using LocalStorage adapter');
    return localStorageAdapter;
  }

  // Supabase adapter (with IndexedDB cache and offline support)
  if (STORAGE_CONFIG.preferredAdapter === 'supabase') {
    console.log('[Storage] Using Supabase adapter with offline support');
    return supabaseAdapter;
  }

  // IndexedDB adapter
  const hasIndexedDB = 'indexedDB' in window;
  if (STORAGE_CONFIG.preferredAdapter === 'indexedDB' && hasIndexedDB) {
    console.log('[Storage] Using IndexedDB adapter');
    return indexedDBAdapter;
  }

  // Fallback to localStorage
  console.log('[Storage] Using LocalStorage adapter');
  return localStorageAdapter;
}

/**
 * Main storage instance
 * Use this for all storage operations
 */
export const storage: StorageAdapter = getStorageAdapter();

/**
 * Sync manager instance
 * Use this for offline queue and conflict resolution
 */
export const sync: SyncAdapter = syncManager;

/**
 * Auto-sync setup
 */
if (typeof window !== 'undefined' && STORAGE_CONFIG.enableOfflineQueue) {
  // Auto-sync when coming back online
  syncManager.onOnlineStatusChange((online) => {
    if (online) {
      console.log('[Storage] Back online, triggering auto-sync');
      sync.syncPending().catch((error) => {
        console.error('[Storage] Auto-sync failed:', error);
      });
    }
  });

  // Periodic auto-sync (if configured)
  if (STORAGE_CONFIG.autoSyncInterval > 0) {
    setInterval(() => {
      if (syncManager.isOnline()) {
        sync.syncPending().catch((error) => {
          console.error('[Storage] Periodic sync failed:', error);
        });
      }
    }, STORAGE_CONFIG.autoSyncInterval);
  }
}

/**
 * Re-export types and utilities
 */
export type { StorageAdapter, SyncAdapter, DeviceInfo } from './storage-adapter';
export { getDeviceInfo, setDeviceName } from './storage-adapter';
export type { QueuedMutation, SyncConflict } from './sync-manager';

/**
 * Helper function to migrate data from localStorage to IndexedDB
 */
export async function migrateLocalStorageToIndexedDB(keys: string[]): Promise<void> {
  console.log(`[Storage] Migrating ${keys.length} keys from localStorage to IndexedDB`);

  for (const key of keys) {
    try {
      const value = await localStorageAdapter.get(key);
      if (value !== null) {
        await indexedDBAdapter.set(key, value);
        console.log(`[Storage] Migrated "${key}"`);
      }
    } catch (error) {
      console.error(`[Storage] Failed to migrate "${key}":`, error);
    }
  }

  console.log('[Storage] Migration complete');
}

/**
 * Helper function to check storage usage
 */
export async function getStorageStats(): Promise<{
  adapter: string;
  keyCount: number;
  pendingSync: number;
  conflicts: number;
  lastSync: number | null;
}> {
  const keys = await storage.keys();
  const pendingSync = await sync.getPendingCount();
  const conflicts = (await sync.getConflicts()).length;
  const lastSync = await syncManager.getLastSyncTime();

  return {
    adapter: STORAGE_CONFIG.preferredAdapter,
    keyCount: keys.length,
    pendingSync,
    conflicts,
    lastSync,
  };
}

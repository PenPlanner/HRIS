/**
 * Supabase Storage Adapter
 *
 * Implements the StorageAdapter interface using Supabase as the backend.
 * Provides cloud storage with local caching for offline support.
 */

import { StorageAdapter } from './storage-adapter';
import { supabase } from '../supabase/client';
import { indexedDBAdapter } from './indexeddb-adapter';

/**
 * Supabase table for generic key-value storage
 * We'll store PWA data (bug reports, completed flowcharts, etc.) here
 */
const STORAGE_TABLE = 'pwa_storage';

class SupabaseAdapter implements StorageAdapter {
  private cache: Map<string, any> = new Map();
  private initialized = false;

  /**
   * Initialize the adapter (create table if needed)
   */
  private async initialize(): Promise<void> {
    if (this.initialized) return;

    // Check if storage table exists
    // If not, we'll need to create it via migration
    // For now, we'll use IndexedDB as local cache

    this.initialized = true;
    console.log('[SupabaseAdapter] Initialized');
  }

  /**
   * Get value by key
   * Tries local cache first, then IndexedDB, then Supabase cloud
   */
  async get<T = any>(key: string): Promise<T | null> {
    await this.initialize();

    // Check memory cache first
    if (this.cache.has(key)) {
      return this.cache.get(key) as T;
    }

    try {
      // Try IndexedDB cache (faster than network)
      const cached = await indexedDBAdapter.get<T>(key);
      if (cached !== null) {
        this.cache.set(key, cached);
        return cached;
      }

      // If not in cache and online, try Supabase
      if (navigator.onLine) {
        const { data, error } = await supabase
          .rpc('get_pwa_storage' as any, {
            storage_key: key,
            storage_user_id: null
          } as any);

        if (error) {
          console.error(`[SupabaseAdapter] Supabase error for "${key}":`, error);
          return null;
        }

        if (data) {
          // Cache in memory and IndexedDB
          this.cache.set(key, data);
          await indexedDBAdapter.set(key, data);
          return data as T;
        }
      }

      return null;
    } catch (error) {
      console.error(`[SupabaseAdapter] Failed to get "${key}":`, error);

      // Fallback to IndexedDB
      return await indexedDBAdapter.get<T>(key);
    }
  }

  /**
   * Set value by key
   * Writes to local cache immediately, syncs to cloud if online
   */
  async set<T = any>(key: string, value: T): Promise<void> {
    await this.initialize();

    try {
      // Update memory cache
      this.cache.set(key, value);

      // Write to IndexedDB immediately (offline-first)
      await indexedDBAdapter.set(key, value);

      // Sync to cloud if online
      if (navigator.onLine) {
        try {
          const { error } = await supabase.rpc('upsert_pwa_storage' as any, {
            storage_key: key,
            storage_value: value as any,
            storage_device_id: null, // TODO: Get actual device ID
            storage_user_id: null, // TODO: Get actual user ID from auth
          } as any);

          if (error) {
            console.error(`[SupabaseAdapter] Failed to sync "${key}" to cloud:`, error);
            // Don't throw - local write succeeded, cloud sync can retry later
          } else {
            console.log(`[SupabaseAdapter] Successfully synced "${key}" to cloud`);
          }
        } catch (syncError) {
          console.error(`[SupabaseAdapter] Cloud sync error for "${key}":`, syncError);
          // Don't throw - local write succeeded
        }
      }
    } catch (error) {
      console.error(`[SupabaseAdapter] Failed to set "${key}":`, error);
      throw error;
    }
  }

  /**
   * Remove value by key
   */
  async remove(key: string): Promise<void> {
    await this.initialize();

    try {
      // Remove from memory cache
      this.cache.delete(key);

      // Remove from IndexedDB
      await indexedDBAdapter.remove(key);

      // Delete from cloud if online
      if (navigator.onLine) {
        try {
          const { error } = await supabase.rpc('delete_pwa_storage' as any, {
            storage_key: key,
            storage_user_id: null,
          } as any);

          if (error) {
            console.error(`[SupabaseAdapter] Failed to delete "${key}" from cloud:`, error);
          } else {
            console.log(`[SupabaseAdapter] Successfully deleted "${key}" from cloud`);
          }
        } catch (syncError) {
          console.error(`[SupabaseAdapter] Cloud deletion error for "${key}":`, syncError);
        }
      }
    } catch (error) {
      console.error(`[SupabaseAdapter] Failed to remove "${key}":`, error);
      throw error;
    }
  }

  /**
   * Clear all values
   */
  async clear(): Promise<void> {
    await this.initialize();

    try {
      // Clear memory cache
      this.cache.clear();

      // Clear IndexedDB
      await indexedDBAdapter.clear();

      // Queue cloud clear if online
      if (navigator.onLine) {
        // TODO: Implement Supabase key-value table truncate
        console.log('[SupabaseAdapter] Queued cloud clear');
      }
    } catch (error) {
      console.error('[SupabaseAdapter] Failed to clear storage:', error);
      throw error;
    }
  }

  /**
   * Get all keys
   */
  async keys(): Promise<string[]> {
    await this.initialize();

    try {
      // Get from IndexedDB (faster than network)
      return await indexedDBAdapter.keys();
    } catch (error) {
      console.error('[SupabaseAdapter] Failed to get keys:', error);
      return [];
    }
  }

  /**
   * Check if key exists
   */
  async has(key: string): Promise<boolean> {
    await this.initialize();

    // Check memory cache
    if (this.cache.has(key)) {
      return true;
    }

    try {
      // Check IndexedDB
      return await indexedDBAdapter.has(key);
    } catch (error) {
      console.error(`[SupabaseAdapter] Failed to check "${key}":`, error);
      return false;
    }
  }

  /**
   * Get multiple values at once (batch operation)
   */
  async getMany<T = any>(keys: string[]): Promise<Record<string, T | null>> {
    await this.initialize();

    try {
      // Use IndexedDB batch operation
      return await indexedDBAdapter.getMany<T>(keys);
    } catch (error) {
      console.error('[SupabaseAdapter] Failed to get many:', error);

      // Fallback to individual gets
      const result: Record<string, T | null> = {};
      for (const key of keys) {
        result[key] = await this.get<T>(key);
      }
      return result;
    }
  }

  /**
   * Set multiple values at once (batch operation)
   */
  async setMany(items: Record<string, any>): Promise<void> {
    await this.initialize();

    try {
      // Update memory cache
      Object.entries(items).forEach(([key, value]) => {
        this.cache.set(key, value);
      });

      // Batch write to IndexedDB
      await indexedDBAdapter.setMany(items);

      // Queue cloud sync if online
      if (navigator.onLine) {
        // TODO: Implement Supabase batch upsert
        console.log('[SupabaseAdapter] Queued cloud sync for batch:', Object.keys(items).length);
      }
    } catch (error) {
      console.error('[SupabaseAdapter] Failed to set many:', error);
      throw error;
    }
  }

  /**
   * Sync local changes to cloud (manual trigger)
   */
  async syncToCloud(): Promise<void> {
    if (!navigator.onLine) {
      console.log('[SupabaseAdapter] Cannot sync while offline');
      return;
    }

    console.log('[SupabaseAdapter] Starting cloud sync...');

    // TODO: Implement actual cloud sync
    // 1. Get all keys from IndexedDB
    // 2. Compare with cloud (last modified timestamps)
    // 3. Upload newer local changes
    // 4. Download newer cloud changes
    // 5. Handle conflicts

    console.log('[SupabaseAdapter] Cloud sync complete (placeholder)');
  }

  /**
   * Pull latest data from cloud
   */
  async pullFromCloud(): Promise<void> {
    if (!navigator.onLine) {
      console.log('[SupabaseAdapter] Cannot pull while offline');
      return;
    }

    console.log('[SupabaseAdapter] Pulling from cloud...');

    // TODO: Implement cloud pull

    console.log('[SupabaseAdapter] Pull complete (placeholder)');
  }
}

/**
 * Singleton instance
 */
export const supabaseAdapter = new SupabaseAdapter();

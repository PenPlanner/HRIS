/**
 * LocalStorage Implementation of StorageAdapter
 *
 * Current implementation - uses browser localStorage
 * This will eventually be replaced/augmented with Supabase
 */

import { StorageAdapter } from './storage-adapter';

export class LocalStorageAdapter implements StorageAdapter {
  /**
   * Get data from localStorage
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return null;
      }
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`[LocalStorage] Error getting key "${key}":`, error);
      return null;
    }
  }

  /**
   * Set data in localStorage
   */
  async set<T = any>(key: string, value: T): Promise<void> {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`[LocalStorage] Error setting key "${key}":`, error);
      throw error;
    }
  }

  /**
   * Remove data from localStorage
   */
  async remove(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`[LocalStorage] Error removing key "${key}":`, error);
      throw error;
    }
  }

  /**
   * Clear all data from localStorage
   */
  async clear(): Promise<void> {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('[LocalStorage] Error clearing storage:', error);
      throw error;
    }
  }

  /**
   * Get all keys in localStorage
   */
  async keys(): Promise<string[]> {
    try {
      return Object.keys(localStorage);
    } catch (error) {
      console.error('[LocalStorage] Error getting keys:', error);
      return [];
    }
  }

  /**
   * Check if a key exists
   */
  async has(key: string): Promise<boolean> {
    try {
      return localStorage.getItem(key) !== null;
    } catch (error) {
      console.error(`[LocalStorage] Error checking key "${key}":`, error);
      return false;
    }
  }

  /**
   * Get multiple values at once (batch operation)
   */
  async getMany<T = any>(keys: string[]): Promise<Record<string, T | null>> {
    const result: Record<string, T | null> = {};

    for (const key of keys) {
      result[key] = await this.get<T>(key);
    }

    return result;
  }

  /**
   * Set multiple values at once (batch operation)
   */
  async setMany(items: Record<string, any>): Promise<void> {
    for (const [key, value] of Object.entries(items)) {
      await this.set(key, value);
    }
  }
}

/**
 * Singleton instance
 */
export const localStorageAdapter = new LocalStorageAdapter();

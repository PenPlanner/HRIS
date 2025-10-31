/**
 * IndexedDB Implementation of StorageAdapter
 *
 * Better performance than localStorage, especially for large data
 * This is the intermediate step before Supabase integration
 */

import { StorageAdapter } from './storage-adapter';

const DB_NAME = 'hris-storage';
const DB_VERSION = 1;
const STORE_NAME = 'key-value';

export class IndexedDBAdapter implements StorageAdapter {
  private db: IDBDatabase | null = null;

  /**
   * Initialize the IndexedDB database
   */
  private async initDB(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Get a transaction for the object store
   */
  private async getTransaction(
    mode: IDBTransactionMode = 'readonly'
  ): Promise<IDBObjectStore> {
    const db = await this.initDB();
    const transaction = db.transaction([STORE_NAME], mode);
    return transaction.objectStore(STORE_NAME);
  }

  /**
   * Get data from IndexedDB
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const store = await this.getTransaction('readonly');

      return new Promise((resolve, reject) => {
        const request = store.get(key);

        request.onsuccess = () => {
          const result = request.result;
          resolve(result ? result.value : null);
        };

        request.onerror = () => {
          reject(new Error(`Failed to get key "${key}"`));
        };
      });
    } catch (error) {
      console.error(`[IndexedDB] Error getting key "${key}":`, error);
      return null;
    }
  }

  /**
   * Set data in IndexedDB
   */
  async set<T = any>(key: string, value: T): Promise<void> {
    try {
      const store = await this.getTransaction('readwrite');

      return new Promise((resolve, reject) => {
        const request = store.put({ key, value });

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          reject(new Error(`Failed to set key "${key}"`));
        };
      });
    } catch (error) {
      console.error(`[IndexedDB] Error setting key "${key}":`, error);
      throw error;
    }
  }

  /**
   * Remove data from IndexedDB
   */
  async remove(key: string): Promise<void> {
    try {
      const store = await this.getTransaction('readwrite');

      return new Promise((resolve, reject) => {
        const request = store.delete(key);

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          reject(new Error(`Failed to remove key "${key}"`));
        };
      });
    } catch (error) {
      console.error(`[IndexedDB] Error removing key "${key}":`, error);
      throw error;
    }
  }

  /**
   * Clear all data from IndexedDB
   */
  async clear(): Promise<void> {
    try {
      const store = await this.getTransaction('readwrite');

      return new Promise((resolve, reject) => {
        const request = store.clear();

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          reject(new Error('Failed to clear IndexedDB'));
        };
      });
    } catch (error) {
      console.error('[IndexedDB] Error clearing storage:', error);
      throw error;
    }
  }

  /**
   * Get all keys in IndexedDB
   */
  async keys(): Promise<string[]> {
    try {
      const store = await this.getTransaction('readonly');

      return new Promise((resolve, reject) => {
        const request = store.getAllKeys();

        request.onsuccess = () => {
          resolve(request.result as string[]);
        };

        request.onerror = () => {
          reject(new Error('Failed to get keys'));
        };
      });
    } catch (error) {
      console.error('[IndexedDB] Error getting keys:', error);
      return [];
    }
  }

  /**
   * Check if a key exists
   */
  async has(key: string): Promise<boolean> {
    try {
      const value = await this.get(key);
      return value !== null;
    } catch (error) {
      console.error(`[IndexedDB] Error checking key "${key}":`, error);
      return false;
    }
  }

  /**
   * Get multiple values at once (batch operation)
   */
  async getMany<T = any>(keys: string[]): Promise<Record<string, T | null>> {
    const result: Record<string, T | null> = {};

    // IndexedDB doesn't support batch reads natively, so we parallelize
    const promises = keys.map(async (key) => {
      result[key] = await this.get<T>(key);
    });

    await Promise.all(promises);

    return result;
  }

  /**
   * Set multiple values at once (batch operation)
   */
  async setMany(items: Record<string, any>): Promise<void> {
    // Use a single transaction for better performance
    const store = await this.getTransaction('readwrite');

    const promises = Object.entries(items).map(([key, value]) => {
      return new Promise<void>((resolve, reject) => {
        const request = store.put({ key, value });

        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error(`Failed to set key "${key}"`));
      });
    });

    await Promise.all(promises);
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

/**
 * Singleton instance
 */
export const indexedDBAdapter = new IndexedDBAdapter();

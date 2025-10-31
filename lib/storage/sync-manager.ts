/**
 * Sync Manager
 *
 * Handles offline queue, conflict resolution, and syncing with Supabase
 * Works in conjunction with the storage adapters
 */

import { SyncAdapter, getDeviceInfo } from './storage-adapter';
import { indexedDBAdapter } from './indexeddb-adapter';

const SYNC_QUEUE_KEY = 'sync-queue';
const CONFLICTS_KEY = 'sync-conflicts';
const LAST_SYNC_KEY = 'last-sync-timestamp';

export interface QueuedMutation {
  id: string;
  table: string;
  recordId: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  data: any;
  deviceId: string;
  timestamp: number;
  attempts: number;
  lastError?: string;
}

export interface SyncConflict {
  id: string;
  table: string;
  recordId: string;
  localData: any;
  remoteData: any;
  timestamp: number;
}

export class SyncManager implements SyncAdapter {
  private onlineListeners: Set<(online: boolean) => void> = new Set();
  private syncInProgress = false;

  constructor() {
    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnlineStatusChange(true));
      window.addEventListener('offline', () => this.handleOnlineStatusChange(false));
    }
  }

  /**
   * Check if we're currently online
   */
  isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  /**
   * Subscribe to online status changes
   */
  onOnlineStatusChange(listener: (online: boolean) => void): () => void {
    this.onlineListeners.add(listener);
    return () => this.onlineListeners.delete(listener);
  }

  /**
   * Handle online status change
   */
  private handleOnlineStatusChange(online: boolean): void {
    console.log(`[SyncManager] Network status: ${online ? 'online' : 'offline'}`);

    // Notify listeners
    this.onlineListeners.forEach((listener) => listener(online));

    // Auto-sync when coming back online
    if (online && !this.syncInProgress) {
      this.syncPending().catch((error) => {
        console.error('[SyncManager] Auto-sync failed:', error);
      });
    }
  }

  /**
   * Queue a mutation for later sync (when offline)
   */
  async queueMutation(
    table: string,
    recordId: string,
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    data: any
  ): Promise<void> {
    const deviceInfo = getDeviceInfo();

    const mutation: QueuedMutation = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      table,
      recordId,
      operation,
      data,
      deviceId: deviceInfo.deviceId,
      timestamp: Date.now(),
      attempts: 0,
    };

    // Get existing queue
    const queue = (await indexedDBAdapter.get<QueuedMutation[]>(SYNC_QUEUE_KEY)) || [];

    // Add new mutation
    queue.push(mutation);

    // Save updated queue
    await indexedDBAdapter.set(SYNC_QUEUE_KEY, queue);

    console.log(`[SyncManager] Queued ${operation} for ${table}/${recordId}`);

    // If we're online, try to sync immediately
    if (this.isOnline() && !this.syncInProgress) {
      this.syncPending().catch((error) => {
        console.error('[SyncManager] Immediate sync failed:', error);
      });
    }
  }

  /**
   * Get pending sync count
   */
  async getPendingCount(): Promise<number> {
    const queue = (await indexedDBAdapter.get<QueuedMutation[]>(SYNC_QUEUE_KEY)) || [];
    return queue.length;
  }

  /**
   * Sync all pending mutations to server
   */
  async syncPending(): Promise<{
    synced: number;
    failed: number;
    conflicts: number;
  }> {
    if (!this.isOnline()) {
      console.log('[SyncManager] Cannot sync while offline');
      return { synced: 0, failed: 0, conflicts: 0 };
    }

    if (this.syncInProgress) {
      console.log('[SyncManager] Sync already in progress');
      return { synced: 0, failed: 0, conflicts: 0 };
    }

    this.syncInProgress = true;

    try {
      const queue = (await indexedDBAdapter.get<QueuedMutation[]>(SYNC_QUEUE_KEY)) || [];

      if (queue.length === 0) {
        console.log('[SyncManager] No pending mutations to sync');
        return { synced: 0, failed: 0, conflicts: 0 };
      }

      console.log(`[SyncManager] Syncing ${queue.length} pending mutations`);

      let synced = 0;
      let failed = 0;
      let conflicts = 0;
      const remainingQueue: QueuedMutation[] = [];

      for (const mutation of queue) {
        try {
          // TODO: Replace with actual Supabase API calls
          const success = await this.syncMutation(mutation);

          if (success) {
            synced++;
          } else {
            // Check if it's a conflict
            const isConflict = await this.checkForConflict(mutation);
            if (isConflict) {
              conflicts++;
              await this.recordConflict(mutation);
            } else {
              failed++;
              mutation.attempts++;
              mutation.lastError = 'Sync failed';
              remainingQueue.push(mutation);
            }
          }
        } catch (error) {
          console.error(`[SyncManager] Failed to sync mutation:`, error);
          failed++;
          mutation.attempts++;
          mutation.lastError = error instanceof Error ? error.message : 'Unknown error';
          remainingQueue.push(mutation);
        }
      }

      // Update queue with only failed items
      await indexedDBAdapter.set(SYNC_QUEUE_KEY, remainingQueue);

      // Update last sync timestamp
      await indexedDBAdapter.set(LAST_SYNC_KEY, Date.now());

      console.log(
        `[SyncManager] Sync complete: ${synced} synced, ${failed} failed, ${conflicts} conflicts`
      );

      return { synced, failed, conflicts };
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Sync a single mutation to Supabase
   * TODO: Replace with actual Supabase API calls
   */
  private async syncMutation(mutation: QueuedMutation): Promise<boolean> {
    // Placeholder for Supabase integration
    // When Supabase is set up, this will make actual API calls

    console.log(`[SyncManager] Syncing ${mutation.operation} to ${mutation.table}`);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // For now, just return success
    // In production, this would actually sync to Supabase
    return true;
  }

  /**
   * Check if a mutation resulted in a conflict
   */
  private async checkForConflict(mutation: QueuedMutation): Promise<boolean> {
    // TODO: Implement conflict detection with Supabase
    // Check if the remote record has been modified since we queued our change
    return false;
  }

  /**
   * Record a conflict for later resolution
   */
  private async recordConflict(mutation: QueuedMutation): Promise<void> {
    const conflict: SyncConflict = {
      id: `conflict-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      table: mutation.table,
      recordId: mutation.recordId,
      localData: mutation.data,
      remoteData: {}, // TODO: Fetch from Supabase
      timestamp: Date.now(),
    };

    const conflicts = (await indexedDBAdapter.get<SyncConflict[]>(CONFLICTS_KEY)) || [];
    conflicts.push(conflict);
    await indexedDBAdapter.set(CONFLICTS_KEY, conflicts);

    console.log(`[SyncManager] Recorded conflict for ${mutation.table}/${mutation.recordId}`);
  }

  /**
   * Get sync conflicts requiring resolution
   */
  async getConflicts(): Promise<SyncConflict[]> {
    return (await indexedDBAdapter.get<SyncConflict[]>(CONFLICTS_KEY)) || [];
  }

  /**
   * Resolve a conflict
   */
  async resolveConflict(
    conflictId: string,
    resolution: 'local' | 'remote' | 'manual',
    data?: any
  ): Promise<void> {
    const conflicts = (await indexedDBAdapter.get<SyncConflict[]>(CONFLICTS_KEY)) || [];
    const conflictIndex = conflicts.findIndex((c) => c.id === conflictId);

    if (conflictIndex === -1) {
      throw new Error(`Conflict ${conflictId} not found`);
    }

    const conflict = conflicts[conflictIndex];

    // Determine final data based on resolution strategy
    let finalData: any;
    switch (resolution) {
      case 'local':
        finalData = conflict.localData;
        break;
      case 'remote':
        finalData = conflict.remoteData;
        break;
      case 'manual':
        if (!data) {
          throw new Error('Manual resolution requires data parameter');
        }
        finalData = data;
        break;
    }

    // TODO: Sync resolved data to Supabase
    console.log(`[SyncManager] Resolved conflict ${conflictId} with strategy: ${resolution}`);

    // Remove conflict from list
    conflicts.splice(conflictIndex, 1);
    await indexedDBAdapter.set(CONFLICTS_KEY, conflicts);
  }

  /**
   * Get last sync timestamp
   */
  async getLastSyncTime(): Promise<number | null> {
    return await indexedDBAdapter.get<number>(LAST_SYNC_KEY);
  }

  /**
   * Clear all sync data (for testing/debugging)
   */
  async clearSyncData(): Promise<void> {
    await indexedDBAdapter.remove(SYNC_QUEUE_KEY);
    await indexedDBAdapter.remove(CONFLICTS_KEY);
    await indexedDBAdapter.remove(LAST_SYNC_KEY);
    console.log('[SyncManager] Cleared all sync data');
  }
}

/**
 * Singleton instance
 */
export const syncManager = new SyncManager();

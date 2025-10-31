# Storage System

This directory contains the storage abstraction layer for HRIS, designed to support seamless migration from localStorage to Supabase while maintaining offline-first capabilities.

## Architecture

```
┌─────────────────┐
│  Application    │
│  (Components)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  storage.ts     │ ◄── Main API
│  (Abstraction)  │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌────────────┐
│Local   │ │ IndexedDB  │
│Storage │ │  Adapter   │
└────────┘ └─────┬──────┘
                 │
                 ▼
          ┌──────────────┐
          │ Sync Manager │
          │ (Offline     │
          │  Queue)      │
          └──────┬───────┘
                 │
                 ▼
          ┌──────────────┐
          │  Supabase    │ ◄── Future
          │  (Cloud)     │
          └──────────────┘
```

## Usage

### Basic Storage Operations

```typescript
import { storage } from '@/lib/storage';

// Get data
const technicians = await storage.get('technicians');

// Set data
await storage.set('technicians', techniciansList);

// Remove data
await storage.remove('old-key');

// Check if exists
const exists = await storage.has('my-key');

// Batch operations
const data = await storage.getMany(['key1', 'key2', 'key3']);
await storage.setMany({
  'key1': value1,
  'key2': value2,
});
```

### Offline Queue & Sync

```typescript
import { sync } from '@/lib/storage';

// Queue a mutation for later sync (when offline)
await sync.queueMutation(
  'completed_flowcharts',
  'flowchart-123',
  'UPDATE',
  { status: 'completed', completedAt: Date.now() }
);

// Manually trigger sync
const result = await sync.syncPending();
console.log(`Synced: ${result.synced}, Failed: ${result.failed}, Conflicts: ${result.conflicts}`);

// Get pending sync count
const pending = await sync.getPendingCount();

// Handle conflicts
const conflicts = await sync.getConflicts();
for (const conflict of conflicts) {
  // Resolve with local data
  await sync.resolveConflict(conflict.id, 'local');

  // Or resolve with remote data
  await sync.resolveConflict(conflict.id, 'remote');

  // Or manual resolution
  await sync.resolveConflict(conflict.id, 'manual', mergedData);
}

// Listen for online/offline status
sync.onOnlineStatusChange((online) => {
  if (online) {
    console.log('Back online! Auto-syncing...');
  } else {
    console.log('Offline mode activated');
  }
});
```

### Storage Statistics

```typescript
import { getStorageStats } from '@/lib/storage';

const stats = await getStorageStats();
console.log(stats);
// {
//   adapter: 'indexedDB',
//   keyCount: 47,
//   pendingSync: 3,
//   conflicts: 0,
//   lastSync: 1698765432000
// }
```

### Device Management

```typescript
import { getDeviceInfo, setDeviceName } from '@/lib/storage';

// Get device info
const device = getDeviceInfo();
console.log(device);
// {
//   deviceId: 'device-1698765432000-abc123',
//   deviceName: 'iPad Pro',
//   deviceType: 'tablet'
// }

// Set friendly device name
setDeviceName('John\'s iPad');
```

## Configuration

Edit [lib/storage/index.ts](./index.ts) to configure storage behavior:

```typescript
export const STORAGE_CONFIG = {
  // Which adapter to use
  preferredAdapter: 'indexedDB', // 'localStorage' | 'indexedDB' | 'supabase'

  // Enable offline queue
  enableOfflineQueue: true,

  // Auto-sync interval (ms) - 0 to disable
  autoSyncInterval: 60000, // 1 minute

  // Maximum sync attempts
  maxSyncAttempts: 3,
};
```

## Migration Guide

### Phase 1: Current State (localStorage)

All data is stored in browser localStorage. Works but limited by:
- 5-10MB size limit
- Synchronous API (blocks UI)
- No offline queue
- No multi-device sync

### Phase 2: IndexedDB Migration (Current Implementation)

**Benefits:**
- Much larger storage capacity (100MB+)
- Asynchronous API (better performance)
- Offline queue support
- Better for large datasets

**Migration:**
```typescript
import { migrateLocalStorageToIndexedDB } from '@/lib/storage';

// Migrate specific keys
await migrateLocalStorageToIndexedDB([
  'completed-flowcharts',
  'technicians',
  'bug-reports',
  // ... other keys
]);
```

### Phase 3: Supabase Integration (Future)

When Supabase is set up:

1. **No Code Changes Required!** - The abstraction layer handles everything
2. Update `STORAGE_CONFIG.preferredAdapter` to `'supabase'`
3. All reads/writes will automatically use Supabase
4. Offline queue will sync when back online
5. Multi-device sync will work automatically

## Adapter Implementations

### LocalStorageAdapter
- Simple wrapper around `localStorage`
- Synchronous operations (but exposed as async for consistency)
- Good for small amounts of data
- Fallback if IndexedDB unavailable

### IndexedDBAdapter
- Uses browser IndexedDB
- Asynchronous operations
- Much larger capacity
- Better performance for large datasets
- **Current default for HRIS**

### SupabaseAdapter (Future)
- Will use Supabase client
- Cloud storage with local cache
- Real-time sync across devices
- Conflict resolution
- **Coming soon**

## Sync Manager

The Sync Manager handles:

1. **Offline Queue**: Stores mutations when offline
2. **Auto-Sync**: Syncs when back online
3. **Conflict Resolution**: Detects and resolves conflicts
4. **Device Tracking**: Tracks which device made changes
5. **Retry Logic**: Retries failed syncs with exponential backoff

### Sync Queue Flow

```
User makes change → Queue mutation → Try sync immediately
                         │
                         ▼
                    Is online?
                    │         │
              Yes   │         │ No
                    ▼         ▼
               Sync now   Store in queue
                    │         │
                    ▼         ▼
            Success?    Wait for online
            │      │           │
      Yes   │      │ No        │
            ▼      ▼           │
        Done   Retry (3x)      │
                    │          │
                    ▼          │
              Still fails? ────┘
                    │
                    ▼
            Record conflict
```

## Files Using localStorage

30 files currently use localStorage directly. These should gradually migrate to using the storage abstraction:

**High Priority:**
- `lib/completed-flowcharts.ts` - Work history
- `lib/bug-reports.ts` - Bug tracking
- `lib/technicians-data.ts` - Technician profiles
- `lib/flowchart-data.ts` - Flowchart definitions

**Medium Priority:**
- `lib/technician-activity.ts` - Activity logs
- `lib/technician-vehicle.ts` - Vehicle assignments
- Training and work history modules

**Low Priority:**
- UI preferences
- Tutorial states
- Feature flags

## Testing

```typescript
// Test storage operations
await storage.set('test-key', { foo: 'bar' });
const data = await storage.get('test-key');
console.assert(data.foo === 'bar', 'Storage test failed');

// Test offline queue
await sync.queueMutation('test_table', '123', 'INSERT', { test: true });
const pending = await sync.getPendingCount();
console.assert(pending === 1, 'Queue test failed');

// Test sync
const result = await sync.syncPending();
console.log('Sync result:', result);
```

## Best Practices

1. **Always use the abstraction layer** - Don't access localStorage directly
2. **Queue mutations when offline** - Use `sync.queueMutation()` for data changes
3. **Handle conflicts gracefully** - Check for conflicts after sync
4. **Use batch operations** - `getMany()` and `setMany()` are more efficient
5. **Monitor sync status** - Show UI indicators for pending syncs

## Future Improvements

- [ ] Implement Supabase adapter
- [ ] Add real-time subscriptions
- [ ] Implement smart conflict resolution
- [ ] Add data compression for large objects
- [ ] Add storage quota monitoring
- [ ] Implement background sync API
- [ ] Add encryption for sensitive data
- [ ] Implement selective sync (only changed records)

## Related Files

- [SUPABASE_SETUP.md](../../SUPABASE_SETUP.md) - Supabase integration guide
- [supabase/migrations/003_pwa_sync.sql](../../supabase/migrations/003_pwa_sync.sql) - Sync table schema
- [lib/offline-pdf-storage.ts](../offline-pdf-storage.ts) - PDF storage (already uses IndexedDB)

## Support

For questions or issues with the storage system:
1. Check this README
2. Review the code comments in each adapter
3. See [SUPABASE_SETUP.md](../../SUPABASE_SETUP.md) for migration plan

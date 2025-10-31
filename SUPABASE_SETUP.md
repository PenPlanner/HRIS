# Supabase Setup Instructions

## 1. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project
3. Note down your:
   - Project URL
   - Anon/Public API key

## 2. Update Environment Variables

Edit `.env.local` and add:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url-here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## 3. Run Database Migrations

In Supabase Dashboard:
1. Go to SQL Editor
2. Copy contents from `supabase/migrations/001_initial_schema.sql`
3. Run the SQL
4. Copy contents from `supabase/migrations/002_seed_data.sql`
5. Run the SQL

## 4. Set up Storage Buckets

In Supabase Dashboard → Storage:
1. Create bucket: `profile-pictures` (Public)
2. Create bucket: `vehicle-photos` (Public)
3. Create bucket: `course-certificates` (Public)

## Current Status

✅ Schema created (organizations, teams, technicians, etc.)
✅ Seed data ready (regions and 20 teams with colors)
✅ PWA improvements completed (offline caching, parallel downloads, install prompt)
🔄 Waiting for Supabase project setup

## PWA & Offline Strategy

### Current Implementation (localStorage + IndexedDB)
- **localStorage**: Used for settings, auth tokens, feature flags (~30 files)
- **IndexedDB**: Used for offline PDF storage via `lib/offline-pdf-storage.ts`
- **Service Worker**: Cache v3 with static assets, dynamic caching, and PDF caching

### Migration Plan to Supabase

#### Phase 1: Data Abstraction Layer ✅ (In Progress)
Create abstraction layer that works with both localStorage and Supabase:
- `lib/storage/storage-adapter.ts` - Main storage interface
- `lib/storage/local-storage.ts` - Current localStorage implementation
- `lib/storage/supabase-storage.ts` - Future Supabase implementation
- `lib/storage/sync-manager.ts` - Handles offline/online sync

#### Phase 2: Gradual Migration
1. **Non-critical data first**: Settings, UI preferences
2. **User data**: Technicians, teams, vehicles
3. **Work data**: Completed flowcharts, work history, bug reports
4. **Critical data last**: Authentication, active sessions

#### Phase 3: Offline-First with Supabase
Strategy for working at wind turbines without connectivity:
1. **Local-first writes**: All changes go to IndexedDB first
2. **Background sync**: When online, sync to Supabase
3. **Conflict resolution**: Last-write-wins with timestamps
4. **Offline queue**: Queue mutations while offline

#### Phase 4: Real-time Sync
Once Supabase is integrated:
- Real-time subscriptions for team updates
- Optimistic UI updates
- Automatic conflict resolution
- Multi-device sync

### Data Models Requiring Migration

#### High Priority (Active Development)
- ✅ `completed-flowcharts` - Work history tracking
- ✅ `bug-reports` - Bug tracking system
- ✅ `technicians-data` - Technician profiles
- ✅ `technician-activity` - Activity tracking
- ✅ `technician-vehicle` - Vehicle assignments
- ✅ `flowchart-data` - Flowchart definitions

#### Medium Priority (Feature Complete)
- 🔄 `training-needs` - Training management
- 🔄 `work-history` - Historical work records
- 🔄 `teams` - Team management
- 🔄 `vehicles` - Vehicle tracking
- 🔄 `loto` - Lock-out/tag-out procedures

#### Low Priority (Settings & UI)
- 📝 Auth tokens & sessions
- 📝 UI preferences & feature flags
- 📝 Tutorial completion states
- 📝 Install prompt dismissals

### Supabase Schema Extensions Needed

```sql
-- PWA offline sync metadata
CREATE TABLE IF NOT EXISTS sync_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ,
  user_id UUID REFERENCES auth.users(id)
);

-- Conflict resolution log
CREATE TABLE IF NOT EXISTS sync_conflicts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  local_data JSONB,
  remote_data JSONB,
  resolved_data JSONB,
  resolution_strategy TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Offline session tracking
CREATE TABLE IF NOT EXISTS offline_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  synced_records_count INTEGER DEFAULT 0
);
```

### Files Using localStorage (30 files)

Critical files that need data abstraction layer:
1. `lib/completed-flowcharts.ts` - Completed work tracking
2. `lib/bug-reports.ts` - Bug report management
3. `lib/technicians-data.ts` - Technician profiles
4. `lib/flowchart-data.ts` - Flowchart definitions
5. `lib/technician-activity.ts` - Activity logs
6. `lib/technician-vehicle.ts` - Vehicle assignments
7. `lib/auth/auth-context.tsx` - Authentication state

See full list in migration tracking spreadsheet.

## Next Steps

### Before Supabase Setup
1. ✅ Complete PWA improvements (offline, caching, install prompt)
2. 🔄 Create storage abstraction layer
3. 📝 Implement sync queue for offline mutations
4. 📝 Add conflict resolution logic
5. 📝 Test offline-first workflow

### After Supabase Setup
1. Run migrations (001_initial_schema.sql, 002_seed_data.sql)
2. Add PWA sync tables (003_pwa_sync.sql)
3. Set up storage buckets
4. Configure Row Level Security (RLS)
5. Test with staging data
6. Gradual production migration

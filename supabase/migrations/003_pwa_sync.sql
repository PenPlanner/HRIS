-- PWA Offline Sync Infrastructure
-- This migration adds tables to support offline-first functionality
-- for technicians working at remote wind turbine locations

-- ============================================
-- Sync Queue Table
-- ============================================
-- Tracks all mutations made while offline for later sync to Supabase

CREATE TABLE IF NOT EXISTS sync_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  data JSONB,
  device_id TEXT, -- Identify which device made the change
  created_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ,
  sync_attempts INTEGER DEFAULT 0,
  last_sync_error TEXT,
  user_id UUID REFERENCES auth.users(id),

  -- Index for faster lookups
  INDEX idx_sync_queue_user_id (user_id),
  INDEX idx_sync_queue_synced (synced_at),
  INDEX idx_sync_queue_table (table_name, record_id)
);

-- Enable RLS
ALTER TABLE sync_queue ENABLE ROW LEVEL SECURITY;

-- Users can only see their own sync queue
CREATE POLICY "Users can view own sync queue"
  ON sync_queue FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own sync items
CREATE POLICY "Users can insert own sync queue"
  ON sync_queue FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own sync items
CREATE POLICY "Users can update own sync queue"
  ON sync_queue FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- Conflict Resolution Log
-- ============================================
-- Tracks conflicts when offline changes collide with server changes

CREATE TABLE IF NOT EXISTS sync_conflicts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  local_data JSONB NOT NULL,
  remote_data JSONB NOT NULL,
  resolved_data JSONB,
  resolution_strategy TEXT CHECK (resolution_strategy IN ('local_wins', 'remote_wins', 'manual', 'merged')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  user_id UUID REFERENCES auth.users(id),

  INDEX idx_sync_conflicts_user_id (user_id),
  INDEX idx_sync_conflicts_resolved (resolved_at),
  INDEX idx_sync_conflicts_table (table_name, record_id)
);

-- Enable RLS
ALTER TABLE sync_conflicts ENABLE ROW LEVEL SECURITY;

-- Users can view their own conflicts
CREATE POLICY "Users can view own conflicts"
  ON sync_conflicts FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own conflicts
CREATE POLICY "Users can insert own conflicts"
  ON sync_conflicts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own conflicts (for resolution)
CREATE POLICY "Users can update own conflicts"
  ON sync_conflicts FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- Offline Sessions Table
-- ============================================
-- Tracks when users work offline and sync statistics

CREATE TABLE IF NOT EXISTS offline_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  device_id TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  synced_records_count INTEGER DEFAULT 0,
  conflicts_count INTEGER DEFAULT 0,
  location JSONB, -- Store location data if available

  INDEX idx_offline_sessions_user_id (user_id),
  INDEX idx_offline_sessions_started (started_at DESC)
);

-- Enable RLS
ALTER TABLE offline_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view their own sessions
CREATE POLICY "Users can view own sessions"
  ON offline_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own sessions
CREATE POLICY "Users can insert own sessions"
  ON offline_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "Users can update own sessions"
  ON offline_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- Device Registration Table
-- ============================================
-- Track devices for each user (iPad, phone, etc.)

CREATE TABLE IF NOT EXISTS user_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  device_id TEXT NOT NULL UNIQUE,
  device_name TEXT, -- e.g., "John's iPad"
  device_type TEXT, -- 'mobile', 'tablet', 'desktop'
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_user_devices_user_id (user_id),
  INDEX idx_user_devices_last_seen (last_seen_at DESC)
);

-- Enable RLS
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;

-- Users can view their own devices
CREATE POLICY "Users can view own devices"
  ON user_devices FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own devices
CREATE POLICY "Users can insert own devices"
  ON user_devices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own devices
CREATE POLICY "Users can update own devices"
  ON user_devices FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- Functions for Sync Management
-- ============================================

-- Function to mark sync queue item as synced
CREATE OR REPLACE FUNCTION mark_synced(queue_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE sync_queue
  SET synced_at = NOW()
  WHERE id = queue_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record sync attempt
CREATE OR REPLACE FUNCTION record_sync_attempt(queue_id UUID, error_msg TEXT DEFAULT NULL)
RETURNS void AS $$
BEGIN
  UPDATE sync_queue
  SET
    sync_attempts = sync_attempts + 1,
    last_sync_error = error_msg
  WHERE id = queue_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get pending sync items for a user
CREATE OR REPLACE FUNCTION get_pending_syncs(uid UUID)
RETURNS TABLE (
  id UUID,
  table_name TEXT,
  record_id UUID,
  operation TEXT,
  data JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sq.id,
    sq.table_name,
    sq.record_id,
    sq.operation,
    sq.data,
    sq.created_at
  FROM sync_queue sq
  WHERE sq.user_id = uid
    AND sq.synced_at IS NULL
  ORDER BY sq.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Triggers for automatic cleanup
-- ============================================

-- Clean up old synced items after 30 days
CREATE OR REPLACE FUNCTION cleanup_old_sync_queue()
RETURNS void AS $$
BEGIN
  DELETE FROM sync_queue
  WHERE synced_at IS NOT NULL
    AND synced_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Clean up old resolved conflicts after 90 days
CREATE OR REPLACE FUNCTION cleanup_old_conflicts()
RETURNS void AS $$
BEGIN
  DELETE FROM sync_conflicts
  WHERE resolved_at IS NOT NULL
    AND resolved_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Comments for documentation
-- ============================================

COMMENT ON TABLE sync_queue IS 'Queue of offline mutations waiting to be synced to Supabase';
COMMENT ON TABLE sync_conflicts IS 'Log of sync conflicts requiring resolution';
COMMENT ON TABLE offline_sessions IS 'Tracking of offline work sessions for analytics';
COMMENT ON TABLE user_devices IS 'Registered devices for each user';

COMMENT ON COLUMN sync_queue.device_id IS 'Unique identifier for the device that made the change';
COMMENT ON COLUMN sync_queue.sync_attempts IS 'Number of times we tried to sync this item';
COMMENT ON COLUMN sync_conflicts.resolution_strategy IS 'How the conflict was resolved: local_wins, remote_wins, manual, or merged';

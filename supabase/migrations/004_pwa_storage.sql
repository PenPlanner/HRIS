-- PWA Key-Value Storage Table
-- Generic storage for PWA data (bug reports, completed flowcharts, settings, etc.)
-- This allows the Supabase adapter to sync local IndexedDB data to cloud

-- ============================================
-- PWA Storage Table
-- ============================================

CREATE TABLE IF NOT EXISTS pwa_storage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Storage key (e.g., 'bug_reports', 'completed-flowcharts')
  key TEXT NOT NULL,

  -- Storage value (stored as JSONB for flexibility)
  value JSONB NOT NULL,

  -- Metadata
  device_id TEXT, -- Which device last modified this
  user_id UUID REFERENCES auth.users(id),

  -- Timestamps for sync logic
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Version tracking for conflict resolution
  version INTEGER DEFAULT 1,

  -- Ensure one key per user
  UNIQUE(key, user_id)
);

-- Indexes for faster lookups
CREATE INDEX idx_pwa_storage_key ON pwa_storage(key);
CREATE INDEX idx_pwa_storage_user_id ON pwa_storage(user_id);
CREATE INDEX idx_pwa_storage_updated_at ON pwa_storage(updated_at DESC);
CREATE INDEX idx_pwa_storage_key_user ON pwa_storage(key, user_id);

-- Enable RLS
ALTER TABLE pwa_storage ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies
-- ============================================

-- Users can view their own storage
CREATE POLICY "Users can view own storage"
  ON pwa_storage FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Users can insert their own storage
CREATE POLICY "Users can insert own storage"
  ON pwa_storage FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Users can update their own storage
CREATE POLICY "Users can update own storage"
  ON pwa_storage FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Users can delete their own storage
CREATE POLICY "Users can delete own storage"
  ON pwa_storage FOR DELETE
  USING (auth.uid() = user_id OR user_id IS NULL);

-- ============================================
-- Triggers
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pwa_storage_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pwa_storage_timestamp
  BEFORE UPDATE ON pwa_storage
  FOR EACH ROW
  EXECUTE FUNCTION update_pwa_storage_updated_at();

-- ============================================
-- Helper Functions
-- ============================================

-- Upsert storage value (insert or update)
CREATE OR REPLACE FUNCTION upsert_pwa_storage(
  storage_key TEXT,
  storage_value JSONB,
  storage_device_id TEXT DEFAULT NULL,
  storage_user_id UUID DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO pwa_storage (key, value, device_id, user_id)
  VALUES (storage_key, storage_value, storage_device_id, storage_user_id)
  ON CONFLICT (key, user_id)
  DO UPDATE SET
    value = EXCLUDED.value,
    device_id = EXCLUDED.device_id,
    updated_at = NOW(),
    version = pwa_storage.version + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get storage value by key
CREATE OR REPLACE FUNCTION get_pwa_storage(
  storage_key TEXT,
  storage_user_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT value INTO result
  FROM pwa_storage
  WHERE key = storage_key
    AND (user_id = storage_user_id OR (user_id IS NULL AND storage_user_id IS NULL));

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get all storage for a user
CREATE OR REPLACE FUNCTION get_all_pwa_storage(storage_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  key TEXT,
  value JSONB,
  updated_at TIMESTAMPTZ,
  version INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pwa_storage.key,
    pwa_storage.value,
    pwa_storage.updated_at,
    pwa_storage.version
  FROM pwa_storage
  WHERE user_id = storage_user_id OR (user_id IS NULL AND storage_user_id IS NULL)
  ORDER BY updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Delete storage by key
CREATE OR REPLACE FUNCTION delete_pwa_storage(
  storage_key TEXT,
  storage_user_id UUID DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  DELETE FROM pwa_storage
  WHERE key = storage_key
    AND (user_id = storage_user_id OR (user_id IS NULL AND storage_user_id IS NULL));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if storage key has been updated since timestamp (for sync)
CREATE OR REPLACE FUNCTION check_pwa_storage_changes(
  since_timestamp TIMESTAMPTZ,
  storage_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  key TEXT,
  value JSONB,
  updated_at TIMESTAMPTZ,
  version INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pwa_storage.key,
    pwa_storage.value,
    pwa_storage.updated_at,
    pwa_storage.version
  FROM pwa_storage
  WHERE (user_id = storage_user_id OR (user_id IS NULL AND storage_user_id IS NULL))
    AND updated_at > since_timestamp
  ORDER BY updated_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Comments
-- ============================================

COMMENT ON TABLE pwa_storage IS 'Generic key-value storage for PWA data with cloud sync support';
COMMENT ON COLUMN pwa_storage.key IS 'Storage key (e.g., bug_reports, completed-flowcharts)';
COMMENT ON COLUMN pwa_storage.value IS 'JSONB value, can store any data structure';
COMMENT ON COLUMN pwa_storage.version IS 'Incremented on each update for conflict detection';
COMMENT ON COLUMN pwa_storage.device_id IS 'Device that last modified this record';

-- ============================================
-- Sample Usage Examples (commented out)
-- ============================================

/*
-- Upsert bug reports
SELECT upsert_pwa_storage(
  'bug_reports',
  '{"report-1": {"id": "report-1", "title": "Test bug"}}'::jsonb,
  'device-123',
  auth.uid()
);

-- Get bug reports
SELECT get_pwa_storage('bug_reports', auth.uid());

-- Get all storage for current user
SELECT * FROM get_all_pwa_storage(auth.uid());

-- Check for changes since last sync
SELECT * FROM check_pwa_storage_changes('2025-01-01 00:00:00'::timestamptz, auth.uid());

-- Delete storage
SELECT delete_pwa_storage('old_key', auth.uid());
*/

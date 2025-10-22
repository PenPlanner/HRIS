-- Seed organizations/regions
INSERT INTO organizations (name) VALUES
  ('South'),
  ('North'),
  ('Travel'),
  ('Special');

-- Seed teams
INSERT INTO teams (name, organization_id, color, supervisor_initials, dispatcher_initials)
SELECT 'South 1', id, '#ef4444', 'RIHEI', 'PENAF' FROM organizations WHERE name = 'South'
UNION ALL
SELECT 'South 2', id, '#f97316', 'MASBR', 'PNPEO' FROM organizations WHERE name = 'South'
UNION ALL
SELECT 'South 3', id, '#f59e0b', 'SPESG', 'AJANO' FROM organizations WHERE name = 'South'
UNION ALL
SELECT 'South 4', id, '#eab308', 'FESAS', 'NIROD' FROM organizations WHERE name = 'South'
UNION ALL
SELECT 'South 5', id, '#84cc16', 'ANNBG', 'LINSC' FROM organizations WHERE name = 'South'
UNION ALL
SELECT 'South 6', id, '#22c55e', 'JOEVL', 'ANSZI' FROM organizations WHERE name = 'South'
UNION ALL
SELECT 'South 7', id, '#10b981', 'FRERI', 'TOBAZ' FROM organizations WHERE name = 'South'
UNION ALL
SELECT 'South 8', id, '#14b8a6', 'FRERI', 'RERIC' FROM organizations WHERE name = 'South'
UNION ALL
SELECT 'Travel S', id, '#06b6d4', 'MRADR', 'TEORY' FROM organizations WHERE name = 'Travel'
UNION ALL
SELECT 'Travel U', id, '#0ea5e9', 'ALMER', 'CLHAL' FROM organizations WHERE name = 'Travel'
UNION ALL
SELECT 'Fiber', id, '#6366f1', 'JOBOW', 'ANNAE' FROM organizations WHERE name = 'Special'
UNION ALL
SELECT 'Special T', id, '#8b5cf6', 'ANMLM', 'ELJPR' FROM organizations WHERE name = 'Special'
UNION ALL
SELECT 'North 1', id, '#a855f7', 'MAFAH', 'CAMTE' FROM organizations WHERE name = 'North'
UNION ALL
SELECT 'North 2', id, '#d946ef', 'DAEJE', 'JESST' FROM organizations WHERE name = 'North'
UNION ALL
SELECT 'North 3', id, '#ec4899', 'TERAI', 'BIYUF' FROM organizations WHERE name = 'North'
UNION ALL
SELECT 'North 4', id, '#f43f5e', 'JONLG', 'JOEGM' FROM organizations WHERE name = 'North'
UNION ALL
SELECT 'North 5', id, '#64748b', 'FDADR', 'EMMDN' FROM organizations WHERE name = 'North'
UNION ALL
SELECT 'North 6', id, '#475569', 'MAEIA', 'SNWIK' FROM organizations WHERE name = 'North'
UNION ALL
SELECT 'North 7', id, '#334155', 'MAGLD', 'THELA' FROM organizations WHERE name = 'North'
UNION ALL
SELECT 'North 8', id, '#1e293b', 'ORMAT', 'EMGTO' FROM organizations WHERE name = 'North';

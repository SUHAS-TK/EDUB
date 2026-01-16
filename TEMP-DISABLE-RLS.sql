-- ==========================================
-- TEMPORARY FIX: Disable ALL RLS for Testing
-- This will help us identify if RLS is the problem
-- ==========================================

-- Disable RLS temporarily
ALTER TABLE notes DISABLE ROW LEVEL SECURITY;

-- Test message
SELECT '⚠️ RLS DISABLED FOR TESTING' as status;
SELECT 'If upload works now, the problem is RLS policies' as info;
SELECT 'Upload a note and let me know if it works!' as next_step;

-- TO RE-ENABLE LATER (after we confirm upload works):
-- ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- RE-ENABLE Row Level Security (RLS)
-- Run this AFTER you've tested everything works
-- ==========================================

-- Re-enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'notes', 'attendance', 'messages');

-- Expected result: All should show rowsecurity = true

-- If you get permission errors after re-enabling, 
-- run the full schema again: supabase-section-subject-schema.sql

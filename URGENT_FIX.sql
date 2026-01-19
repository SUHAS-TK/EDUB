-- ==========================================
-- URGENT FIX - DISABLE RLS COMPLETELY
-- Run this IMMEDIATELY in Supabase SQL Editor
-- ==========================================

-- STEP 1: DISABLE RLS ON ALL TABLES
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS attendance DISABLE ROW LEVEL SECURITY;

-- STEP 2: DROP ALL EXISTING POLICIES (they might be blocking)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.tablename;
    END LOOP;
END $$;

-- STEP 3: Grant full access to authenticated users
GRANT ALL ON users TO authenticated;
GRANT ALL ON notes TO authenticated;
GRANT ALL ON messages TO authenticated;
GRANT ALL ON attendance TO authenticated;

-- STEP 4: Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- STEP 5: Verify tables exist
SELECT 'Tables in database:' as info;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

SELECT '✅ RLS DISABLED - Your app should work now!' as status;
SELECT '⚠️ Remember to re-enable RLS with proper policies for production!' as warning;

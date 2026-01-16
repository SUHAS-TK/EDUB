-- ==========================================
-- QUICK FIX: Disable RLS Temporarily for Testing
-- Run this in Supabase SQL Editor if you get connection errors
-- ==========================================

-- This will allow you to test if the tables exist
-- Later you can re-enable RLS once basic connection works

-- Disable RLS on all tables temporarily
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS messages DISABLE ROW LEVEL SECURITY;

-- Verify tables exist
SELECT 'users table exists' as status FROM users LIMIT 1;
SELECT 'notes table exists' as status FROM notes LIMIT 1;
SELECT 'attendance table exists' as status FROM attendance LIMIT 1;
SELECT 'messages table exists' as status FROM messages LIMIT 1;

-- IMPORTANT: After testing, re-enable RLS by running:
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

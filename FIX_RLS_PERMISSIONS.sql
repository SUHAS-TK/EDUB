-- ==========================================
-- FIX ALL DATABASE PERMISSION ERRORS
-- Run this in Supabase SQL Editor
-- ==========================================

-- ==========================================
-- 1. FIX USERS TABLE
-- ==========================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow inserting own profile
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile" ON users 
FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow reading all users (needed for messaging)
DROP POLICY IF EXISTS "Users can view all profiles" ON users;
CREATE POLICY "Users can view all profiles" ON users 
FOR SELECT USING (true);

-- Allow updating own profile
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users 
FOR UPDATE USING (auth.uid() = id);

-- Allow deleting own profile
DROP POLICY IF EXISTS "Users can delete own profile" ON users;
CREATE POLICY "Users can delete own profile" ON users 
FOR DELETE USING (auth.uid() = id);


-- ==========================================
-- 2. FIX NOTES TABLE
-- ==========================================
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Teachers can insert notes
DROP POLICY IF EXISTS "Teachers can insert notes" ON notes;
CREATE POLICY "Teachers can insert notes" ON notes 
FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

-- Everyone can view notes (filtered by section in app)
DROP POLICY IF EXISTS "Anyone can view notes" ON notes;
CREATE POLICY "Anyone can view notes" ON notes 
FOR SELECT USING (true);

-- Teachers can delete their own notes
DROP POLICY IF EXISTS "Teachers can delete own notes" ON notes;
CREATE POLICY "Teachers can delete own notes" ON notes 
FOR DELETE USING (auth.uid() = uploaded_by);


-- ==========================================
-- 3. FIX MESSAGES TABLE
-- ==========================================
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Anyone can insert messages as themselves
DROP POLICY IF EXISTS "Users can insert messages" ON messages;
CREATE POLICY "Users can insert messages" ON messages 
FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- View messages (public or private to me)
DROP POLICY IF EXISTS "Users can view messages" ON messages;
CREATE POLICY "Users can view messages" ON messages 
FOR SELECT USING (
    sender_id = auth.uid() 
    OR recipient_id = auth.uid() 
    OR is_private = false
);

-- Delete own messages
DROP POLICY IF EXISTS "Users can delete own messages" ON messages;
CREATE POLICY "Users can delete own messages" ON messages 
FOR DELETE USING (auth.uid() = sender_id);


-- ==========================================
-- 4. FIX FOREIGN KEY CONSTRAINTS (Allow Cascade Delete)
-- ==========================================

-- Drop existing foreign keys and recreate with CASCADE
-- Notes table
ALTER TABLE notes DROP CONSTRAINT IF EXISTS notes_uploaded_by_fkey;
ALTER TABLE notes ADD CONSTRAINT notes_uploaded_by_fkey 
    FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Messages table - sender
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
ALTER TABLE messages ADD CONSTRAINT messages_sender_id_fkey 
    FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Messages table - recipient (if exists)
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_recipient_id_fkey;
-- Only add if recipient_id column exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'messages' AND column_name = 'recipient_id') THEN
        ALTER TABLE messages ADD CONSTRAINT messages_recipient_id_fkey 
            FOREIGN KEY (recipient_id) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END $$;


-- ==========================================
-- 5. CREATE ATTENDANCE TABLE (if not exists)
-- ==========================================
CREATE TABLE IF NOT EXISTS attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    student_name TEXT,
    roll_number TEXT,
    section TEXT,
    code TEXT,
    timestamp BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can submit attendance" ON attendance;
CREATE POLICY "Students can submit attendance" ON attendance 
FOR INSERT WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "View attendance" ON attendance;
CREATE POLICY "View attendance" ON attendance 
FOR SELECT USING (
    student_id = auth.uid() 
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'teacher')
);


-- ==========================================
-- VERIFICATION
-- ==========================================
SELECT 'RLS Policies Fixed Successfully!' as status;
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';

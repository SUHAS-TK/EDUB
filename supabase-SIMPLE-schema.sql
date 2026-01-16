-- ==========================================
-- EDUBRIDGE - SIMPLE SCHEMA (Permission-Friendly)
-- This version is designed to work with standard Supabase permissions
-- ==========================================

-- ============ STEP 1: DROP EXISTING (if any) ============
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS notes CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============ STEP 2: CREATE TABLES ============

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'teacher')),
    section TEXT CHECK (section IN ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N')),
    subject TEXT CHECK (subject IN ('Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'English', 'History', 'Geography', 'Economics', 'Other')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notes table
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT,
    file_name TEXT,
    uploaded_by UUID REFERENCES users(id) ON DELETE CASCADE,
    section TEXT CHECK (section IN ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N')),
    subject TEXT CHECK (subject IN ('Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'English', 'History', 'Geography', 'Economics', 'Other')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attendance table
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    section TEXT CHECK (section IN ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    section TEXT CHECK (section IN ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N')),
    subject TEXT CHECK (subject IN ('Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'English', 'History', 'Geography', 'Economics', 'Other')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============ STEP 3: ENABLE RLS ============
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ============ STEP 4: SIMPLE RLS POLICIES ============
-- These are VERY permissive to avoid permission issues
-- We'll filter data in the application code

-- Users policies
CREATE POLICY "Allow user signup"
    ON users FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow user read"
    ON users FOR SELECT
    USING (true);

CREATE POLICY "Allow user update"
    ON users FOR UPDATE
    USING (auth.uid() = id);

-- Notes policies
CREATE POLICY "Anyone can read notes"
    ON notes FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create notes"
    ON notes FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete own notes"
    ON notes FOR DELETE
    USING (uploaded_by = auth.uid());

-- Attendance policies
CREATE POLICY "Anyone can read attendance"
    ON attendance FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create attendance"
    ON attendance FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Messages policies
CREATE POLICY "Anyone can read messages"
    ON messages FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create messages"
    ON messages FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- ============ SUCCESS! ============
-- If you see this without errors, tables are created!

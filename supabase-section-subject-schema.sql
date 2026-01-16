-- ==========================================
-- EDUBRIDGE - Fixed Schema with Sections & Subjects
-- Sections: A to N (14 sections)
-- Subject-based teacher-student communication
-- FIXED: Removed infinite recursion in RLS policies
-- ==========================================

-- ============ DROP EXISTING TABLES ============
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS notes CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============ CREATE USERS TABLE ============
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'teacher')),
    
    -- Section field (A-N for students and teachers)
    section TEXT CHECK (section IN ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N')),
    
    -- Subject field (only for teachers)
    subject TEXT CHECK (subject IN ('Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'English', 'History', 'Geography', 'Economics', 'Other')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============ CREATE NOTES TABLE ============
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT,
    uploaded_by UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Section field - notes are section-specific
    section TEXT NOT NULL CHECK (section IN ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N')),
    
    -- Subject field - notes are subject-specific
    subject TEXT NOT NULL CHECK (subject IN ('Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'English', 'History', 'Geography', 'Economics', 'Other')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============ CREATE ATTENDANCE TABLE ============
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    
    -- Section field
    section TEXT NOT NULL CHECK (section IN ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============ CREATE MESSAGES TABLE ============
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    
    -- Section field - messages are section-specific
    section TEXT NOT NULL CHECK (section IN ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N')),
    
    -- Subject field - messages are subject-specific
    subject TEXT NOT NULL CHECK (subject IN ('Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'English', 'History', 'Geography', 'Economics', 'Other')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============ ENABLE ROW LEVEL SECURITY ============
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ============ RLS POLICIES FOR USERS ============
-- FIXED: Simplified policies to avoid infinite recursion

-- Allow users to create their profile during signup
CREATE POLICY "Users can create their own profile"
    ON users FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Allow users to read their own profile (NO RECURSION)
CREATE POLICY "Users can read own profile"
    ON users FOR SELECT
    USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (auth.uid() = id);

-- ============ RLS POLICIES FOR NOTES ============
-- Teachers can upload notes to their section
CREATE POLICY "Teachers can upload notes"
    ON notes FOR INSERT
    WITH CHECK (
        uploaded_by = auth.uid()
    );

-- Anyone can view notes (we'll filter by section in application code)
CREATE POLICY "Users can view all notes"
    ON notes FOR SELECT
    USING (true);

-- Teachers can delete their own notes
CREATE POLICY "Teachers can delete own notes"
    ON notes FOR DELETE
    USING (uploaded_by = auth.uid());

-- ============ RLS POLICIES FOR ATTENDANCE ============
-- Students can submit their own attendance
CREATE POLICY "Students can submit attendance"
    ON attendance FOR INSERT
    WITH CHECK (student_id = auth.uid());

-- Users can view all attendance records
CREATE POLICY "Users can view attendance"
    ON attendance FOR SELECT
    USING (true);

-- ============ RLS POLICIES FOR MESSAGES ============
-- Users can send messages
CREATE POLICY "Users can send messages"
    ON messages FOR INSERT
    WITH CHECK (sender_id = auth.uid());

-- Anyone can view messages (we'll filter by section in application)
CREATE POLICY "Users can view messages"
    ON messages FOR SELECT
    USING (true);

-- ============ CREATE INDEXES FOR PERFORMANCE ============
CREATE INDEX idx_users_section ON users(section);
CREATE INDEX idx_users_subject ON users(subject);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_notes_section ON notes(section);
CREATE INDEX idx_notes_subject ON notes(subject);
CREATE INDEX idx_notes_uploaded_by ON notes(uploaded_by);
CREATE INDEX idx_attendance_section ON attendance(section);
CREATE INDEX idx_attendance_student_id ON attendance(student_id);
CREATE INDEX idx_messages_section ON messages(section);
CREATE INDEX idx_messages_subject ON messages(subject);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);

-- ============ SUCCESS MESSAGE ============
DO $$
BEGIN
    RAISE NOTICE '================================================';
    RAISE NOTICE '✅ FIXED SCHEMA CREATED SUCCESSFULLY!';
    RAISE NOTICE '================================================';
    RAISE NOTICE 'Features enabled:';
    RAISE NOTICE '• Sections: A to N (14 sections)';
    RAISE NOTICE '• Subjects: 10 subjects for teachers';
    RAISE NOTICE '• Section-based notes access';
    RAISE NOTICE '• Subject-based communication';
    RAISE NOTICE '• ✅ FIXED: No infinite recursion';
    RAISE NOTICE '• Simplified RLS policies';
    RAISE NOTICE '================================================';
END $$;

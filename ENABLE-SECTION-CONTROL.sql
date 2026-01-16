-- ==========================================
-- ENABLE SECTION-BASED ACCESS CONTROL (FIXED)
-- This ensures students only see notes from their section
-- ==========================================

-- Step 1: Re-enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop any existing policies (clean slate)
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Enable insert for registration" ON users;

DROP POLICY IF EXISTS "Teachers can insert notes" ON notes;
DROP POLICY IF EXISTS "Students can view notes from their section" ON notes;
DROP POLICY IF EXISTS "Teachers can view their own notes" ON notes;
DROP POLICY IF EXISTS "Teachers can update their own notes" ON notes;
DROP POLICY IF EXISTS "Teachers can delete their own notes" ON notes;

DROP POLICY IF EXISTS "Teachers can insert attendance" ON attendance;
DROP POLICY IF EXISTS "Students can insert attendance" ON attendance;
DROP POLICY IF EXISTS "Users can view attendance from their section" ON attendance;

DROP POLICY IF EXISTS "Users can insert messages" ON messages;
DROP POLICY IF EXISTS "Users can view messages in their section" ON messages;

-- Step 3: Create SECTION-BASED policies

-- ============ USERS TABLE ============
CREATE POLICY "Users can view their own profile"
    ON users FOR SELECT
    USING (id = (SELECT id FROM users WHERE auth_id = auth.uid()::text LIMIT 1));

CREATE POLICY "Users can update their own profile"
    ON users FOR UPDATE
    USING (id = (SELECT id FROM users WHERE auth_id = auth.uid()::text LIMIT 1));

CREATE POLICY "Enable insert for registration"
    ON users FOR INSERT
    WITH CHECK (true);

-- ============ NOTES TABLE ============
-- Teachers can upload notes for their section
CREATE POLICY "Teachers can insert notes"
    ON notes FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_id = auth.uid()::text
            AND users.role = 'teacher'
        )
    );

-- 🔥 KEY POLICY: Students ONLY see notes from THEIR SECTION
CREATE POLICY "Students can view notes from their section"
    ON notes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_id = auth.uid()::text
            AND users.role = 'student'
            AND users.section = notes.section  -- 👈 SECTION MATCH!
        )
    );

-- Teachers can view their own uploaded notes
CREATE POLICY "Teachers can view their own notes"
    ON notes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_id = auth.uid()::text
            AND users.role = 'teacher'
            AND users.id = notes.teacher_id
        )
    );

-- Teachers can update their own notes
CREATE POLICY "Teachers can update their own notes"
    ON notes FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_id = auth.uid()::text
            AND users.role = 'teacher'
            AND users.id = notes.teacher_id
        )
    );

-- Teachers can delete their own notes
CREATE POLICY "Teachers can delete their own notes"
    ON notes FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_id = auth.uid()::text
            AND users.role = 'teacher'
            AND users.id = notes.teacher_id
        )
    );

-- ============ ATTENDANCE TABLE ============
CREATE POLICY "Teachers can insert attendance"
    ON attendance FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_id = auth.uid()::text
            AND users.role = 'teacher'
        )
    );

CREATE POLICY "Students can insert attendance"
    ON attendance FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_id = auth.uid()::text
            AND users.role = 'student'
        )
    );

-- Users can only view attendance from their section
CREATE POLICY "Users can view attendance from their section"
    ON attendance FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_id = auth.uid()::text
            AND users.section = attendance.section  -- 👈 SECTION MATCH!
        )
    );

-- ============ MESSAGES TABLE ============
CREATE POLICY "Users can insert messages"
    ON messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_id = auth.uid()::text
        )
    );

-- Users only see messages in their section
CREATE POLICY "Users can view messages in their section"
    ON messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_id = auth.uid()::text
            AND users.section = messages.section  -- 👈 SECTION MATCH!
        )
    );

-- ============ VERIFICATION ============
-- Check that policies are created
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Success message
SELECT '✅ Section-based access control ENABLED!' as status,
       'Students will ONLY see notes from their section' as note;

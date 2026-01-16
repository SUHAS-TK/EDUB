-- ==========================================
-- CLEAN UP AND RE-CREATE SECTION POLICIES
-- Run this to fix "policy already exists" error
-- ==========================================

-- Step 1: DROP ALL EXISTING POLICIES (clean slate)
DROP POLICY IF EXISTS "Users can view all notes" ON notes;
DROP POLICY IF EXISTS "Students view notes from their section" ON notes;
DROP POLICY IF EXISTS "Teachers view their own notes" ON notes;
DROP POLICY IF EXISTS "Teachers can upload notes" ON notes;
DROP POLICY IF EXISTS "Teachers can delete own notes" ON notes;

DROP POLICY IF EXISTS "Users can view attendance" ON attendance;
DROP POLICY IF EXISTS "Users view attendance from their section" ON attendance;
DROP POLICY IF EXISTS "Students can submit attendance" ON attendance;
DROP POLICY IF EXISTS "Teachers can insert attendance" ON attendance;

DROP POLICY IF EXISTS "Users can view messages" ON messages;
DROP POLICY IF EXISTS "Users view messages from their section" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;

-- Step 2: VERIFY RLS is enabled
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Step 3: CREATE NEW SECTION-BASED POLICIES

-- ============ NOTES POLICIES ============

-- Teachers can upload notes (will be tagged with their section)
CREATE POLICY "Teachers can upload notes"
    ON notes FOR INSERT
    WITH CHECK (
        uploaded_by = auth.uid()
    );

-- 🔥 Students can ONLY view notes from THEIR SECTION
CREATE POLICY "Students view notes from their section"
    ON notes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'student'
            AND users.section = notes.section  -- 👈 SECTION FILTER!
        )
    );

-- Teachers can view notes they uploaded
CREATE POLICY "Teachers view their own notes"
    ON notes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'teacher'
            AND users.id = notes.uploaded_by
        )
    );

-- Teachers can delete their own notes
CREATE POLICY "Teachers can delete own notes"
    ON notes FOR DELETE
    USING (
        uploaded_by = auth.uid()
    );

-- ============ ATTENDANCE POLICIES ============

CREATE POLICY "Teachers can insert attendance"
    ON attendance FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'teacher'
        )
    );

CREATE POLICY "Students can submit attendance"
    ON attendance FOR INSERT
    WITH CHECK (
        student_id = auth.uid()
    );

-- Users only see attendance from their section
CREATE POLICY "Users view attendance from their section"
    ON attendance FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.section = attendance.section
        )
    );

-- ============ MESSAGES POLICIES ============

CREATE POLICY "Users can send messages"
    ON messages FOR INSERT
    WITH CHECK (
        sender_id = auth.uid()
    );

-- Users only see messages in their section
CREATE POLICY "Users view messages from their section"
    ON messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.section = messages.section
        )
    );

-- ============ VERIFICATION ============
-- Show all active policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('notes', 'attendance', 'messages')
ORDER BY tablename, policyname;

-- Success message
SELECT '✅ SECTION-BASED POLICIES ENABLED!' as status;
SELECT 'Students will ONLY see content from their section' as info;

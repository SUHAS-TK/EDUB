-- ==========================================
-- ADD SECTION-BASED FILTERING (WORKING VERSION)
-- Students only see notes from their section
-- ==========================================

-- Step 1: Drop the current "view all notes" policy
DROP POLICY IF EXISTS "Users can view all notes" ON notes;

-- Step 2: Create TWO separate policies for section filtering

-- Policy A: STUDENTS can only view notes from THEIR SECTION
CREATE POLICY "Students view notes from their section"
    ON notes FOR SELECT
    USING (
        -- Check if current user is a student
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'student'
            -- Student's section must match note's section
            AND users.section = notes.section
        )
    );

-- Policy B: TEACHERS can view notes they uploaded (any section)
CREATE POLICY "Teachers view their own notes"
    ON notes FOR SELECT
    USING (
        -- Check if current user is a teacher
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'teacher'
            -- Teacher uploaded this note
            AND users.id = notes.uploaded_by
        )
    );

-- Step 3: Update the attendance policy for section filtering
DROP POLICY IF EXISTS "Users can view attendance" ON attendance;

CREATE POLICY "Users view attendance from their section"
    ON attendance FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.section = attendance.section
        )
    );

-- Step 4: Update the messages policy for section filtering
DROP POLICY IF EXISTS "Users can view messages" ON messages;

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
SELECT '✅ SECTION FILTERING ENABLED!' as status;
SELECT 'Students will ONLY see notes from their section' as note_1;
SELECT 'Teachers will ONLY see notes they uploaded' as note_2;

-- Show all active policies
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ==========================================
-- FIX UPLOAD ERROR - Simplified Upload Policy
-- ==========================================

-- Drop the existing upload policy
DROP POLICY IF EXISTS "Teachers can upload notes" ON notes;

-- Create a SIMPLER upload policy that works
CREATE POLICY "Teachers can upload notes"
    ON notes FOR INSERT
    WITH CHECK (
        -- Just check if user is authenticated and is a teacher
        auth.uid() IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'teacher'
        )
    );

-- Verify
SELECT 'Upload policy updated!' as status;
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'notes' 
AND policyname = 'Teachers can upload notes';

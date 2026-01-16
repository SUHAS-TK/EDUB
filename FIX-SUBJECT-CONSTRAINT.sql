-- ==========================================
-- FIX: notes_subject_check CONSTRAINT VIOLATION
-- ==========================================
-- This error occurs when uploading notes without a subject
-- or with an invalid subject value

-- ============================================
-- OPTION 1: Make subject field OPTIONAL (Recommended for quick fix)
-- ============================================
-- This allows notes to be uploaded without requiring a subject

-- Drop the existing constraint
ALTER TABLE notes DROP CONSTRAINT IF EXISTS notes_subject_check;

-- Recreate the constraint to allow NULL values
ALTER TABLE notes 
ADD CONSTRAINT notes_subject_check 
CHECK (
    subject IS NULL 
    OR subject IN (
        'Mathematics', 
        'Physics', 
        'Chemistry', 
        'Biology', 
        'Computer Science', 
        'English', 
        'History', 
        'Geography', 
        'Economics', 
        'Other'
    )
);

-- Verify the constraint
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'notes'::regclass
AND conname = 'notes_subject_check';

-- Success message
SELECT '✅ Subject constraint fixed!' as status,
       'Notes can now be uploaded without a subject field' as note,
       'Subject field is now OPTIONAL' as change;

-- ============================================
-- ALTERNATIVE OPTION 2: Set a default value
-- ============================================
-- Uncomment the following lines if you want to set a default subject

-- ALTER TABLE notes ALTER COLUMN subject SET DEFAULT 'Other';
-- SELECT '✅ Default subject set to "Other"' as alternative_fix;

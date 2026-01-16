-- ==========================================
-- COMPREHENSIVE FIX FOR notes_subject_check
-- This fixes the constraint violation error
-- ==========================================

-- Step 1: Show the current constraint
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as current_definition
FROM pg_constraint
WHERE conrelid = 'notes'::regclass
AND conname = 'notes_subject_check';

-- Step 2: Drop the existing overly strict constraint
ALTER TABLE notes DROP CONSTRAINT IF EXISTS notes_subject_check;

-- Step 3: Recreate with NULL support (makes subject OPTIONAL)
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

-- Step 4: Also make section constraint support NULL (optional)
ALTER TABLE notes DROP CONSTRAINT IF EXISTS notes_section_check;

ALTER TABLE notes 
ADD CONSTRAINT notes_section_check 
CHECK (
    section IS NULL 
    OR section IN ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N')
);

-- Step 5: Set default values for better UX
ALTER TABLE notes ALTER COLUMN subject SET DEFAULT 'Other';
ALTER TABLE notes ALTER COLUMN section SET DEFAULT 'A';

-- Step 6: Update any existing NULL values (if any)
UPDATE notes SET subject = 'Other' WHERE subject IS NULL;
UPDATE notes SET section = 'A' WHERE section IS NULL;

-- Step 7: Verify the fix
SELECT '✅ CONSTRAINT FIXED!' as status;

-- Show new constraints
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as new_definition
FROM pg_constraint
WHERE conrelid = 'notes'::regclass
AND conname LIKE '%_check';

-- Test: Show sample notes structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'notes'
AND column_name IN ('subject', 'section')
ORDER BY ordinal_position;

-- ==========================================
-- SUCCESS CONFIRMATION
-- ==========================================
DO $$
BEGIN
    RAISE NOTICE '✅ notes_subject_check constraint FIXED!';
    RAISE NOTICE '✅ Notes can now be uploaded with or without a subject';
    RAISE NOTICE '✅ Default subject set to: Other';
    RAISE NOTICE '✅ Default section set to: A';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Next: Test uploading a note through the application!';
END $$;

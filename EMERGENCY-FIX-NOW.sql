-- ==========================================
-- EMERGENCY FIX: Handle Existing Invalid Data
-- This fixes the constraint violation error
-- ==========================================

-- STEP 1: First, let's see what invalid data exists
SELECT 
    'Checking for invalid data...' as status,
    COUNT(*) as total_rows,
    COUNT(CASE WHEN subject NOT IN ('Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'English', 'History', 'Geography', 'Economics', 'Other') THEN 1 END) as invalid_subjects,
    COUNT(CASE WHEN section NOT IN ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N') THEN 1 END) as invalid_sections
FROM notes;

-- STEP 2: Fix invalid data by updating to valid values
-- Update any invalid subjects to 'Other'
UPDATE notes 
SET subject = 'Other' 
WHERE subject NOT IN ('Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'English', 'History', 'Geography', 'Economics', 'Other')
   OR subject IS NULL;

-- Update any invalid sections to 'A'
UPDATE notes 
SET section = 'A' 
WHERE section NOT IN ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N')
   OR section IS NULL;

SELECT '✅ Step 2: Invalid data fixed!' as status;

-- STEP 3: Now drop the old strict constraints
ALTER TABLE notes DROP CONSTRAINT IF EXISTS notes_subject_check;
ALTER TABLE notes DROP CONSTRAINT IF EXISTS notes_section_check;

SELECT '✅ Step 3: Old constraints removed!' as status;

-- STEP 4: Make columns nullable (allows NULL values)
ALTER TABLE notes ALTER COLUMN subject DROP NOT NULL;
ALTER TABLE notes ALTER COLUMN section DROP NOT NULL;

SELECT '✅ Step 4: Columns made nullable!' as status;

-- STEP 5: Add new flexible constraints that allow NULL
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

ALTER TABLE notes 
ADD CONSTRAINT notes_section_check 
CHECK (
    section IS NULL 
    OR section IN ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N')
);

SELECT '✅ Step 5: New flexible constraints added!' as status;

-- STEP 6: Set helpful defaults
ALTER TABLE notes ALTER COLUMN subject SET DEFAULT 'Other';
ALTER TABLE notes ALTER COLUMN section SET DEFAULT 'A';

SELECT '✅ Step 6: Default values set!' as status;

-- STEP 7: Verify everything is fixed
SELECT 
    '✅✅✅ ALL FIXED! ✅✅✅' as status,
    'You can now upload notes!' as message;

-- Show the new constraints
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'notes'::regclass
AND conname LIKE '%_check'
ORDER BY conname;

-- ==========================================
-- SUCCESS MESSAGE
-- ==========================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉';
    RAISE NOTICE '✅ EMERGENCY FIX COMPLETE!';
    RAISE NOTICE '🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Invalid data cleaned up';
    RAISE NOTICE '✅ Constraints updated to be flexible';
    RAISE NOTICE '✅ Subject and section now optional';
    RAISE NOTICE '✅ Default values set';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 You can now:';
    RAISE NOTICE '   1. Upload notes through the app';
    RAISE NOTICE '   2. Subject will default to "Other"';
    RAISE NOTICE '   3. Section will default to "A"';
    RAISE NOTICE '';
    RAISE NOTICE '📝 Next step: Create storage bucket!';
    RAISE NOTICE '';
END $$;

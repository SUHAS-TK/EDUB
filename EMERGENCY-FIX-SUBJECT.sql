-- ==========================================
-- EMERGENCY FIX: Remove NOT NULL constraint
-- This COMPLETELY removes the subject requirement
-- ==========================================

-- Step 1: Make subject column nullable (remove NOT NULL)
ALTER TABLE notes ALTER COLUMN subject DROP NOT NULL;

-- Step 2: Drop ALL check constraints on subject
ALTER TABLE notes DROP CONSTRAINT IF EXISTS notes_subject_check;

-- Step 3: Recreate as a PERMISSIVE constraint (allows NULL and any valid value)
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

-- Step 4: Set a default value
ALTER TABLE notes ALTER COLUMN subject SET DEFAULT 'Other';

-- Step 5: ALSO fix section in case that's the issue
ALTER TABLE notes ALTER COLUMN section DROP NOT NULL;

ALTER TABLE notes DROP CONSTRAINT IF EXISTS notes_section_check;

ALTER TABLE notes 
ADD CONSTRAINT notes_section_check 
CHECK (
    section IS NULL 
    OR section IN ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N')
);

ALTER TABLE notes ALTER COLUMN section SET DEFAULT 'A';

-- Step 6: Verify the changes
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'notes'
AND column_name IN ('subject', 'section', 'title', 'file_url')
ORDER BY ordinal_position;

-- Show constraints
SELECT 
    conname,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'notes'::regclass;

-- Success message
SELECT '✅ EMERGENCY FIX APPLIED!' as status,
       'Subject and Section are now OPTIONAL' as change,
       'Try uploading a note now!' as action;

-- ==========================================
-- ✅ COMPLETE FIX FOR NOTE UPLOAD ERROR
-- Run this in Supabase SQL Editor
-- ==========================================

-- Step 1: ALTER the subject column to allow NULL
ALTER TABLE notes 
ALTER COLUMN subject DROP NOT NULL;

-- Step 2: ALTER the section column to allow NULL  
ALTER TABLE notes 
ALTER COLUMN section DROP NOT NULL;

-- Step 3: Drop existing constraints
ALTER TABLE notes DROP CONSTRAINT IF EXISTS notes_subject_check;
ALTER TABLE notes DROP CONSTRAINT IF EXISTS notes_section_check;

-- Step 4: Add new permissive constraints
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

-- Step 5: Set default values
ALTER TABLE notes ALTER COLUMN subject SET DEFAULT 'Other';
ALTER TABLE notes ALTER COLUMN section SET DEFAULT 'A';

-- Step 6: Update any existing NULL values
UPDATE notes SET subject = 'Other' WHERE subject IS NULL;
UPDATE notes SET section = 'A' WHERE section IS NULL;

-- ✅ VERIFICATION
SELECT '✅ COMPLETE FIX APPLIED!' as status;

-- Show the fixed constraints
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'notes'::regclass
AND conname LIKE '%_check'
ORDER BY conname;

-- Show column details
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'notes'
AND column_name IN ('subject', 'section')
ORDER BY column_name;

-- ==========================================
-- 🎯 DONE! Now test uploading a note!
-- ==========================================

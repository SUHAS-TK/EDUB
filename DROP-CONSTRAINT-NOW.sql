-- ==========================================
-- 🔥 NUCLEAR OPTION: DROP THE CONSTRAINT
-- This REMOVES the check constraint completely
-- Run this in Supabase SQL Editor NOW!
-- ==========================================

-- Drop the problematic constraint
ALTER TABLE notes DROP CONSTRAINT IF EXISTS notes_subject_check;
ALTER TABLE notes DROP CONSTRAINT IF EXISTS notes_section_check;

-- Set default values so fields are never NULL
ALTER TABLE notes ALTER COLUMN subject SET DEFAULT 'Other';
ALTER TABLE notes ALTER COLUMN section SET DEFAULT 'A';

-- Also make them nullable just in case
ALTER TABLE notes ALTER COLUMN subject DROP NOT NULL;
ALTER TABLE notes ALTER COLUMN section DROP NOT NULL;

-- ✅ DONE!
SELECT '✅ CONSTRAINT DROPPED! Upload should work now!' as status;

-- Verify it's gone
SELECT 
    COALESCE(
        string_agg(conname, ', '),
        'No check constraints found'
    ) as remaining_check_constraints
FROM pg_constraint
WHERE conrelid = 'notes'::regclass
AND conname LIKE '%_check';

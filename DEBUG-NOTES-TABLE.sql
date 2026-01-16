-- ==========================================
-- DEBUG: Check what's wrong with the notes table
-- ==========================================

-- 1. Show the EXACT structure of the notes table
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default,
    generation_expression
FROM information_schema.columns
WHERE table_name = 'notes'
ORDER BY ordinal_position;

-- 2. Show ALL constraints on notes table
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'notes'::regclass
ORDER BY conname;

-- 3. Show the table creation DDL
SELECT 
    'CREATE TABLE notes (' || 
    string_agg(
        column_name || ' ' || 
        data_type || 
        CASE WHEN character_maximum_length IS NOT NULL 
            THEN '(' || character_maximum_length || ')' 
            ELSE '' 
        END ||
        CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
        CASE WHEN column_default IS NOT NULL 
            THEN ' DEFAULT ' || column_default 
            ELSE '' 
        END,
        E',\n    '
    ) || ');' as table_structure
FROM information_schema.columns
WHERE table_name = 'notes'
GROUP BY table_name;

-- 4. Try a test insert to see what happens
-- This will show us the EXACT error
DO $$
DECLARE
    test_id uuid;
BEGIN
    -- Try inserting with minimal data
    INSERT INTO notes (title, file_url, file_name)
    VALUES ('Test Note', 'test.pdf', 'test.pdf')
    RETURNING id INTO test_id;
    
    -- If successful, delete it
    DELETE FROM notes WHERE id = test_id;
    RAISE NOTICE '✅ Test insert worked! The issue is with your data values.';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Test insert failed: %', SQLERRM;
    RAISE NOTICE 'This tells us what constraint is failing';
END $$;

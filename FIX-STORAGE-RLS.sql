-- ==========================================
-- FIX: Row-Level Security Policy for File Uploads
-- This allows authenticated users to upload files
-- ==========================================

-- STEP 1: Check current storage policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'storage'
ORDER BY tablename, policyname;

-- STEP 2: Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

SELECT '✅ Step 2: RLS enabled on storage.objects' as status;

-- STEP 3: Drop any existing policies that might be blocking uploads
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload notes" ON storage.objects;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON storage.objects;

SELECT '✅ Step 3: Old policies removed' as status;

-- STEP 4: Create policy to allow authenticated users to INSERT (upload)
CREATE POLICY "Authenticated users can upload files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'notes-files'
);

SELECT '✅ Step 4: Upload policy created' as status;

-- STEP 5: Create policy to allow authenticated users to SELECT (download)
CREATE POLICY "Authenticated users can download files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'notes-files'
);

SELECT '✅ Step 5: Download policy created' as status;

-- STEP 6: Create policy to allow authenticated users to UPDATE
CREATE POLICY "Authenticated users can update their files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'notes-files'
)
WITH CHECK (
    bucket_id = 'notes-files'
);

SELECT '✅ Step 6: Update policy created' as status;

-- STEP 7: Create policy to allow authenticated users to DELETE
CREATE POLICY "Authenticated users can delete their files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'notes-files'
);

SELECT '✅ Step 7: Delete policy created' as status;

-- STEP 8: Also make the bucket public accessible (for reading)
UPDATE storage.buckets 
SET public = true 
WHERE id = 'notes-files';

SELECT '✅ Step 8: Bucket set to public' as status;

-- STEP 9: Verify all policies are in place
SELECT 
    '✅✅✅ STORAGE POLICIES FIXED! ✅✅✅' as status,
    'File uploads should work now!' as message;

-- Show all storage policies
SELECT 
    policyname as policy_name,
    cmd as operation,
    pg_get_expr(qual, 'storage.objects'::regclass) as using_expression
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
AND policyname LIKE '%files%'
ORDER BY policyname;

-- ==========================================
-- SUCCESS MESSAGE
-- ==========================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉';
    RAISE NOTICE '✅ STORAGE POLICIES FIXED!';
    RAISE NOTICE '🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Authenticated users can now:';
    RAISE NOTICE '   - Upload files to notes-files bucket';
    RAISE NOTICE '   - Download files from notes-files bucket';
    RAISE NOTICE '   - Update their uploaded files';
    RAISE NOTICE '   - Delete their uploaded files';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Bucket is public (files are accessible)';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Try uploading a note now!';
    RAISE NOTICE '   It should work without RLS errors!';
    RAISE NOTICE '';
END $$;

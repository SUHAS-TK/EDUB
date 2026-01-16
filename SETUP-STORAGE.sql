-- ==========================================
-- SETUP SUPABASE STORAGE FOR PDF UPLOADS
-- Run this in Supabase SQL Editor
-- ==========================================

-- ============================================
-- STEP 1: Create the storage bucket if it doesn't exist
-- ============================================
-- Note: You need to create the bucket in Supabase Dashboard > Storage
-- Bucket name: notes-files
-- Make it PUBLIC so students can download files

-- ============================================
-- STEP 2: Set up storage policies
-- ============================================

-- Allow authenticated users to upload files
CREATE POLICY IF NOT EXISTS "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'notes-files');

-- Allow everyone to read/download files (makes bucket public)
CREATE POLICY IF NOT EXISTS "Allow public downloads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'notes-files');

-- Allow users to delete their own files
CREATE POLICY IF NOT EXISTS "Allow users to delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'notes-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================
-- VERIFICATION
-- ============================================
SELECT '✅ Storage policies created!' as status;

-- Show all storage policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'objects'
AND schemaname = 'storage';

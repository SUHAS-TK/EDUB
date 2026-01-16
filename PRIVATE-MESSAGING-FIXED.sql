-- ==========================================
-- PRIVATE 1-ON-1 MESSAGING SYSTEM (FIXED)
-- No dependency on user_id column
-- ==========================================

-- STEP 1: Check current messages table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'messages'
ORDER BY ordinal_position;

-- STEP 2: Add sender and receiver columns if they don't exist
ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES auth.users(id);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS receiver_id UUID REFERENCES auth.users(id);

SELECT '✅ Step 2: Sender/Receiver columns added' as status;

-- STEP 3: Drop old RLS policies (section-based)
DROP POLICY IF EXISTS "Users can view messages in their section" ON messages;
DROP POLICY IF EXISTS "Users can create messages in their section" ON messages;
DROP POLICY IF EXISTS "Users can view their section messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages to their section" ON messages;
DROP POLICY IF EXISTS "Enable read access for same section" ON messages;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON messages;
DROP POLICY IF EXISTS "Allow all to read messages" ON messages;
DROP POLICY IF EXISTS "Allow all to insert messages" ON messages;

SELECT '✅ Step 3: Old section-based policies removed' as status;

-- STEP 4: Create NEW RLS policies for PRIVATE 1-on-1 messaging

-- Policy 1: Users can ONLY see messages sent TO them or BY them
CREATE POLICY "Users can only see their own direct messages"
ON messages
FOR SELECT
TO authenticated
USING (
    auth.uid() = sender_id   -- Messages I sent
    OR 
    auth.uid() = receiver_id -- Messages sent to me
);

SELECT '✅ Step 4a: Private message viewing policy created' as status;

-- Policy 2: Users can ONLY send messages (insert)
CREATE POLICY "Users can send direct messages"
ON messages
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = sender_id  -- Can only send as yourself
);

SELECT '✅ Step 4b: Private message sending policy created' as status;

-- Policy 3: Users can update only their own messages
CREATE POLICY "Users can update their own messages"
ON messages
FOR UPDATE
TO authenticated
USING (auth.uid() = sender_id)
WITH CHECK (auth.uid() = sender_id);

SELECT '✅ Step 4c: Message update policy created' as status;

-- Policy 4: Users can delete only their own messages
CREATE POLICY "Users can delete their own messages"
ON messages
FOR DELETE
TO authenticated
USING (auth.uid() = sender_id);

SELECT '✅ Step 4d: Message delete policy created' as status;

-- STEP 5: Make sure RLS is enabled
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

SELECT '✅ Step 5: RLS enabled on messages table' as status;

-- STEP 6: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(sender_id, receiver_id);

SELECT '✅ Step 6: Performance indexes created' as status;

-- STEP 7: Verify the setup
SELECT 
    '✅✅✅ PRIVATE MESSAGING ENABLED! ✅✅✅' as status,
    'Only sender and receiver can see messages!' as message;

-- Show all current policies
SELECT 
    policyname as policy_name,
    cmd as operation
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'messages'
ORDER BY policyname;

-- Show table structure
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'messages'
ORDER BY ordinal_position;

-- ==========================================
-- SUCCESS MESSAGE
-- ==========================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉';
    RAISE NOTICE '✅ PRIVATE 1-ON-1 MESSAGING ENABLED!';
    RAISE NOTICE '🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉';
    RAISE NOTICE '';
    RAISE NOTICE '✅ How it works now:';
    RAISE NOTICE '   - Messages have sender_id and receiver_id';
    RAISE NOTICE '   - ONLY sender and receiver can view';
    RAISE NOTICE '   - Other teachers: CANNOT see';
    RAISE NOTICE '   - Other students: CANNOT see';
    RAISE NOTICE '   - Same section: CANNOT see (unless receiver)';
    RAISE NOTICE '';
    RAISE NOTICE '🔒 Privacy Features:';
    RAISE NOTICE '   ✅ 100% private conversations';
    RAISE NOTICE '   ✅ Only 2 people can see each message';
    RAISE NOTICE '   ✅ Database-level security (RLS)';
    RAISE NOTICE '   ✅ No section-based broadcasting';
    RAISE NOTICE '';
    RAISE NOTICE '📝 Next Steps:';
    RAISE NOTICE '   1. Update app.js to use sender_id/receiver_id';
    RAISE NOTICE '   2. Add recipient selection UI';
    RAISE NOTICE '   3. Test private messaging';
    RAISE NOTICE '';
    RAISE NOTICE '💡 Note: Existing messages will need sender_id';
    RAISE NOTICE '   and receiver_id set manually or via app update';
    RAISE NOTICE '';
END $$;

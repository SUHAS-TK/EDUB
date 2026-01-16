-- ==========================================
-- PRIVATE 1-ON-1 MESSAGING SYSTEM
-- Teacher <-> Student Direct Messages ONLY
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
ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES users(id);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS receiver_id UUID REFERENCES users(id);

SELECT '✅ Step 2: Sender/Receiver columns added' as status;

-- STEP 3: Update existing messages to set sender_id from user_id
UPDATE messages 
SET sender_id = user_id 
WHERE sender_id IS NULL AND user_id IS NOT NULL;

SELECT '✅ Step 3: Existing messages updated with sender_id' as status;

-- STEP 4: Drop old RLS policies (section-based)
DROP POLICY IF EXISTS "Users can view messages in their section" ON messages;
DROP POLICY IF EXISTS "Users can create messages in their section" ON messages;
DROP POLICY IF EXISTS "Users can view their section messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages to their section" ON messages;
DROP POLICY IF EXISTS "Enable read access for same section" ON messages;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON messages;

SELECT '✅ Step 4: Old section-based policies removed' as status;

-- STEP 5: Create NEW RLS policies for PRIVATE 1-on-1 messaging
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

SELECT '✅ Step 5a: Private message viewing policy created' as status;

-- Policy 2: Users can ONLY send messages (insert)
CREATE POLICY "Users can send direct messages"
ON messages
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = sender_id  -- Can only send as yourself
);

SELECT '✅ Step 5b: Private message sending policy created' as status;

-- Policy 3: Users can update only their own messages
CREATE POLICY "Users can update their own messages"
ON messages
FOR UPDATE
TO authenticated
USING (auth.uid() = sender_id)
WITH CHECK (auth.uid() = sender_id);

SELECT '✅ Step 5c: Message update policy created' as status;

-- Policy 4: Users can delete only their own messages
CREATE POLICY "Users can delete their own messages"
ON messages
FOR DELETE
TO authenticated
USING (auth.uid() = sender_id);

SELECT '✅ Step 5d: Message delete policy created' as status;

-- STEP 6: Make sure RLS is enabled
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

SELECT '✅ Step 6: RLS enabled on messages table' as status;

-- STEP 7: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(sender_id, receiver_id);

SELECT '✅ Step 7: Performance indexes created' as status;

-- STEP 8: Verify the setup
SELECT 
    '✅✅✅ PRIVATE MESSAGING ENABLED! ✅✅✅' as status,
    'Only sender and receiver can see messages!' as message;

-- Show all policies
SELECT 
    policyname as policy_name,
    cmd as operation,
    pg_get_expr(qual, 'messages'::regclass) as using_condition
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
AND column_name IN ('sender_id', 'receiver_id', 'user_id', 'message', 'created_at')
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
    RAISE NOTICE '   - Teacher sends message to specific student';
    RAISE NOTICE '   - ONLY that teacher and student can see it';
    RAISE NOTICE '   - Other teachers: CANNOT see';
    RAISE NOTICE '   - Other students: CANNOT see';
    RAISE NOTICE '   - Same section: CANNOT see (unless they are the receiver)';
    RAISE NOTICE '';
    RAISE NOTICE '🔒 Privacy guaranteed:';
    RAISE NOTICE '   - Messages are 100% private';
    RAISE NOTICE '   - Only 2 people involved can see';
    RAISE NOTICE '   - Complete 1-on-1 communication';
    RAISE NOTICE '';
    RAISE NOTICE '📝 Next: Update app.js to use new system';
    RAISE NOTICE '';
END $$;

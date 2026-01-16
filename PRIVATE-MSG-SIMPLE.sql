-- ==========================================
-- PRIVATE 1-ON-1 MESSAGING SYSTEM (SIMPLE)
-- Works without complex RAISE statements
-- ==========================================

-- STEP 1: Add sender and receiver columns if they don't exist
ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES auth.users(id);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS receiver_id UUID REFERENCES auth.users(id);

-- STEP 2: Drop old RLS policies (section-based)
DROP POLICY IF EXISTS "Users can view messages in their section" ON messages;
DROP POLICY IF EXISTS "Users can create messages in their section" ON messages;
DROP POLICY IF EXISTS "Users can view their section messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages to their section" ON messages;
DROP POLICY IF EXISTS "Enable read access for same section" ON messages;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON messages;
DROP POLICY IF EXISTS "Allow all to read messages" ON messages;
DROP POLICY IF EXISTS "Allow all to insert messages" ON messages;
DROP POLICY IF EXISTS "Users can only see their own direct messages" ON messages;
DROP POLICY IF EXISTS "Users can send direct messages" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON messages;

-- STEP 3: Create NEW RLS policies for PRIVATE 1-on-1 messaging

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

-- Policy 2: Users can ONLY send messages (insert)
CREATE POLICY "Users can send direct messages"
ON messages
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = sender_id  -- Can only send as yourself
);

-- Policy 3: Users can update only their own messages
CREATE POLICY "Users can update their own messages"
ON messages
FOR UPDATE
TO authenticated
USING (auth.uid() = sender_id)
WITH CHECK (auth.uid() = sender_id);

-- Policy 4: Users can delete only their own messages
CREATE POLICY "Users can delete their own messages"
ON messages
FOR DELETE
TO authenticated
USING (auth.uid() = sender_id);

-- STEP 4: Make sure RLS is enabled
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- STEP 5: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(sender_id, receiver_id);

-- STEP 6: Show results
SELECT 'PRIVATE MESSAGING ENABLED!' as status;
SELECT 'Only sender and receiver can see messages!' as message;

-- Show all current policies
SELECT 
    policyname as policy_name,
    cmd as operation
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'messages'
ORDER BY policyname;

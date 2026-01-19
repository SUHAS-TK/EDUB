-- ==========================================
-- EDUBRIDGE - New Features Database Setup
-- Run this in your Supabase SQL Editor
-- ==========================================

-- ===========================================
-- 1. ANNOUNCEMENTS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS announcements (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'important', 'urgent')),
    sender_id UUID REFERENCES auth.users(id),
    sender_name TEXT,
    section TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Everyone can view announcements
CREATE POLICY "Everyone can view announcements"
ON announcements FOR SELECT
TO authenticated
USING (true);

-- Only teachers can create announcements
CREATE POLICY "Teachers can create announcements"
ON announcements FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'teacher'
    )
);

-- ===========================================
-- 2. CALENDAR EVENTS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS calendar_events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    event_date DATE NOT NULL,
    event_type TEXT DEFAULT 'personal' CHECK (event_type IN ('exam', 'assignment', 'holiday', 'meeting', 'personal')),
    is_public BOOLEAN DEFAULT FALSE,
    user_id UUID REFERENCES auth.users(id),
    user_name TEXT,
    section TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Users can view public events OR their own private events
CREATE POLICY "View calendar events"
ON calendar_events FOR SELECT
TO authenticated
USING (
    is_public = true 
    OR user_id = auth.uid()
);

-- Users can create their own calendar events
CREATE POLICY "Create calendar events"
ON calendar_events FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own events
CREATE POLICY "Update own calendar events"
ON calendar_events FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Users can delete their own events
CREATE POLICY "Delete own calendar events"
ON calendar_events FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ===========================================
-- 3. NOTIFICATIONS TABLE (Optional - for cloud sync)
-- ===========================================

CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    ref_id TEXT,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only view their own notifications
CREATE POLICY "View own notifications"
ON notifications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- System can create notifications for users
CREATE POLICY "Create notifications"
ON notifications FOR INSERT
TO authenticated
WITH CHECK (true);

-- Users can update (mark as read) their own notifications
CREATE POLICY "Update own notifications"
ON notifications FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ===========================================
-- GRANT PERMISSIONS
-- ===========================================

GRANT ALL ON announcements TO authenticated;
GRANT ALL ON calendar_events TO authenticated;
GRANT ALL ON notifications TO authenticated;

-- Success message
SELECT 'New features tables created successfully!' AS status;

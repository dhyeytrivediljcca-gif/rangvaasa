-- ============================================================================
-- RANGVAASA 2026 — Fix Admin Dashboard Data Visibility in Supabase
-- ============================================================================
-- Problem: Entries are saved in database, but Admin Panel shows 0 records.
-- Cause: Supabase Row Level Security (RLS) is blocking the SELECT query for the anon key.
-- Solution: Run this SQL script in Supabase Dashboard -> SQL Editor -> Click 'Run'.
-- ============================================================================

-- 1. Ensure RLS is active on tables
ALTER TABLE student_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stall_registrations ENABLE ROW LEVEL SECURITY;

-- 2. Allow public visitors to insert passes and stalls
DROP POLICY IF EXISTS "Public visitors can insert student pass" ON student_registrations;
CREATE POLICY "Public visitors can insert student pass"
    ON student_registrations
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Public visitors can insert stall registration" ON stall_registrations;
CREATE POLICY "Public visitors can insert stall registration"
    ON stall_registrations
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- 3. Allow Admin Dashboard to read (SELECT) student and stall registrations
DROP POLICY IF EXISTS "Allow select for student registrations" ON student_registrations;
CREATE POLICY "Allow select for student registrations"
    ON student_registrations
    FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow select for stall registrations" ON stall_registrations;
CREATE POLICY "Allow select for stall registrations"
    ON stall_registrations
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- 4. Enable Supabase Realtime publication (live automatic WebSocket dashboard updates)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'student_registrations'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE student_registrations;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'stall_registrations'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE stall_registrations;
    END IF;
END $$;

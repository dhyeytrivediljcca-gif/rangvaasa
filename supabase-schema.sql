-- ============================================================================
-- RANGVAASA 2026 — Supabase Database Migration & Row Level Security (RLS)
-- ============================================================================

-- 1. STUDENT REGISTRATIONS TABLE
CREATE TABLE IF NOT EXISTS student_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    roll_number TEXT NOT NULL,
    full_name TEXT NOT NULL,
    department TEXT NOT NULL CHECK (department IN ('BBA', 'BCA')),
    semester TEXT NOT NULL CHECK (semester IN ('Semester 1', 'Semester 3', 'Semester 5', 'Semester 7')),
    pass_code TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for search and reporting performance
CREATE INDEX IF NOT EXISTS idx_student_roll ON student_registrations(roll_number);
CREATE INDEX IF NOT EXISTS idx_student_dept_sem ON student_registrations(department, semester);
CREATE INDEX IF NOT EXISTS idx_student_created ON student_registrations(created_at DESC);

-- 2. STALL REGISTRATIONS TABLE
CREATE TABLE IF NOT EXISTS stall_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_category TEXT NOT NULL CHECK (registration_category IN ('BBA', 'BCA', 'Others')),
    stall_name TEXT NOT NULL,
    owner_full_name TEXT NOT NULL,
    stall_type TEXT NOT NULL CHECK (stall_type IN ('Food', 'Art', 'Beverages', 'Other')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for stall search and filtering
CREATE INDEX IF NOT EXISTS idx_stall_category ON stall_registrations(registration_category);
CREATE INDEX IF NOT EXISTS idx_stall_type ON stall_registrations(stall_type);
CREATE INDEX IF NOT EXISTS idx_stall_created ON stall_registrations(created_at DESC);

-- ============================================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on both tables
ALTER TABLE student_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stall_registrations ENABLE ROW LEVEL SECURITY;

-- ── Student Registrations Policies ──
-- Allow public visitors to insert their registration (pass generation)
DROP POLICY IF EXISTS "Public visitors can insert student pass" ON student_registrations;
CREATE POLICY "Public visitors can insert student pass"
    ON student_registrations
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Allow reading student registrations for admin dashboard
DROP POLICY IF EXISTS "Only authorized admin can read student registrations" ON student_registrations;
DROP POLICY IF EXISTS "Allow select for student registrations" ON student_registrations;
CREATE POLICY "Allow select for student registrations"
    ON student_registrations
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- ── Stall Registrations Policies ──
-- Allow public visitors to register stalls
DROP POLICY IF EXISTS "Public visitors can insert stall registration" ON stall_registrations;
CREATE POLICY "Public visitors can insert stall registration"
    ON stall_registrations
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Allow reading stall registrations for admin dashboard
DROP POLICY IF EXISTS "Only authorized admin can read stall registrations" ON stall_registrations;
DROP POLICY IF EXISTS "Allow select for stall registrations" ON stall_registrations;
CREATE POLICY "Allow select for stall registrations"
    ON stall_registrations
    FOR SELECT
    TO anon, authenticated
    USING (true);

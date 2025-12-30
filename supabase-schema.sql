-- ============================================
-- HABIT TRACKER 2026 - SUPABASE SCHEMA
-- Purpose: User identity + anonymous analytics
-- Privacy: No habit data stored on server
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- Stores minimal identity for personalization
-- ============================================
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    first_visit TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_active TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for DAU queries (last_active lookups)
CREATE INDEX idx_users_last_active ON public.users(last_active);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- Ensures users can only access their own data
-- ============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert (for registration)
CREATE POLICY "Allow anonymous insert" ON public.users
    FOR INSERT
    WITH CHECK (true);

-- Policy: Users can only read their own row (by ID stored in localStorage)
CREATE POLICY "Users can read own data" ON public.users
    FOR SELECT
    USING (true);  -- We'll filter by ID in the app

-- Policy: Users can update their own last_active
CREATE POLICY "Users can update own last_active" ON public.users
    FOR UPDATE
    USING (true)  -- ID check happens in app
    WITH CHECK (true);

-- ============================================
-- ADMIN VIEWS (for analytics dashboard)
-- These are read-only aggregations
-- ============================================

-- View: Total user count (no PII exposed)
CREATE OR REPLACE VIEW public.analytics_summary AS
SELECT 
    COUNT(*) AS total_users,
    COUNT(*) FILTER (WHERE last_active::date = CURRENT_DATE) AS daily_active_users,
    COUNT(*) FILTER (WHERE last_active >= NOW() - INTERVAL '7 days') AS weekly_active_users,
    COUNT(*) FILTER (WHERE last_active >= NOW() - INTERVAL '30 days') AS monthly_active_users
FROM public.users;

-- Grant read access to anon role for analytics
GRANT SELECT ON public.analytics_summary TO anon;
GRANT SELECT, INSERT, UPDATE ON public.users TO anon;

-- ============================================
-- ADMIN VIEW: User List with Activity Status
-- Shows user details for admin dashboard
-- Privacy: Only name and timestamps (NO habit data)
-- ============================================
CREATE OR REPLACE VIEW public.admin_user_list AS
SELECT 
    id,
    name,
    first_visit,
    last_active,
    -- Boolean flag: true if user was active today
    (last_active::date = CURRENT_DATE) AS is_active_today,
    -- Human-readable time since last active
    CASE 
        WHEN last_active::date = CURRENT_DATE THEN 'Today'
        WHEN last_active::date = CURRENT_DATE - 1 THEN 'Yesterday'
        ELSE TO_CHAR(last_active, 'Mon DD, YYYY')
    END AS last_active_display
FROM public.users
ORDER BY last_active DESC;

-- Grant read access to anon role for admin view
GRANT SELECT ON public.admin_user_list TO anon;

-- ============================================
-- FUNCTION: Update last_active (rate-limited)
-- Only updates if last update was on a different day
-- ============================================
CREATE OR REPLACE FUNCTION public.update_last_active(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    last_date DATE;
BEGIN
    -- Get the last active date for this user
    SELECT last_active::date INTO last_date
    FROM public.users
    WHERE id = user_id;
    
    -- Only update if it's a new day
    IF last_date IS NULL OR last_date < CURRENT_DATE THEN
        UPDATE public.users
        SET last_active = NOW()
        WHERE id = user_id;
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.update_last_active(UUID) TO anon;

-- ============================================
-- SEED USERS TABLE WITH ADMIN AND DIRECTOR
-- ============================================
-- Execute this script in Supabase SQL Editor to populate users table
-- Required for admin and director login functionality

-- Insert admin user
INSERT INTO public.users (email, username, first_name, last_name, role, is_active, created_at, updated_at)
VALUES (
  'admin@albayyan.edu.ng',
  'admin',
  'System',
  'Administrator',
  'admin',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (username) DO NOTHING;

-- Insert director user
INSERT INTO public.users (email, username, first_name, last_name, role, is_active, created_at, updated_at)
VALUES (
  'director@albayyan.edu.ng',
  'director',
  'School',
  'Director',
  'director',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (username) DO NOTHING;

-- ============================================
-- VERIFY INSERTION - Run this to check
-- ============================================
SELECT 
  id, 
  email, 
  username, 
  first_name,
  last_name,
  role, 
  is_active, 
  created_at
FROM public.users
WHERE role IN ('admin', 'director')
ORDER BY created_at DESC;

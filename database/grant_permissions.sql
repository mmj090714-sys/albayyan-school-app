-- ========================================
-- GRANT PERMISSIONS FOR SUPABASE TABLES
-- Allows anon and authenticated users to access tables
-- ========================================

-- Grant permissions on users table
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO anon, authenticated;
GRANT USAGE ON SEQUENCE users_id_seq TO anon, authenticated;

-- Grant permissions on students table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO anon, authenticated;
GRANT USAGE ON SEQUENCE students_id_seq TO anon, authenticated;

-- Grant permissions on invoices table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO anon, authenticated;
GRANT USAGE ON SEQUENCE invoices_id_seq TO anon, authenticated;

-- Grant permissions on payments table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO anon, authenticated;
GRANT USAGE ON SEQUENCE payments_id_seq TO anon, authenticated;

-- Grant permissions on terms table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.terms TO anon, authenticated;
GRANT USAGE ON SEQUENCE terms_id_seq TO anon, authenticated;

-- Grant permissions on sessions table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sessions TO anon, authenticated;
GRANT USAGE ON SEQUENCE sessions_id_seq TO anon, authenticated;

-- Grant permissions on fee_structures table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fee_structures TO anon, authenticated;
GRANT USAGE ON SEQUENCE fee_structures_id_seq TO anon, authenticated;

-- Grant permissions on audit_logs table
GRANT SELECT, INSERT ON public.audit_logs TO anon, authenticated;
GRANT USAGE ON SEQUENCE audit_logs_id_seq TO anon, authenticated;

-- Verify permissions were granted
-- SELECT grantee, privilege_type 
-- FROM role_table_grants 
-- WHERE table_schema = 'public';

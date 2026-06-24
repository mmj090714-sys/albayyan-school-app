-- Seed initial admin and director users
-- These users will be used for login authentication

INSERT INTO users (email, username, first_name, last_name, role, is_active)
VALUES 
  ('admin@albayyan.edu.ng', 'admin', 'System', 'Administrator', 'admin', true),
  ('director@albayyan.edu.ng', 'director', 'School', 'Director', 'director', true)
ON CONFLICT (username) DO NOTHING;

-- Verify insertion
SELECT * FROM users WHERE role IN ('admin', 'director');

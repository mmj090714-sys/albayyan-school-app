# Phase 2: Database-Backed Authentication Setup Guide

## Overview
Phase 2 implements **database-backed authentication** by connecting the login system to the Supabase `users` table. This replaces the purely in-memory authentication with a persistent user database, enabling:
- User account persistence
- Role-based access control (admin vs director)
- User tracking and audit logging
- Foundation for future Supabase Auth integration (Phase 2B)

## Changes Made

### 1. Updated Login Functions (`client/src/utils/supabaseClient.js`)
**Before**: Hardcoded credentials only
```javascript
if (username === 'admin' && password === 'ChangeMe@123Secure') { ... }
```

**After**: Database-backed with role verification
```javascript
// Verify credentials
if (username === 'admin' && password === 'ChangeMe@123Secure') {
  // Query users table to verify user exists and is active
  const { data, error } = await supabase
    .from('users')
    .select('id, username, role, is_active')
    .eq('username', username)
    .eq('role', 'admin')
    .eq('is_active', true)
    .single()
  
  // Store user ID and role in localStorage
  localStorage.setItem('userId', data.id)
  localStorage.setItem('userRole', 'admin')
}
```

### 2. Added Helper Functions
- `getUserId()` - Retrieve logged-in user's ID
- `getCurrentUser()` - Get all user info (username, role, userId, token)

### 3. Created User Seed Script (`database/seed_users.sql`)
Initializes the users table with admin and director accounts:
```sql
INSERT INTO users (email, username, first_name, last_name, role, is_active)
VALUES 
  ('admin@albayyan.edu.ng', 'admin', 'System', 'Administrator', 'admin', true),
  ('director@albayyan.edu.ng', 'director', 'School', 'Director', 'director', true)
```

## Setup Instructions

### Step 1: Seed the Users Table
1. Go to **Supabase Dashboard** → **SQL Editor**
2. Click **New Query**
3. Copy and paste the contents of `database/seed_users.sql`
4. Click **Run**
5. Expected result: 2 rows inserted

**Verification Query**:
```sql
SELECT * FROM users WHERE role IN ('admin', 'director');
```
Should return 2 rows with admin and director users.

### Step 2: Test Login
1. Go to https://albayyan-school-app.web.app/
2. Click "Access Admin Portal"
3. Login with:
   - **Username**: `admin`
   - **Password**: `ChangeMe@123Secure`
4. Verify the Admin Dashboard loads

### Step 3: Test Director Login
1. Logout from Admin Portal
2. Click "Access Director Portal"
3. Login with:
   - **Username**: `director`
   - **Password**: `ChangeMe@456Secure`
4. Verify the Director Dashboard loads

## What Works Now
✅ Users are stored in the database  
✅ Login verifies user exists and is active  
✅ User ID is tracked for audit logging  
✅ Role-based access control is enforced  
✅ Foundation for audit logging is ready  

## Known Limitations (To Address in Phase 2B)
- Passwords are not hashed - stored in code (temporary solution)
- No Supabase Auth integration yet
- No password change functionality
- No account recovery/reset password

## Next Steps (Phase 2B - Future)

### 1. Integrate Supabase Auth
- Enable Supabase Auth service
- Migrate to proper password hashing
- Remove hardcoded credentials

### 2. Add Password Management
- Change password functionality
- Password reset/recovery flow
- Account deactivation

### 3. Implement Audit Logging
- Log all login attempts
- Track user actions in audit_logs table
- Generate compliance reports

## Troubleshooting

### Error: "Admin user not found in database"
**Cause**: Users table not seeded  
**Fix**: Run `database/seed_users.sql` in Supabase SQL Editor

### Error: "Invalid admin credentials"
**Cause**: Username or password is incorrect  
**Fix**: Verify you're using exactly:
- Username: `admin`
- Password: `ChangeMe@123Secure`

### Login works but user ID not stored
**Cause**: Browser cache issue  
**Fix**: Clear browser cache (Ctrl+Shift+Delete) and try again

## Database Schema Used
```
users table:
- id (BIGSERIAL) - Primary key
- email (VARCHAR) - User email
- username (VARCHAR UNIQUE) - Login username
- first_name (VARCHAR)
- last_name (VARCHAR)
- role (VARCHAR) - 'admin' or 'director'
- is_active (BOOLEAN) - Active status
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## Security Notes
⚠️ **Development Only**: Current implementation has hardcoded passwords in source code. This is acceptable for development but **NOT suitable for production**.

For production, implement:
1. Proper password hashing (bcrypt/Argon2)
2. Supabase Auth for managing credentials
3. SSL/TLS encryption
4. Rate limiting on login attempts
5. Multi-factor authentication (MFA)

## Support
If you encounter issues:
1. Check Supabase logs: Dashboard → Logs
2. Verify users table has 2 rows
3. Check browser console (F12 → Console tab) for errors
4. Verify `.env.production` has correct Supabase credentials

---
**Commit**: fa0e69a  
**Status**: ✅ Ready for testing

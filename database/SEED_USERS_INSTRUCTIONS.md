# 🔐 Seed Users Table - Complete Instructions

## Problem
Users table exists but is empty. The login functions query this table and fail with "user not found in database" error.

## Solution
Execute the SQL script below in Supabase SQL Editor to seed admin and director users.

---

## ✅ Step-by-Step Instructions

### Step 1: Go to Supabase SQL Editor
1. Open: https://supabase.com/dashboard/project/ugcshwgjqubuhbhpxztw/sql/new
2. You should see an empty SQL editor

### Step 2: Copy and Paste the SQL Script
Copy this entire script and paste it into the SQL editor:

```sql
-- ============================================
-- SEED USERS TABLE WITH ADMIN AND DIRECTOR
-- ============================================

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
-- VERIFY INSERTION
-- ============================================
SELECT id, email, username, role, is_active, created_at
FROM public.users
WHERE role IN ('admin', 'director')
ORDER BY created_at DESC;
```

### Step 3: Execute the Script
1. Click the **▶️ Run** button (or press Ctrl+Enter)
2. You should see results showing the 2 inserted users

### Step 4: Verify Success
You should see output like:
```
id  | email                   | username | role      | is_active | created_at
----|-------------------------|----------|-----------|-----------|------------------
2   | director@albayyan.edu.ng| director | director  | true      | 2026-06-24...
1   | admin@albayyan.edu.ng   | admin    | admin     | true      | 2026-06-24...
```

---

## 🧪 Test Login After Seeding

Once seeded, you can login with:

### Admin Login
- **Username**: `admin`
- **Password**: `ChangeMe@123Secure`

### Director Login
- **Username**: `director`
- **Password**: `ChangeMe@456Secure`

---

## 🔍 Troubleshooting

### Error: "Duplicate key value violates unique constraint"
- **Cause**: Users already exist in table
- **Solution**: Use `ON CONFLICT (username) DO NOTHING` clause (included in script above)

### Error: "Table users does not exist"
- **Cause**: Users table wasn't created
- **Solution**: Run `supabase_phase1_blocks_4_5_6.sql` first to create tables

### Still getting "user not found" after seeding?
- **Check 1**: Verify users were inserted (run SELECT query above)
- **Check 2**: Verify `is_active = true` for both users
- **Check 3**: Verify `role` is exactly 'admin' or 'director' (case-sensitive)
- **Check 4**: Hard refresh browser (Ctrl+Shift+R) to clear cache

---

## 📋 What Gets Inserted

| Field | Admin | Director |
|-------|-------|----------|
| **email** | admin@albayyan.edu.ng | director@albayyan.edu.ng |
| **username** | admin | director |
| **first_name** | System | School |
| **last_name** | Administrator | Director |
| **role** | admin | director |
| **is_active** | true | true |

---

## 🔒 Security Notes

- **Passwords are NOT stored in users table** - They're hardcoded in the frontend (Phase 2B will change this)
- Current passwords:
  - Admin: `ChangeMe@123Secure`
  - Director: `ChangeMe@456Secure`
- These should be changed in production
- Credentials are checked in `client/src/utils/supabaseClient.js`

---

## ✨ After Successful Seeding

1. Go to: https://albayyan-school-app.web.app/
2. Click "Access Admin Portal"
3. Enter credentials:
   - Username: `admin`
   - Password: `ChangeMe@123Secure`
4. Click "Sign In"
5. You should see the Admin Dashboard

---

## 📞 Need Help?

If seeding still doesn't work:
1. Check Supabase project is active
2. Verify table structure (should have: id, email, username, first_name, last_name, role, is_active, created_at, updated_at)
3. Check for typos in username (admin/director - lowercase)
4. Verify is_active is `true` (boolean, not text)

---

**Once seeded, both admin and director logins should work immediately!** ✅

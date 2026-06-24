# 🚀 QUICK FIX - Seed Users Table

## The Issue
❌ Login says "Admin/Director user not found in database"

## The Fix
✅ Execute SQL script to insert users into database

---

## 🎯 Two-Minute Solution

### Copy This SQL:
```sql
INSERT INTO public.users (email, username, first_name, last_name, role, is_active, created_at, updated_at)
VALUES 
  ('admin@albayyan.edu.ng', 'admin', 'System', 'Administrator', 'admin', true, NOW(), NOW()),
  ('director@albayyan.edu.ng', 'director', 'School', 'Director', 'director', true, NOW(), NOW())
ON CONFLICT (username) DO NOTHING;

SELECT * FROM public.users WHERE role IN ('admin', 'director');
```

### Paste It Here:
1. Go to: https://supabase.com/dashboard/project/ugcshwgjqubuhbhpxztw/sql/new
2. Paste the SQL above
3. Click **▶️ Run**
4. Should see 2 rows inserted

### Then Try Login:
- URL: https://albayyan-school-app.web.app/
- **Admin**: username=`admin`, password=`ChangeMe@123Secure`
- **Director**: username=`director`, password=`ChangeMe@456Secure`

---

## ✨ That's It!

Once seeded, both logins should work immediately.

**Questions?** Check the detailed instructions in `SEED_USERS_INSTRUCTIONS.md`

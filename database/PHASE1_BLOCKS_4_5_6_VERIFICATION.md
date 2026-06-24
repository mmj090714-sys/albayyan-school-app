# Phase 1 Blocks 4, 5, 6 - Supabase Table Verification & Fix

## Issue Summary
Blocks 4, 5, and 6 are experiencing issues because the corresponding Supabase tables may not be properly created or configured.

**Affected Blocks:**
- **Block 4**: `payments` table - Payment record tracking
- **Block 5**: `users` table - User management
- **Block 6**: `audit_logs` table - Audit trail logging

---

## Table Structure Verification

### ✅ Block 4: Payments Table
**Purpose**: Store payment records linked to invoices and students

**Required Fields**:
```
id                  - UUID (Primary Key)
invoice_id          - UUID (Foreign Key to invoices)
student_id          - UUID (Foreign Key to students)
amount_paid         - DECIMAL(15, 2)
payment_method      - VARCHAR(50) - e.g., 'Bank Transfer', 'Cash'
bank_name           - VARCHAR(100) - Bank name for transfers
receipt_number      - VARCHAR(100) - Unique receipt ID
paid_by_name        - VARCHAR(150) - Name of person who paid
payment_date        - DATE
transaction_reference - VARCHAR(100) - Transaction ID/reference
recorded_by         - VARCHAR(100) - Admin who recorded it
created_at          - TIMESTAMP WITH TIME ZONE
updated_at          - TIMESTAMP WITH TIME ZONE
```

**Required Indexes**:
- `idx_payments_invoice_id`
- `idx_payments_student_id`
- `idx_payments_created_at`
- `idx_payments_payment_date`

**RLS Policies**: All CRUD operations should be enabled (permissive policies)

---

### ✅ Block 5: Users Table
**Purpose**: Manage admin and director users for Supabase Auth integration

**Required Fields**:
```
id                  - UUID (Primary Key)
email               - VARCHAR(255) UNIQUE
username            - VARCHAR(100) UNIQUE
first_name          - VARCHAR(100)
last_name           - VARCHAR(100)
role                - VARCHAR(50) - 'admin' or 'director'
is_active           - BOOLEAN
last_login          - TIMESTAMP WITH TIME ZONE
created_at          - TIMESTAMP WITH TIME ZONE
updated_at          - TIMESTAMP WITH TIME ZONE
```

**Required Indexes**:
- `idx_users_email`
- `idx_users_role`
- `idx_users_is_active`

**RLS Policies**: All CRUD operations should be enabled

---

### ✅ Block 6: Audit Logs Table
**Purpose**: Track all system actions for compliance and debugging

**Required Fields**:
```
id                  - UUID (Primary Key)
user_id             - UUID (Foreign Key to users)
action              - VARCHAR(100) - e.g., 'CREATE', 'UPDATE', 'DELETE'
entity_type         - VARCHAR(100) - e.g., 'invoice', 'payment', 'student'
entity_id           - VARCHAR(255) - ID of affected entity
old_values          - JSONB - Previous data
new_values          - JSONB - New data
description         - TEXT - Human readable description
ip_address          - VARCHAR(50) - IP address of requester
created_at          - TIMESTAMP WITH TIME ZONE
```

**Required Indexes**:
- `idx_audit_logs_user_id`
- `idx_audit_logs_entity_type`
- `idx_audit_logs_action`
- `idx_audit_logs_created_at`

**RLS Policies**: Readonly for regular users, write for audit system

---

## Setup Instructions

### Step 1: Access Supabase SQL Editor
1. Go to https://app.supabase.com/
2. Select your project: `ugcshwgjqubuhbhpxztw`
3. Navigate to **SQL Editor**
4. Click **+ New Query**

### Step 2: Execute Creation Script
1. Copy the entire contents of `database/supabase_phase1_blocks_4_5_6.sql`
2. Paste into the SQL Editor
3. Click **Run** button
4. Wait for completion - should see "3 tables created successfully"

### Step 3: Verify Tables Were Created
In Supabase, go to **Table Editor** and verify:
- ✅ `payments` table exists with all fields
- ✅ `users` table exists with all fields  
- ✅ `audit_logs` table exists with all fields
- ✅ All indexes are created
- ✅ RLS is enabled on all tables

### Step 4: Test Table Access from Application
The application will automatically test these on next:
- Admin Dashboard load → Tests payments table
- Auth Service initialization → Tests users table
- Any admin action → Tests audit_logs table

---

## Common Issues & Solutions

### ❌ Issue: "relation 'payments' does not exist"
**Cause**: Table wasn't created  
**Fix**: Run the SQL creation script in Supabase SQL Editor

### ❌ Issue: "permission denied for schema public"
**Cause**: RLS policies are too restrictive  
**Fix**: Ensure RLS policies use `USING (true)` for permissive access

### ❌ Issue: "foreign key constraint failed"
**Cause**: Trying to insert payment with non-existent invoice_id  
**Fix**: Ensure invoice exists before recording payment

### ❌ Issue: "duplicate key value violates unique constraint"
**Cause**: receipt_number already exists  
**Fix**: Ensure receipt numbers are unique

---

## Testing Checklist

After creating tables, verify functionality:

```
☐ Admin Dashboard loads without errors
☐ Payment recording works (Payments tab)
☐ Can view payment history
☐ Can delete payments
☐ Admin login works (users table)
☐ Director login works
☐ No console errors related to table access
☐ Supabase logs show successful queries
```

---

## Rollback Instructions (if needed)

If you need to delete and recreate the tables:

```sql
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS users CASCADE;
```

Then re-run the creation script.

---

## Next Steps

After blocks 4, 5, 6 are verified:
1. Run full test suite on Admin Dashboard
2. Test Payment recording workflow
3. Check Director Dashboard loads correctly
4. Verify Supabase logging captures actions

---

## Support

If tables still have issues after setup:
1. Check Supabase project logs: SQL Editor → Logs
2. Verify RLS policies are enabled (not disabled)
3. Confirm foreign key relationships
4. Check for trigger errors on updated_at timestamps

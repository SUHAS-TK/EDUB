# 🔧 FIX: Database Permission Error

## 🚨 What's happening?
You're getting a permission error when running SQL in Supabase. This is usually because:
- You're not the project owner
- The SQL editor doesn't have full permissions
- You need to bypass RLS temporarily

---

## ✅ SOLUTION: Use the Simple Schema

I've created **`supabase-SIMPLE-schema.sql`** with very basic permissions.

### **OPTION 1: Run Simple Schema** (Recommended)

1. **Open Supabase SQL Editor**
   - Go to: https://supabase.com/dashboard/project/vawblwlvnwwajmdxhryz/sql

2. **Important: Disable RLS Check**
   - Look for a toggle that says **"RLS enabled"** or **"Bypass RLS"**
   - **TOGGLE IT OFF** temporarily
   - OR check **"Run as service role"** if available

3. **Copy & Run Simple Schema**
   - Open: `supabase-SIMPLE-schema.sql`
   - Copy ALL contents (Ctrl+A, Ctrl+C)
   - Paste into SQL Editor
   - Click **"RUN"**

4. **Wait for Success**
   - Should complete without errors
   - You'll see green checkmarks ✅

---

## ✅ OPTION 2: Run in Supabase Dashboard

If the SQL Editor doesn't work:

### **Method A: Table Editor (Manual)**

1. **Go to Table Editor**
   - https://supabase.com/dashboard/project/vawblwlvnwwajmdxhryz/editor

2. **Create Tables Manually**:

   **Table 1: users**
   - Click "New table"
   - Name: `users`
   - Columns:
     - `id` (uuid, primary key, references auth.users)
     - `email` (text, unique)
     - `name` (text)
     - `role` (text)
     - `section` (text)
     - `subject` (text, nullable)
     - `created_at` (timestampz, default now())
   - Enable RLS: ✓

   **Table 2: notes**
   - Name: `notes`
   - Columns:
     - `id` (uuid, primary key, default gen_random_uuid())
     - `title` (text)
     - `description` (text, nullable)
     - `file_url` (text, nullable)
     - `file_name` (text, nullable)
     - `uploaded_by` (uuid, references users)
     - `section` (text)
     - `subject` (text)
     - `created_at` (timestampz, default now())
   - Enable RLS: ✓

   **Table 3: attendance**
   - Name: `attendance`
   - Columns:
     - `id` (uuid, primary key, default gen_random_uuid())
     - `student_id` (uuid, references users)
     - `code` (text)
     - `section` (text)
     - `created_at` (timestampz, default now())
   - Enable RLS: ✓

   **Table 4: messages**
   - Name: `messages`
   - Columns:
     - `id` (uuid, primary key, default gen_random_uuid())
     - `sender_id` (uuid, references users)
     - `message` (text)
     - `section` (text)
     - `subject` (text)
     - `created_at` (timestampz, default now())
   - Enable RLS: ✓

3. **Set RLS Policies** (for each table):
   - Go to "Authentication" → "Policies"
   - For each table, add:
     - **SELECT**: Allow all users (USING: `true`)
     - **INSERT**: Allow authenticated users (WITH CHECK: `auth.uid() IS NOT NULL`)
     - **UPDATE**: Allow own records only (USING: `auth.uid() = id` or appropriate field)
     - **DELETE**: Allow own records only

---

## ✅ OPTION 3: Check Your Permissions

### **Verify You're the Owner**

1. Go to: https://supabase.com/dashboard/project/vawblwlvnwwajmdxhryz/settings/general

2. Check:
   - Are you the **Owner**?
   - Or just a **Member**?

3. **If you're NOT the owner**:
   - Ask the owner to run the SQL
   - OR ask them to give you "Admin" permissions

---

## ✅ OPTION 4: Disable RLS Temporarily

If RLS is causing issues:

```sql
-- Run this FIRST to disable RLS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
```

Then run the simple schema, then re-enable:

```sql
-- Re-enable after tables are created
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
```

---

## 🔍 Quick Test After Setup

Once tables are created, test the connection:

1. **Refresh test page**: http://localhost:8000/test-connection.html
2. **All 4 tests should PASS** ✅
3. **If Test 4 still fails**: Tables might not be visible
   - Check if tables exist in Table Editor
   - Make sure RLS policies are set

---

## ❓ Still Getting Errors?

### **Error: "permission denied for schema public"**
**Fix**: You don't have permission to create tables.
- Ask project owner to run the SQL
- OR try creating tables via Table Editor (Method A above)

### **Error: "must be owner of table users"**
**Fix**: You're not the table owner.
- Drop existing tables first
- Or have the original creator run the new SQL

### **Error: "infinite recursion detected"**
**Fix**: Use the SIMPLE schema, not the old one!
- File: `supabase-SIMPLE-schema.sql`
- Not: `supabase-section-subject-schema.sql`

---

## 📞 Next Steps

After tables are created:

1. ✅ Test connection → http://localhost:8000/test-connection.html
2. ✅ Create storage bucket: `notes-files` (Public)
3. ✅ Open main app → http://localhost:8000/index.html
4. ✅ Register a test account
5. ✅ Start using EDUBRIDGE! 🎉

---

**Pro Tip**: The simple schema has very open permissions. We filter data in the application code for security and section-based access.

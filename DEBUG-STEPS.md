# 🔧 Database Connection Error - Debug Steps

## What You're Seeing:
❌ "Database Connection Error"

## Possible Causes:
1. SQL script wasn't run properly
2. Tables don't exist
3. Row Level Security (RLS) policies blocking access
4. Network/connectivity issue

---

## ✅ SOLUTION - Follow These Steps:

### **STEP 1: Verify SQL Was Run**

1. Open Supabase SQL Editor:
   ```
   https://supabase.com/dashboard/project/vawblwlvnwwajmdxhryz/sql
   ```

2. Click **"New Query"**

3. Copy ENTIRE contents from: `supabase-section-subject-schema.sql`

4. Paste and click **RUN**

5. You should see: ✅ "Success. No rows returned"

---

### **STEP 2: Check if Tables Exist**

1. Go to Table Editor:
   ```
   https://supabase.com/dashboard/project/vawblwlvnwwajmdxhryz/editor
   ```

2. Look for these tables in the left sidebar:
   - `users`
   - `notes`
   - `attendance`
   - `messages`

**If you DON'T see these tables** → SQL script wasn't run correctly!

---

### **STEP 3: Test with Simple Query**

In Supabase SQL Editor, run this:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

**Expected Result:** Should show `users`, `notes`, `attendance`, `messages`

---

### **STEP 4: Temporarily Disable RLS (For Testing)**

If tables exist but you still get errors, RLS might be blocking access.

Run the file: `QUICK-FIX.sql` in Supabase SQL Editor

This will:
- Disable RLS temporarily
- Let you test if website works
- You can re-enable it later

---

### **STEP 5: Check Browser Console**

1. Open your website (index.html)
2. Press **F12** to open Developer Tools
3. Click **"Console"** tab
4. Look for error messages

**Common Errors:**

**Error 1:** `relation "users" does not exist`
- **Fix:** Tables weren't created → Run SQL script again

**Error 2:** `new row violates row-level security policy`
- **Fix:** RLS is blocking → Run QUICK-FIX.sql

**Error 3:** `Failed to fetch`
- **Fix:** Network issue or wrong Supabase URL

**Error 4:** `Invalid API key`
- **Fix:** Check supabase-config.js credentials

---

### **STEP 6: Re-check Supabase Credentials**

Open: `supabase-config.js`

Verify:
```javascript
url: "https://vawblwlvnwwajmdxhryz.supabase.co"  // Correct?
anonKey: "eyJh..."  // Should be a long string
```

Get correct values from:
```
https://supabase.com/dashboard/project/vawblwlvnwwajmdxhryz/settings/api
```

---

### **STEP 7: Use the Test Connection Tool**

Double-click: `test-connection.html`

This will automatically:
- ✅ Check Supabase SDK
- ✅ Verify configuration
- ✅ Test database connection
- ✅ Check if tables exist
- 📋 Show detailed error messages

---

## 🎯 Quick Checklist

Before website will work, you MUST have:

- ☐ Supabase project active
- ☐ SQL script run successfully
- ☐ All 4 tables created (users, notes, attendance, messages)
- ☐ Storage bucket `notes-files` created
- ☐ Correct URL and API key in supabase-config.js
- ☐ Internet connection active

---

## 🆘 Still Not Working?

Tell me:
1. What error message you see in browser console (F12)?
2. Do the tables exist in Supabase? (YES/NO)
3. What happens when you run the SQL script?
4. Screenshot of test-connection.html results?

Then I can provide exact fix!

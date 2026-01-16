# 🔧 FIX: notes_subject_check Constraint Violation

## Problem
When uploading notes, you're getting this error:
```
new row for relation "notes" violates check constraint "notes_subject_check"
```

## Root Cause
The `notes` table has a `NOT NULL` constraint on the `subject` field with a CHECK constraint that only allows specific values. The upload code tries to use:
```javascript
subject: subject || this.currentUser.subject
```

If both are empty/undefined, it sends `null` or an invalid value to the database, causing the constraint violation.

## Solution Options

### ✅ OPTION 1: Make Subject Optional in Database (RECOMMENDED)
Run the SQL script: `FIX-SUBJECT-CONSTRAINT.sql`

This allows the subject field to be NULL, making it optional.

### ✅ OPTION 2: Fix the Application Code
Update `app.js` to provide a default subject value.

### ✅ OPTION 3: Both (Best Solution)
Do both for maximum robustness!

---

## Quick Fix Steps

### Step 1: Run Database Fix
Execute this in Supabase SQL Editor:

```sql
-- Drop the existing constraint
ALTER TABLE notes DROP CONSTRAINT IF EXISTS notes_subject_check;

-- Recreate to allow NULL
ALTER TABLE notes 
ADD CONSTRAINT notes_subject_check 
CHECK (
    subject IS NULL 
    OR subject IN (
        'Mathematics', 
        'Physics', 
        'Chemistry', 
        'Biology', 
        'Computer Science', 
        'English', 
        'History', 
        'Geography', 
        'Economics', 
        'Other'
    )
);
```

### Step 2: Update app.js (Line 867)
Change:
```javascript
subject: subject || this.currentUser.subject
```

To:
```javascript
subject: subject || this.currentUser.subject || 'Other'
```

This ensures there's always a valid subject value.

---

## Test After Fix

1. **Login as a teacher**
2. **Try uploading a note** without selecting a subject
3. **Verify** it uploads successfully
4. **Check** that students in the same section can see it

---

## Additional Checks

### Verify Current Teacher Profile Has Subject
Run in Supabase SQL Editor:
```sql
SELECT id, name, email, role, section, subject 
FROM users 
WHERE role = 'teacher';
```

If subject is NULL for your teacher account, update it:
```sql
UPDATE users 
SET subject = 'Computer Science'  -- or your preferred subject
WHERE email = 'your-teacher-email@example.com';
```

---

## Prevention

To prevent this in the future:

1. **Make subject selection REQUIRED** in the registration form for teachers
2. **Add default value** in the database:
   ```sql
   ALTER TABLE notes ALTER COLUMN subject SET DEFAULT 'Other';
   ```

3. **Add validation** in the upload form to ensure subject is selected

---

## Files Modified
- ✅ Created: `FIX-SUBJECT-CONSTRAINT.sql` (Database fix)
- 📝 To modify: `app.js` line 867 (Application fix)

## Priority
🔴 **HIGH** - This blocks note uploads for teachers

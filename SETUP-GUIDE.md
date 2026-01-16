# 🚀 EDUBRIDGE - Quick Setup Guide

## ✅ What's Been Done

### Files Cleaned Up
- Removed **43 unwanted documentation files**
- **Kept only 8 essential files**:
  - `index.html` - Main application
  - `styles.css` - Styles
  - `app.js` - Application logic
  - `ai-config.js` - AI configuration
  - `supabase-config.js` - Database credentials
  - `supabase-storage.js` - Cloud storage handler
  - `supabase-section-subject-schema.sql` - Database schema
  - `README.md` - Project info
  - `SETUP-GUIDE.md` - This file

---

## 🔧fix the Database Connection Error

### Step 1: Check Supabase Database Setup

Your Supabase credentials are already configured:
- **URL**: `https://vawblwlvnwwajmdxhryz.supabase.co`
- **API Key**: Configured ✅

### Step 2: Create Database Tables

**Go to Supabase Dashboard → SQL Editor**

URL: https://supabase.com/dashboard/project/vawblwlvnwwajmdxhryz/sql

**Run this SQL script**: `supabase-section-subject-schema.sql`

1. Open the file `supabase-section-subject-schema.sql`
2. Copy ALL the contents
3. Paste into Supabase SQL Editor
4. Click **RUN**

This will create:
- `users` table (with section & subject fields)
- `notes` table
- `attendance` table
- `messages` table
- Row Level Security (RLS) policies

### Step 3: Create Storage Bucket

**Go to Supabase Dashboard → Storage**

URL: https://supabase.com/dashboard/project/vawblwlvnwwajmdxhryz/storage/buckets

1. Click **"New bucket"**
2. Name: `notes-files`
3. **Make it PUBLIC** ✓
4. Click **Create bucket**

---

## 🧪 Test the Application

### Option 1: Live Server (Recommended)
```powershell
# If you have Python installed:
python -m http.server 8000

# OR if you have Node.js installed:
npx http-server -p 8000

# Then open: http://localhost:8000
```

### Option 2: VS Code Live Server
1. Install "Live Server" extension in VS Code
2. Right-click `index.html`
3. Click "Open with Live Server"

---

## 📊 How to Check if Database is Working

### Open Browser Console (F12)

**Expected SUCCESS Output**:
```
✅ Supabase initialized successfully!
✅ Cloud storage enabled (Supabase)
```

**If you see ERRORS like**:
```
❌ relation "users" does not exist
```
→ **You need to run the SQL script** (see Step 2 above)

---

## 🎓 How to Use the App

### 1. Register a New Account
- Choose role: **Student** or **Teacher**
- Fill in details
- **Select section** (A-N)
- **Teachers must select a subject**
- Click "Create Account"

### 2. Login
- Enter email & password
- Click "Sign In"

### 3. Features
- **📚 Notes**: Upload/view study materials (teachers can upload, students can download)
- **✅ Attendance**: Teachers generate codes, students submit
- **💬 Communication**: Chat between teachers and students
- **🤖 AI Agent**: Get help from AI assistant

---

## ❌ Common Errors & Fixes

### Error: "Database connection error"
**Fix**: Run the SQL schema script in Supabase

### Error: "User profile not found"
**Fix**: The `users` table doesn't exist. Run SQL script.

### Error: "Storage bucket not found"
**Fix**: Create `notes-files` bucket in Supabase Storage

### Error: "Row Level Security policy violation"
**Fix**: SQL script includes RLS policies. Re-run it completely.

---

## 🔑 Section & Subject System

### Sections (A-N)
- All users must select a section
- 14 sections available: A, B, C, D, E, F, G, H, I, J, K, L, M, N

### Subjects (Teachers Only)
- Mathematics
- Physics
- Chemistry
- Biology
- Computer Science
- English
- History
- Geography
- Economics
- Other

### Access Control
- Students see notes only for their section
- Teachers upload notes for their subject in their section
- Communication is section-specific within subjects

---

## 🆘 Need Help?

1. **Check browser console** (F12) for error messages
2. **Verify Supabase setup**:
   - Tables created?
   - Storage bucket exists?
   - RLS policies enabled?
3. **Test with a simple registration** first

---

## 📝 Project Structure

```
EDUBRIDGE2/
├── index.html              # Main HTML file
├── styles.css              # All styles & animations
├── app.js                  # Main application logic
├── ai-config.js            # AI provider configuration
├── supabase-config.js      # Database credentials
├── supabase-storage.js     # Cloud storage manager
├── supabase-section-subject-schema.sql  # Database setup
└── README.md               # Project documentation
```

---

**Last Updated**: January 2026
**Status**: ✅ Ready for deployment after database setup

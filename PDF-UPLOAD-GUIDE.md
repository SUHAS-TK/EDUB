# 📁 PDF Upload Setup Guide

## ✅ What's Been Updated

Your app now supports **BOTH**:
1. **Upload real PDF files** → Stored in Supabase Cloud Storage
2. **Paste Google Drive URLs** → Direct links to Google Drive files

---

## 🚀 Setup Steps (IMPORTANT!)

### **Step 1: Create Storage Bucket in Supabase**

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**: `vawblwlvnwwajmdxhryz`
3. **Click "Storage"** in the left sidebar
4. **Click "New bucket"** button
5. **Fill in:**
   - **Name**: `notes-files`
   - **Public bucket**: ✅ **CHECK THIS** (so students can download files)
6. **Click "Create bucket"**

---

### **Step 2: Set Up Storage Policies (Optional but Recommended)**

1. **Open SQL Editor** in Supabase
2. **Run this SQL**:

```sql
-- Allow authenticated users to upload files
CREATE POLICY IF NOT EXISTS "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'notes-files');

-- Allow everyone to download files
CREATE POLICY IF NOT EXISTS "Allow public downloads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'notes-files');
```

---

### **Step 3: Fix the Database Constraint (If not done yet)**

**Run this SQL** in Supabase SQL Editor:

```sql
ALTER TABLE notes DROP CONSTRAINT IF EXISTS notes_subject_check;
ALTER TABLE notes DROP CONSTRAINT IF EXISTS notes_section_check;
ALTER TABLE notes ALTER COLUMN subject SET DEFAULT 'Other';
ALTER TABLE notes ALTER COLUMN section SET DEFAULT 'A';
ALTER TABLE notes ALTER COLUMN subject DROP NOT NULL;
ALTER TABLE notes ALTER COLUMN section DROP NOT NULL;

SELECT '✅ FIXED!' as status;
```

---

## 📤 How to Use

### **For Teachers:**

#### **Option 1: Upload PDF File**
1. Click "Notes" in dashboard
2. Click "Upload Note"
3. Fill in:
   - Title
   - Subject (optional)
   - Description (optional)
4. **Click "Choose File"** and select a PDF
5. Click "Upload"
   
✅ The PDF will be uploaded to Supabase Cloud Storage and students can download it!

#### **Option 2: Use Google Drive URL**
1. Upload your PDF to Google Drive
2. Right-click → Get link → Make sure it's "Anyone with the link"
3. Copy the link
4. In EDUBRIDGE:
   - Fill in title, subject, description
   - **Paste the Google Drive link** in "Drive URL" field
   - Click "Upload"

✅ Students will be able to click the link and view the file on Google Drive!

---

### **For Students:**

1. Click "Notes" in dashboard
2. See all notes uploaded by teachers in your section
3. Click "Download" or "View" to access the PDF
   - If uploaded to Supabase: Opens the PDF directly
   - If Google Drive link: Opens Google Drive

---

## 🔍 How It Works

### **When a teacher uploads a PDF:**
1. File is uploaded to Supabase Storage bucket: `notes-files`
2. File path: `notes/{teacher-id}/{timestamp}_{filename}.pdf`
3. Public URL is generated (e.g., `https://...supabase.co/storage/v1/object/public/notes-files/...`)
4. URL is saved in the database

### **When a teacher pastes a Google Drive URL:**
1. The URL is saved directly to the database
2. No file upload happens
3. Students click the link and go to Google Drive

---

## ✅ Checklist

Before testing, make sure:

- [ ] Created the `notes-files` bucket in Supabase Storage
- [ ] Made the bucket **PUBLIC** ✅
- [ ] Ran the constraint fix SQL (if upload errors happen)
- [ ] Refreshed your EDUBRIDGE app
- [ ] Logged in as a teacher

---

## 🧪 Test It!

1. **Login as a teacher**
2. **Click "Notes"**
3. **Try uploading a small PDF file**
4. **Check the browser console** (F12) for upload progress
5. **You should see**:
   ```
   📁 Uploading to path: notes/...
   ✅ File uploaded to storage
   🔗 Public URL: https://...
   ✅ PDF uploaded!
   ```
6. **Click the uploaded note** to verify the download link works!

---

## 🆘 Troubleshooting

### **Error: "Bucket not found"**
➡️ Create the `notes-files` bucket in Supabase Storage (Step 1)

### **Error: "new row violates check constraint"**
➡️ Run the constraint fix SQL (Step 3)

### **File uploads but gives 404 when downloading**
➡️ Make sure the bucket is set to **PUBLIC** in Supabase Storage settings

### **Still having issues?**
➡️ Check browser console (F12) and send me the error message!

---

## 📝 Files Updated

- ✅ `app.js` - Added real PDF upload to Supabase Storage
- ✅ `SETUP-STORAGE.sql` - Storage policies setup
- ✅ `PDF-UPLOAD-GUIDE.md` - This guide!

---

## 🎉 That's It!

Once you create the bucket, you can upload PDF files and they'll be stored securely in Supabase Cloud! Students can download them directly from the app! 🚀

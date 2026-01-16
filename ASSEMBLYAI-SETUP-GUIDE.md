# 🎙️ AssemblyAI Setup Guide for EDUBRIDGE

## 🚀 What is AssemblyAI?

AssemblyAI is a powerful AI service that provides:
- **Automatic Speech-to-Text** transcription
- **Speaker Diarization** (identify different speakers)
- **Automatic Summarization** of lectures
- **Sentiment Analysis** on voice content
- **Real-time Captions** for live lectures
- **Content Safety** detection
- **99+ Language Support**

---

## ✨ Features for EDUBRIDGE

### **For Teachers:**
1. 📹 **Record Lectures** → Get automatic transcriptions with chapter breaks
2. 🎯 **Speaker Identification** → Know who said what in group discussions
3. 📝 **Auto-Summary** → Get bullet-point summaries of long lectures
4. 🔴 **Live Captions** → Real-time captions during live teaching

### **For Students:**
1. 🎤 **Voice Assignments** → Submit assignments via voice instead of text
2. 📚 **Lecture Notes** → Automatic notes from recorded lectures
3. 🌍 **Multi-language Support** → Transcribe in any language
4. ♿ **Accessibility** → Captions for hearing-impaired students

---

## 🔧 Setup Instructions

### **Step 1: Get Your FREE API Key**

1. Go to: **https://www.assemblyai.com/**
2. Click **"Sign Up Free"**
3. Create an account (GitHub/Google/Email)
4. Go to Dashboard → **"API Keys"**
5. Copy your API key

**Free Tier Includes:**
- ✅ 5 hours of transcription per month
- ✅ All AI features (summarization, sentiment, etc.)
- ✅ No credit card required

---

### **Step 2: Add API Key to EDUBRIDGE**

1. Open file: `assemblyai-config.js`
2. Find this line:
   ```javascript
   apiKey: '', // 👈 PASTE YOUR ASSEMBLYAI API KEY HERE
   ```
3. Paste your API key:
   ```javascript
   apiKey: 'YOUR_ASSEMBLYAI_API_KEY_HERE',
   ```
4. Save the file

---

### **Step 3: Add to Your Website**

Open `index.html` and add this line **before** `</body>`:

```html
<!-- AssemblyAI Integration -->
<script src="assemblyai-config.js"></script>
```

It should look like this:
```html
    <!-- Supabase Configuration -->
    <script src="supabase-config.js"></script>
    <script src="supabase-storage.js"></script>

    <!-- AI Configuration -->
    <script src="ai-config.js"></script>
    
    <!-- NEW: AssemblyAI Integration -->
    <script src="assemblyai-config.js"></script>

    <!-- Application Scripts -->
    <script src="app.js"></script>
</body>
```

---

## 🎯 How to Use AssemblyAI in EDUBRIDGE

### **Feature 1: Transcribe Lecture Recording**

```javascript
// Example: Add a "Record Lecture" button for teachers
async function recordLecture(audioFile) {
    try {
        // Show loading
        showNotification('Transcribing lecture...', 'info');
        
        // Transcribe with chapters and summary
        const result = await assemblyAI.transcribeLecture(audioFile);
        
        // Display results
        console.log('Transcription:', result.text);
        console.log('Chapters:', result.chapters);
        console.log('Summary:', result.summary);
        
        // Save to database
        saveToNotes(result);
        
    } catch (error) {
        showNotification(`Error: ${error.message}`, 'error');
    }
}
```

### **Feature 2: Student Voice Assignment**

```javascript
// Example: Students can submit voice assignments
async function submitVoiceAssignment(audioFile) {
    try {
        showNotification('Processing your voice assignment...', 'info');
        
        const result = await assemblyAI.transcribeAssignment(audioFile);
        
        // Show transcription
        console.log('Your answer:', result.text);
        console.log('Sentiment:', result.sentiment_analysis_results);
        
        // Submit to teacher
        submitAssignment(result);
        
    } catch (error) {
        showNotification(`Error: ${error.message}`, 'error');
    }
}
```

### **Feature 3: Real-time Live Captions**

```javascript
// Example: Live captions during video lectures
async function startLiveCaptions() {
    try {
        const socket = await assemblyAI.createRealtimeTranscriber(
            (transcript) => {
                // Display caption in real-time
                document.getElementById('live-caption').textContent = transcript.text;
            },
            (error) => {
                console.error('Caption error:', error);
            }
        );
        
        // Connect microphone
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // ... send audio to socket
        
    } catch (error) {
        console.error('Error:', error);
    }
}
```

---

## 📊 Response Format

After transcription, you'll get:

```json
{
  "id": "transcript_id",
  "status": "completed",
  "text": "Full transcription text here...",
  
  // Speaker identification
  "utterances": [
    {
      "speaker": "A",
      "text": "Hello class, today we will..."
    },
    {
      "speaker": "B", 
      "text": "Teacher, can you explain..."
    }
  ],
  
  // Auto-generated chapters
  "chapters": [
    {
      "summary": "Introduction to the topic",
      "headline": "Chapter 1: Introduction",
      "gist": "Overview of the lecture topic"
    }
  ],
  
  // Summary
  "summary": "This lecture covered...",
  
  // Sentiment per sentence
  "sentiment_analysis_results": [
    {
      "text": "I love this subject!",
      "sentiment": "POSITIVE",
      "confidence": 0.92
    }
  ],
  
  // Detected entities
  "entities": [
    {
      "text": "Albert Einstein",
      "entity_type": "person"
    }
  ]
}
```

---

## 🎨 UI Integration Ideas

### **Add to Notes Panel:**

```javascript
// Add "Record Lecture" button
<button onclick="recordLecture()">
    🎙️ Record \u0026 Transcribe Lecture
</button>
```

### **Add to Attendance Panel:**

```javascript
// Voice-based attendance
<button onclick="submitVoiceAttendance()">
    🎤 Say "Present" (Voice Attendance)
</button>
```

### **Add to AI Agent Panel:**

```javascript
// Voice chat with AI
<button onclick="startVoiceChat()">
    🗣️ Talk to AI Assistant
</button>
```

---

## 🔒 Security \u0026 Best Practices

### **⚠️ IMPORTANT: Protect Your API Key**

**For Production/Hosting:**
```javascript
// DON'T expose API key in frontend!
// Use a backend proxy instead:

// Backend (Node.js/Python):
app.post('/api/transcribe', async (req, res) => {
    const result = await assemblyai.transcribe(req.body.audioURL);
    res.json(result);
});

// Frontend:
fetch('/api/transcribe', {
    method: 'POST',
    body: JSON.stringify({ audioURL: url })
});
```

### **Free Tier Limits:**
- ⏱️ 5 hours transcription/month
- 📊 Monitor usage in AssemblyAI dashboard
- 💰 Consider paid plan for production ($0.00025/second)

---

## 🎯 Sample Use Cases

### **1. Lecture Archive System**
- Teachers record lectures
- Auto-transcribe + summarize
- Students search by keywords
- Download as PDF notes

### **2. Voice-Based Quiz**
- Students speak answers
- AI transcribes automatically
- Teacher reviews text responses

### **3. Accessibility Features**
- Live captions for deaf students
- Multi-language translation
- Text-to-speech for blind students

### **4. Parent-Teacher Conferences**
- Record meetings
- Get transcripts + action items
- Email summary to parents

---

## 🧪 Testing AssemblyAI

### **Test in Browser Console:**

```javascript
// 1. Check if configured
console.log('Configured:', assemblyAI.isConfigured());

// 2. Test with demo audio URL
const demoURL = 'https://bit.ly/3yxKEIY'; // AssemblyAI demo audio

assemblyAI.transcribe(demoURL)
    .then(id => {
        console.log('Transcript ID:', id);
        return assemblyAI.waitForCompletion(id);
    })
    .then(result => {
        console.log('Result:', result.text);
    })
    .catch(error => {
        console.error('Error:', error);
    });
```

---

## 📦 Integration Checklist

Before going live, ensure:

- [ ] ✅ AssemblyAI API key added to `assemblyai-config.js`
- [ ] ✅ Script tag added to `index.html`
- [ ] ✅ Tested with sample audio file
- [ ] ✅ UI buttons added for recording
- [ ] ✅ Error handling implemented
- [ ] ✅ User notifications showing progress
- [ ] ⚠️ For production: Move API key to backend

---

## 🚀 Next Steps

1. **Add Recording UI**
   - Create buttons for voice recording
   - Show progress indicators
   - Display transcription results

2. **Store Transcriptions**
   - Save to Supabase database
   - Link to notes/assignments
   - Enable search functionality

3. **Advanced Features**
   - Real-time captions in video calls
   - Multi-speaker detection in group discussions
   - Automatic meeting minutes

4. **Mobile App**
   - Use device microphone
   - Record on-the-go
   - Offline queuing for later upload

---

## 🆘 Troubleshooting

### **Error: "API key not configured"**
→ Make sure you pasted your API key in `assemblyai-config.js`

### **Error: "Upload failed"**
→ Check file format (supported: mp3, mp4, wav, flac, etc.)

### **Error: "Transcription timeout"**
→ Large files take time. Increase `maxRetries` parameter

### **No results after 5 minutes**
→ Check AssemblyAI dashboard for quota/errors

---

## 📚 Resources

- **Official Docs**: https://www.assemblyai.com/docs
- **API Reference**: https://www.assemblyai.com/docs/api-reference
- **Dashboard**: https://www.assemblyai.com/app
- **Supported Formats**: WAV, MP3, MP4, FLAC, AAC, OGG, WebM

---

## ✅ **You're Ready!**

AssemblyAI is now integrated into EDUBRIDGE! 🎉

Start by:
1. ✅ Getting your API key
2. ✅ Adding it to the config file
3. ✅ Testing with a sample audio
4. ✅ Building awesome voice features!

**Happy Building!** 🚀

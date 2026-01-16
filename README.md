# 📚 EDUBRIDGE - Educational Platform

**Empowering Education, Connecting Minds**

EDUBRIDGE is a modern, full-featured educational web application that connects teachers and students with powerful features including note sharing, attendance management, real-time communication, and AI-powered assistance.

---

## ✨ Features

### 🎨 **Premium Design**
- Stunning startup animation with floating particles
- Modern glassmorphism UI with smooth transitions
- Responsive design for all devices
- Dark theme with vibrant gradient accents
- Interactive micro-animations throughout

### 🔐 **Authentication System**
- Secure registration and login
- Separate portals for Students and Teachers
- Email and password authentication
- Session persistence with localStorage

### 📝 **Notes Management**
- **Teachers**: Upload study materials with title, subject, and description
- **Students**: Browse and download notes
- File metadata tracking
- Ready for Google Cloud Storage integration

### ✅ **Attendance System**
- **Teachers**: 
  - Generate time-limited attendance codes
  - Set custom expiration time (in seconds)
  - Real-time countdown timer
  - View all attendance records
  - Download attendance as CSV/Excel
- **Students**: 
  - Submit attendance with name, roll number, and code
  - View personal attendance history
  - Instant validation

### 💬 **Communication**
- Real-time messaging between teachers and students
- Message history with timestamps
- Clean, modern chat interface

### 🤖 **AI Learning Assistant**
- Interactive AI chatbot
- Answers student questions
- Provides study guidance
- Available 24/7

---

## 🚀 Getting Started

### **Quick Start (Local)**

1. **Open the project folder**:
   ```bash
   cd EDUBRIDGE2
   ```

2. **Run with a local server**:
   
   **Option A - Python**:
   ```bash
   python -m http.server 8000
   ```
   
   **Option B - Node.js**:
   ```bash
   npx serve
   ```
   
   **Option C - PHP**:
   ```bash
   php -S localhost:8000
   ```

3. **Open in browser**:
   ```
   http://localhost:8000
   ```

4. **Create an account**:
   - Select Student or Teacher role
   - Click "Create Account"
   - Fill in your details
   - Login and explore!

---

## 📂 Project Structure

```
EDUBRIDGE2/
├── index.html          # Main HTML structure
├── styles.css          # Complete styling & animations
├── app.js              # Application logic & features
├── README.md           # This file
└── cloud-setup.md      # Google Cloud Storage setup guide
```

---

## 🎯 How to Use

### **For Teachers**

1. **Register/Login** as Teacher
2. **Upload Notes**: 
   - Click on "Notes" card
   - Fill in title, subject, description
   - Upload file (simulated for now)
3. **Manage Attendance**:
   - Click on "Attendance" card
   - Set duration (e.g., 60 seconds)
   - Click "Generate Code"
   - Share code with students
   - Watch countdown and download records
4. **Communicate**: Send messages to students
5. **AI Assistant**: Get teaching insights

### **For Students**

1. **Register/Login** as Student
2. **View Notes**:
   - Click on "Notes" card
   - Browse available materials
   - Click "Download" to save
3. **Submit Attendance**:
   - Click on "Attendance" card
   - Enter your name and roll number
   - Paste the code from teacher
   - Submit before timer expires
4. **Communicate**: Chat with teachers
5. **AI Assistant**: Ask questions about your studies

---

## 💾 Data Storage

### **Current Storage (Demo)**
- Uses browser `localStorage`
- Data persists locally
- No backend required for testing

### **Production Storage (Cloud)**
For production deployment with Google Cloud Storage:
1. See `cloud-setup.md` for detailed setup
2. Integrate Google Cloud Storage API
3. Enable Google OAuth for teachers
4. Configure bucket permissions

---

## 🌐 Deployment Options

### **Free Hosting Platforms**

1. **GitHub Pages**:
   ```bash
   # Push to GitHub
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin YOUR_REPO_URL
   git push -u origin main
   
   # Enable Pages in Settings → Pages → Source: main branch
   ```

2. **Netlify**:
   - Drag and drop the folder to netlify.com/drop
   - Or connect GitHub repo for auto-deployment

3. **Vercel**:
   ```bash
   npx vercel
   ```

4. **Firebase Hosting**:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init hosting
   firebase deploy
   ```

---

## 🔧 Customization

### **Colors**
Edit CSS variables in `styles.css`:
```css
:root {
    --primary: hsl(240, 100%, 65%);
    --secondary: hsl(280, 100%, 65%);
    /* ... more colors */
}
```

### **Animations**
Adjust timing in `styles.css`:
```css
--transition-fast: 0.2s;
--transition-base: 0.3s;
--transition-slow: 0.5s;
```

### **Features**
Modify or add features in `app.js` by extending the `EdubridgeApp` class.

---

## 📱 Converting to Mobile App (APK)

### **Using Cordova**:
```bash
# Install Cordova
npm install -g cordova

# Create project
cordova create edubridge-mobile com.edubridge.app EDUBRIDGE
cd edubridge-mobile

# Add Android platform
cordova platform add android

# Copy web files to www/
# Build APK
cordova build android
```

### **Using Capacitor**:
```bash
# Install Capacitor
npm install @capacitor/core @capacitor/cli

# Initialize
npx cap init

# Add Android
npx cap add android

# Sync files
npx cap sync

# Open in Android Studio
npx cap open android
```

### **Using PWA (Progressive Web App)**:
Add a manifest file and service worker to make it installable on mobile devices without app stores.

---

## 🔒 Security Notes

**For Production**:
- Replace localStorage with secure backend database
- Implement proper password hashing (bcrypt)
- Add JWT tokens for authentication
- Enable HTTPS
- Sanitize all user inputs
- Implement rate limiting
- Add CORS policies

---

## 🌟 Future Enhancements

- [ ] Real backend with Node.js/Firebase
- [ ] Actual Google Cloud Storage integration
- [ ] Video conferencing for live classes
- [ ] Assignment submission system
- [ ] Grade management
- [ ] Calendar and schedule
- [ ] Push notifications
- [ ] Multi-language support
- [ ] Advanced AI with actual model integration

---

## 💡 Tips

1. **Testing**: Create both student and teacher accounts to test all features
2. **Attendance**: Try different code durations to see the timer in action
3. **Notes**: Upload various types of files to test the system
4. **Communication**: Send messages between different accounts (use different browsers)

---

## 📞 Support

For issues or questions:
- Check the code comments for detailed explanations
- Review the browser console for any errors
- Ensure localStorage is enabled in your browser

---

## 📄 License

This project is free to use for educational purposes.

---

## 🎉 Acknowledgments

Built with modern web technologies:
- HTML5
- CSS3 (with custom properties)
- Vanilla JavaScript (ES6+)
- Google Fonts (Inter & Poppins)
- SVG icons

---

**Made with ❤️ for Education**

*Empowering students and teachers worldwide*

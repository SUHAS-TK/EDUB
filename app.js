// ==========================================
// EDUBRIDGE - Main Application Logic
// ==========================================

class EdubridgeApp {
    constructor() {
        this.currentUser = null;
        this.currentRole = null;
        this.users = this.loadFromStorage('edubridge_users') || {};
        this.notes = this.loadFromStorage('edubridge_notes') || [];
        this.attendance = this.loadFromStorage('edubridge_attendance') || [];
        this.messages = this.loadFromStorage('edubridge_messages') || [];
        this.activeAttendanceCode = null;
        this.currentChannel = 'students'; // Default to students channel
        this.selectedRecipient = null; // For private messaging
        this.messageMode = 'private'; // Default to PRIVATE mode
        this.availableUsers = []; // List of users for private messaging

        // NEW: Announcements, Calendar & Notifications
        this.announcements = this.loadFromStorage('edubridge_announcements') || [];
        this.calendarEvents = this.loadFromStorage('edubridge_calendar') || [];
        this.notifications = this.loadFromStorage('edubridge_notifications') || [];
        this.currentCalendarMonth = new Date().getMonth();
        this.currentCalendarYear = new Date().getFullYear();

        this.init();
    }

    // Switch between student and teacher communication channels
    switchChannel(channel) {
        this.currentChannel = channel;

        // Update button styles
        const studentsBtn = document.getElementById('students-channel-btn');
        const teachersBtn = document.getElementById('teachers-channel-btn');

        if (channel === 'students') {
            if (studentsBtn) studentsBtn.style.background = 'var(--gradient-primary)';
            if (teachersBtn) teachersBtn.style.background = 'var(--bg-secondary)';
        } else {
            if (studentsBtn) studentsBtn.style.background = 'var(--bg-secondary)';
            if (teachersBtn) teachersBtn.style.background = 'var(--gradient-primary)';
        }

        // Refresh messages
        document.getElementById('messages-container').innerHTML = this.renderMessages();
    }

    init() {
        // Initialize Supabase cloud storage
        if (typeof initializeSupabase === 'function') {
            initializeSupabase();
        }

        // Show "Get Started" button after animation
        setTimeout(() => {
            const btn = document.getElementById('get-started-btn');
            if (btn) {
                // Show the button
                btn.classList.add('show');
                btn.classList.remove('hidden-btn');

                // Handle click
                btn.onclick = () => {
                    const startupScreen = document.getElementById('startup-animation');

                    // Add hidden class to trigger CSS transition
                    startupScreen.classList.add('hidden');

                    // Allow transition to finish before hiding display
                    setTimeout(() => {
                        startupScreen.style.display = 'none';
                        document.getElementById('login-screen').classList.remove('hidden');
                    }, 500);
                };
            }
        }, 3500);

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Role selection
        document.querySelectorAll('.role-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentRole = btn.dataset.role;

                // Show/hide subject selection based on role
                const subjectField = document.getElementById('subject-selection');
                const subjectSelect = document.getElementById('register-subject');

                if (this.currentRole === 'teacher') {
                    subjectField.style.display = 'block';
                    subjectSelect.required = true;
                } else {
                    subjectField.style.display = 'none';
                    subjectSelect.required = false;
                }
            });
        });

        // Auth form switching
        document.getElementById('show-register').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('login-form-container').classList.remove('active');
            document.getElementById('register-form-container').classList.add('active');
        });

        document.getElementById('show-login').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('register-form-container').classList.remove('active');
            document.getElementById('login-form-container').classList.add('active');
        });

        // Form submissions
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('register-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.handleLogout();
        });

        // Feature cards
        document.querySelectorAll('.feature-card').forEach(card => {
            card.addEventListener('click', () => {
                const feature = card.dataset.feature;
                this.openFeature(feature);
            });
        });
    }

    async handleRegister() {
        if (!this.currentRole) {
            this.showNotification('Please select a role (Student or Teacher)', 'error');
            return;
        }

        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        const section = document.getElementById('register-section').value;
        const subject = document.getElementById('register-subject').value;

        // Validate inputs
        if (!name || !email || !password || !confirmPassword) {
            this.showNotification('Please fill in all fields', 'error');
            return;
        }

        if (!section) {
            this.showNotification('Please select your section', 'error');
            return;
        }

        // Validate subject for teachers
        if (this.currentRole === 'teacher' && !subject) {
            this.showNotification('Teachers must select a subject', 'error');
            return;
        }

        if (password.length < 6) {
            this.showNotification('Password must be at least 6 characters long', 'error');
            return;
        }

        if (password !== confirmPassword) {
            this.showNotification('Passwords do not match', 'error');
            return;
        }

        // Use Supabase if available, otherwise fallback to localStorage
        if (supabaseClient) {
            try {
                console.log('📝 Registering user:', email, '| Section:', section, '| Subject:', subject || 'N/A');

                // Register with Supabase Auth
                const { data: authData, error: authError } = await supabaseClient.auth.signUp({
                    email: email,
                    password: password,
                    options: {
                        data: {
                            name: name,
                            role: this.currentRole,
                            section: section,
                            subject: this.currentRole === 'teacher' ? subject : null
                        }
                    }
                });

                if (authError) {
                    console.error('Auth error:', authError);

                    // Provide specific error messages
                    if (authError.message.includes('already registered')) {
                        this.showNotification('❌ This email is already registered. Please login instead.', 'error');
                    } else if (authError.message.includes('Invalid email')) {
                        this.showNotification('❌ Please enter a valid email address.', 'error');
                    } else {
                        this.showNotification('Registration failed: ' + authError.message, 'error');
                    }
                    return;
                }

                console.log('✅ Auth user created:', authData.user.id);

                // Create user profile in database with section and subject
                const profileData = {
                    id: authData.user.id,
                    email: email,
                    name: name,
                    role: this.currentRole,
                    section: section
                };

                // Add subject only for teachers
                if (this.currentRole === 'teacher') {
                    profileData.subject = subject;
                }

                const { error: profileError } = await supabaseClient
                    .from('users')
                    .insert([profileData]);

                if (profileError) {
                    console.error('Profile creation error:', profileError);

                    // Detailed error handling
                    if (profileError.code === '23505') {
                        console.warn('⚠️ Profile already exists (duplicate key)');
                    } else if (profileError.message.includes('row-level security')) {
                        this.showNotification('❌ Database permission error. Please contact support.', 'error');
                        return;
                    } else {
                        console.warn('Profile creation had an error but continuing:', profileError.message);
                    }
                }

                console.log('✅ User profile created successfully');
                console.log('📍 Section:', section, '| Subject:', subject || 'Student (no subject)');

                // Check if email confirmation is required
                if (authData.user && authData.user.email_confirmed_at) {
                    this.showNotification(`✅ Account created! Section ${section}. You can login now.`, 'success');
                } else {
                    this.showNotification(`✅ Account created! Section ${section}. Please check your email to verify (or you can login directly if verification is disabled).`, 'success');
                }

            } catch (error) {
                console.error('Registration error:', error);
                this.showNotification('❌ Registration failed. Please try again.', 'error');
                return;
            }
        } else {
            // Fallback to localStorage
            console.log('Using localStorage registration');

            if (this.users[email]) {
                this.showNotification('❌ Email already registered. Please login instead.', 'error');
                return;
            }

            const userData = {
                name,
                email,
                password,
                role: this.currentRole,
                section: section
            };

            // Add subject for teachers
            if (this.currentRole === 'teacher') {
                userData.subject = subject;
            }

            this.users[email] = userData;

            this.saveToStorage('edubridge_users', this.users);
            this.showNotification(`✅ Account created successfully! Section ${section}. Please login.`, 'success');
        }

        // Switch to login form
        document.getElementById('register-form-container').classList.remove('active');
        document.getElementById('login-form-container').classList.add('active');
        document.getElementById('register-form').reset();
    }

    async handleLogin() {
        if (!this.currentRole) {
            this.showNotification('Please select a role (Student or Teacher)', 'error');
            return;
        }

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        // Validate input
        if (!email || !password) {
            this.showNotification('Please enter both email and password', 'error');
            return;
        }

        // Use Supabase if available, otherwise fallback to localStorage
        if (supabaseClient) {
            try {
                console.log('🔐 Attempting login for:', email);

                // Login with Supabase Auth
                const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
                    email: email,
                    password: password,
                });

                if (authError) {
                    console.error('Auth error:', authError);

                    // Provide specific error messages
                    if (authError.message.includes('Invalid login credentials')) {
                        this.showNotification('❌ Invalid email or password. Please check and try again.', 'error');
                    } else if (authError.message.includes('Email not confirmed')) {
                        this.showNotification('📧 Please verify your email first. Check your inbox for confirmation link.', 'error');
                    } else if (authError.message.includes('User not found')) {
                        this.showNotification('❌ No account found with this email. Please register first.', 'error');
                    } else {
                        this.showNotification('Login failed: ' + authError.message, 'error');
                    }
                    return;
                }

                console.log('✅ Authentication successful');

                // Check if user is confirmed (if email confirmation is enabled)
                if (authData.user && !authData.user.email_confirmed_at) {
                    console.warn('⚠️ Email not confirmed');
                    this.showNotification('📧 Please verify your email. Check your inbox for confirmation link.', 'error');
                    await supabaseClient.auth.signOut();
                    return;
                }

                // Get user profile from database
                console.log('📊 Fetching user profile...');
                const { data: profileData, error: profileError } = await supabaseClient
                    .from('users')
                    .select('*')
                    .eq('id', authData.user.id)
                    .single();

                if (profileError) {
                    console.error('Profile fetch error:', profileError);

                    // More detailed error for profile issues
                    if (profileError.code === 'PGRST116') {
                        this.showNotification('❌ User profile not found. Please contact support or re-register.', 'error');
                    } else {
                        this.showNotification('Could not load user profile: ' + profileError.message, 'error');
                    }

                    await supabaseClient.auth.signOut();
                    return;
                }

                if (!profileData) {
                    console.error('No profile data returned');
                    this.showNotification('❌ User profile not found. Please re-register your account.', 'error');
                    await supabaseClient.auth.signOut();
                    return;
                }

                console.log('✅ Profile loaded:', profileData.name);

                // Check if role matches
                if (profileData.role !== this.currentRole) {
                    this.showNotification(`❌ This account is registered as a ${profileData.role}. Please select the correct role.`, 'error');
                    await supabaseClient.auth.signOut();
                    return;
                }

                console.log('🎉 Login successful!');
                this.currentUser = profileData;
                this.showNotification(`Welcome back, ${profileData.name}! 🎉`, 'success');
                this.showDashboard();

            } catch (error) {
                console.error('Login error:', error);
                this.showNotification('❌ Login failed. Please check your connection and try again.', 'error');
            }
        } else {
            // Fallback to localStorage
            console.log('Using localStorage authentication');
            const user = this.users[email];

            if (!user) {
                this.showNotification('❌ User not found. Please register first.', 'error');
                return;
            }

            if (user.password !== password) {
                this.showNotification('❌ Incorrect password. Please try again.', 'error');
                return;
            }

            if (user.role !== this.currentRole) {
                this.showNotification(`❌ This account is registered as a ${user.role}. Please select the correct role.`, 'error');
                return;
            }

            this.currentUser = user;
            this.showNotification(`Welcome back, ${user.name}! 🎉`, 'success');
            this.showDashboard();
        }
    }

    async handleLogout() {
        // Sign out from Supabase if using it
        if (supabaseClient) {
            await supabaseClient.auth.signOut();
        }

        this.currentUser = null;
        this.currentRole = null;
        document.getElementById('dashboard-screen').classList.add('hidden');
        document.getElementById('login-screen').classList.remove('hidden');
        document.getElementById('login-form').reset();
        document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
    }

    showDashboard() {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('dashboard-screen').classList.remove('hidden');
        document.getElementById('user-name').textContent = this.currentUser.name;
        document.getElementById('dashboard-user-name').textContent = this.currentUser.name;
        document.getElementById('dashboard-role-text').textContent =
            this.currentUser.role === 'teacher' ? 'Teacher Dashboard' : 'Student Dashboard';

        // Initialize notification system
        this.updateNotificationBadge();
        this.renderNotificationList();
        this.checkReminders();
    }

    async loadNotesFromSupabase() {
        if (!supabaseClient) {
            console.log('📦 Using localStorage for notes');
            return;
        }

        try {
            console.log('📥 Loading notes from Supabase...');

            const { data, error } = await supabaseClient
                .from('notes')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error loading notes:', error);
                return;
            }

            // Store in this.notes array for rendering
            this.notes = data || [];
            console.log(`✅ Loaded ${this.notes.length} notes (section-filtered by RLS)`);

        } catch (error) {
            console.error('Error loading notes:', error);
        }
    }

    async openFeature(feature) {
        const modalsContainer = document.getElementById('modals-container');

        // 🔥 Load data from Supabase BEFORE showing modals
        if (feature === 'notes' && supabaseClient) {
            await this.loadNotesFromSupabase();
        }

        if (feature === 'communication' && supabaseClient) {
            // ✅ RESET to PRIVATE mode when opening communication (default)
            this.messageMode = 'private';
            this.selectedRecipient = null;

            await this.loadMessagesFromSupabase();
            await this.loadAvailableUsers();
            await this.subscribeToMessages();
        }

        if (feature === 'announcements' && supabaseClient) {
            await this.loadAnnouncementsFromSupabase();
        }

        if (feature === 'calendar' && supabaseClient) {
            await this.loadCalendarEventsFromSupabase();
        }

        switch (feature) {
            case 'notes':
                modalsContainer.innerHTML = this.createNotesModal();
                break;
            case 'attendance':
                modalsContainer.innerHTML = this.createAttendanceModal();
                break;
            case 'communication':
                modalsContainer.innerHTML = this.createCommunicationModal();
                break;
            case 'ai-agent':
                modalsContainer.innerHTML = this.createAIAgentModal();
                break;
            case 'announcements':
                modalsContainer.innerHTML = this.createAnnouncementsModal();
                break;
            case 'calendar':
                modalsContainer.innerHTML = this.createCalendarModal();
                break;
            case 'contact':
                modalsContainer.innerHTML = this.createContactModal();
                break;
        }

        this.setupModalListeners(feature);
    }

    createNotesModal() {
        if (this.currentUser.role === 'teacher') {
            return `
                <div class="modal-overlay">
                    <div class="modal">
                        <div class="modal-header">
                            <h2>📚 Notes Management</h2>
                            <button class="modal-close" onclick="app.closeModal()">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                            </button>
                        </div>
                        <div class="modal-content">
                            <form id="upload-note-form" style="margin-bottom: 2rem;">
                                <div class="form-group">
                                    <label for="note-title">Note Title</label>
                                    <input type="text" id="note-title" required placeholder="e.g., Chapter 1 - Introduction">
                                </div>
                                <div class="form-group">
                                    <label for="note-subject">Subject</label>
                                    <input type="text" id="note-subject" required placeholder="e.g., Mathematics">
                                </div>
                                <div class="form-group">
                                    <label for="note-drive-url">📎 Google Drive URL (Optional)</label>
                                    <input type="url" id="note-drive-url" placeholder="Paste Google Drive share link here (e.g., https://drive.google.com/...)">
                                    <small style="display: block; margin-top: 0.5rem; color: var(--text-secondary); font-size: 0.85rem;">
                                        💡 Tip: Share your file on Google Drive and paste the link here. Students can click to download directly!
                                    </small>
                                </div>
                                <div class="form-group">
                                    <label for="note-file">Upload File (simulated)</label>
                                    <input type="file" id="note-file" accept=".pdf,.doc,.docx,.ppt,.pptx">
                                    <small style="display: block; margin-top: 0.5rem; color: var(--text-secondary); font-size: 0.85rem;">
                                        Or upload a file (for local storage)
                                    </small>
                                </div>
                                <div class="form-group">
                                    <label for="note-description">Description</label>
                                    <textarea id="note-description" rows="3" style="width: 100%; padding: 1rem; background: var(--bg-secondary); border: 2px solid transparent; border-radius: var(--border-radius-sm); color: var(--text-primary); font-family: var(--font-primary); resize: vertical;" placeholder="Brief description of the note"></textarea>
                                </div>
                                <button type="submit" class="btn btn-primary">
                                    <span>Upload Note</span>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                                    </svg>
                                </button>
                            </form>
                            <h3 style="margin-bottom: 1rem;">Your Uploaded Notes</h3>
                            <div id="notes-list">${this.renderNotesList()}</div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="modal-overlay">
                    <div class="modal">
                        <div class="modal-header">
                            <h2>📚 Available Notes</h2>
                            <button class="modal-close" onclick="app.closeModal()">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                            </button>
                        </div>
                        <div class="modal-content">
                            <div id="notes-list">${this.renderNotesList()}</div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    renderNotesList() {
        if (this.notes.length === 0) {
            return '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No notes available yet.</p>';
        }

        return this.notes.map(note => `
            <div style="background: var(--bg-tertiary); padding: 1.5rem; border-radius: var(--border-radius-md); margin-bottom: 1rem; border: 1px solid rgba(255, 255, 255, 0.1);">
                <h4 style="margin-bottom: 0.5rem;">${note.title}</h4>
                <p style="color: var(--text-secondary); margin-bottom: 0.5rem;"><strong>Subject:</strong> ${note.subject}</p>
                <p style="color: var(--text-secondary); margin-bottom: 0.5rem;"><strong>Section:</strong> ${note.section || 'N/A'}</p>
                <p style="color: var(--text-secondary); margin-bottom: 1rem;">${note.description || 'No description'}</p>
                
                ${note.file_url && note.file_url !== 'local-file' && !note.file_url.includes('blob:') ? `
                    <!-- Google Drive Link Button -->
                    <a href="${note.file_url}" target="_blank" class="btn btn-primary" style="width: auto; padding: 0.5rem 1rem; font-size: 0.9rem; text-decoration: none; display: inline-flex; align-items: center; gap: 0.5rem; margin-right: 0.5rem;">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;">
                            <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                        </svg>
                        <span>Open in Google Drive</span>
                    </a>
                ` : ''}
                
                ${note.driveUrl ? `
                    <!-- Legacy Drive URL support -->
                    <a href="${note.driveUrl}" target="_blank" class="btn btn-primary" style="width: auto; padding: 0.5rem 1rem; font-size: 0.9rem; text-decoration: none; display: inline-flex; align-items: center; gap: 0.5rem; margin-right: 0.5rem;">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;">
                            <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                        </svg>
                        <span>Open in Google Drive</span>
                    </a>
                ` : ''}
                
                <button class="btn btn-primary" onclick="app.downloadNote('${note.id}')" style="width: auto; padding: 0.5rem 1rem; font-size: 0.9rem;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;">
                        <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                    </svg>
                    <span>Info</span>
                </button>
            </div>
        `).join('');
    }

    createAttendanceModal() {
        if (this.currentUser.role === 'teacher') {
            return `
                <div class="modal-overlay">
                    <div class="modal">
                        <div class="modal-header">
                            <h2>✅ Attendance Management</h2>
                            <button class="modal-close" onclick="app.closeModal()">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                            </button>
                        </div>
                        <div class="modal-content">
                            <div style="background: var(--bg-tertiary); padding: 2rem; border-radius: var(--border-radius-lg); margin-bottom: 2rem; border: 1px solid rgba(255, 255, 255, 0.1);">
                                <h3 style="margin-bottom: 1rem;">Generate Attendance Code</h3>
                                <div class="form-group">
                                    <label for="code-duration">Code Valid Duration (seconds)</label>
                                    <input type="number" id="code-duration" value="60" min="10" max="600" placeholder="e.g., 60">
                                </div>
                                <button class="btn btn-primary" onclick="app.generateAttendanceCode()">
                                    <span>Generate Code</span>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M12 4v16m8-8H4"/>
                                    </svg>
                                </button>
                                <div id="code-display" style="margin-top: 1.5rem;"></div>
                            </div>
                            
                            <div>
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                                    <h3>Attendance Records</h3>
                                    <button class="btn btn-primary" onclick="app.downloadAttendance()" style="width: auto; padding: 0.5rem 1rem; font-size: 0.9rem;">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;">
                                            <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                                        </svg>
                                        <span>Download Excel</span>
                                    </button>
                                </div>
                                <div id="attendance-list">${this.renderAttendanceList()}</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="modal-overlay">
                    <div class="modal">
                        <div class="modal-header">
                            <h2>✅ Submit Attendance</h2>
                            <button class="modal-close" onclick="app.closeModal()">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                            </button>
                        </div>
                        <div class="modal-content">
                            <form id="submit-attendance-form">
                                <div class="form-group">
                                    <label for="student-name">Your Name</label>
                                    <input type="text" id="student-name" value="${this.currentUser.name}" required>
                                </div>
                                <div class="form-group">
                                    <label for="student-roll">Roll Number</label>
                                    <input type="text" id="student-roll" required placeholder="e.g., CS001">
                                </div>
                                <div class="form-group">
                                    <label for="attendance-code">Attendance Code</label>
                                    <input type="text" id="attendance-code" required placeholder="Enter code from teacher">
                                </div>
                                <button type="submit" class="btn btn-primary">
                                    <span>Submit Attendance</span>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                    </svg>
                                </button>
                            </form>
                            
                            <div style="margin-top: 2rem;">
                                <h3 style="margin-bottom: 1rem;">Your Attendance History</h3>
                                <div>${this.renderStudentAttendance()}</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    renderAttendanceList() {
        if (this.attendance.length === 0) {
            return '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No attendance records yet.</p>';
        }

        return `
            <div style="max-height: 400px; overflow-y: auto;">
                ${this.attendance.map(record => `
                    <div style="background: var(--bg-tertiary); padding: 1rem; border-radius: var(--border-radius-md); margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong>${record.name}</strong> (${record.roll})
                        </div>
                        <div style="color: var(--text-secondary); font-size: 0.9rem;">
                            ${new Date(record.timestamp).toLocaleString()}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderStudentAttendance() {
        const studentAttendance = this.attendance.filter(
            record => record.email === this.currentUser.email
        );

        if (studentAttendance.length === 0) {
            return '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No attendance records yet.</p>';
        }

        return `
            <div style="max-height: 300px; overflow-y: auto;">
                ${studentAttendance.map(record => `
                    <div style="background: var(--bg-tertiary); padding: 1rem; border-radius: var(--border-radius-md); margin-bottom: 0.5rem;">
                        <div style="color: var(--success); margin-bottom: 0.5rem;">✓ Present</div>
                        <div style="color: var(--text-secondary); font-size: 0.9rem;">
                            ${new Date(record.timestamp).toLocaleString()}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    createCommunicationModal() {
        const isTeacher = this.currentUser.role === 'teacher';

        return `
        <div class="modal-overlay">
            <div class="modal">
                <div class="modal-header">
                    <h2>💬 Communication</h2>
                    <button class="modal-close" onclick="app.closeModal()">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                <div class="modal-content">
                    ${isTeacher ? `
                    <!-- Channel Selector for Teachers -->
                    <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
                        <button class="btn" onclick="app.switchChannel('students')" id="students-channel-btn" style="flex: 1; background: var(--gradient-primary);">
                            👨‍🎓 Students (Section ${this.currentUser.section || 'A'})
                        </button>
                        <button class="btn" onclick="app.switchChannel('teachers')" id="teachers-channel-btn" style="flex: 1; background: var(--bg-secondary);">
                            👩‍🏫 Teachers Only
                        </button>
                    </div>
                    ` : `
                    <!-- Section Info for Students -->
                    <div style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--border-radius-md); margin-bottom: 1rem; text-align: center;">
                        <strong>📚 Section ${this.currentUser.section || 'A'} - Teacher-Student Chat</strong>
                    </div>
                    `}
                    
                    <!-- Message Mode Selector -->
                    <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
                        <button class="btn" onclick="app.switchMessageMode('public')" id="public-mode-btn" style="flex: 1; background: ${this.messageMode === 'public' ? 'var(--gradient-primary)' : 'var(--bg-secondary)'};">
                            📢 Public Messages
                        </button>
                        <button class="btn" onclick="app.switchMessageMode('private')" id="private-mode-btn" style="flex: 1; background: ${this.messageMode === 'private' ? 'var(--gradient-primary)' : 'var(--bg-secondary)'};">
                            🔒 Private Messages
                        </button>
                    </div>
                    
                    <!-- Recipient Selector (Private Mode Only) -->
                    <div id="recipient-selector" style="display: ${this.messageMode === 'private' ? 'block' : 'none'}; margin-bottom: 1rem;">
                        <label for="recipient-select" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Send private message to:</label>
                        <select id="recipient-select" style="width: 100%; padding: 0.75rem; background: var(--bg-secondary); border: 2px solid rgba(255,255,255,0.1); border-radius: var(--border-radius-sm); color: var(--text-primary); font-family: var(--font-primary);">
                            <option value="">-- Select a ${isTeacher ? 'student' : 'teacher'} --</option>
                            ${this.renderRecipientOptions()}
                        </select>
                    </div>
                    
                    <div style="background: var(--bg-tertiary); border-radius: var(--border-radius-lg); height: 400px; display: flex; flex-direction: column;">
                        <div id="messages-container" style="flex: 1; overflow-y: auto; padding: 1.5rem;">
                            ${this.renderMessages()}
                        </div>
                        <form id="send-message-form" style="padding: 1.5rem; border-top: 1px solid rgba(255, 255, 255, 0.1); display: flex; gap: 1rem;">
                            <input type="text" id="message-input" placeholder="Type your message..." style="flex: 1; padding: 0.75rem 1rem; background: var(--bg-secondary); border: 2px solid transparent; border-radius: var(--border-radius-sm); color: var(--text-primary);" required>
                            <button type="submit" class="btn btn-primary" style="width: auto; padding: 0.75rem 1.5rem;">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
                                    <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                                </svg>
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;
    }

    renderMessages() {
        const currentChannel = this.currentChannel || 'students';
        const userSection = this.currentUser.section || 'A';
        const userId = this.currentUser.id;
        const isTeacher = this.currentUser.role === 'teacher';

        console.log('🔍 Rendering messages:', {
            totalMessages: this.messages.length,
            currentChannel,
            userSection,
            userId,
            isTeacher,
            messageMode: this.messageMode
        });

        // Debug: Show sample message IDs vs current user ID
        if (this.messages.length > 0) {
            console.log('📊 Debugging sender_id matching:');
            console.log('   Current user ID:', userId);
            this.messages.slice(0, 3).forEach((msg, idx) => {
                console.log(`   Message ${idx + 1}:`, {
                    sender_id: msg.sender_id,
                    matches: msg.sender_id === userId,
                    sender_name: msg.sender_name
                });
            });
        }

        let filteredMessages;

        if (this.messageMode === 'private') {
            // Show private messages where user is sender or recipient
            filteredMessages = this.messages.filter(msg => {
                const isRelevant = msg.is_private === true &&
                    (msg.sender_id === userId || msg.recipient_id === userId);
                return isRelevant;
            });

            console.log('🔒 Private messages related to me:', filteredMessages.length);

            // Further filter by selected recipient if one is chosen
            if (this.selectedRecipient) {
                console.log('🎯 Filtering by recipient:', this.selectedRecipient);

                filteredMessages = filteredMessages.filter(msg => {
                    const match1 = (msg.sender_id === userId && msg.recipient_id === this.selectedRecipient);
                    const match2 = (msg.recipient_id === userId && msg.sender_id === this.selectedRecipient);

                    if (!match1 && !match2 && msg.sender_id === userId) {
                        // Log why my own message is being hidden
                        console.log(`❌ Hiding my message. Expected Recipient: ${this.selectedRecipient}, Actual: ${msg.recipient_id}`);
                    }

                    return match1 || match2;
                });
            }
        } else {
            // Public messages
            filteredMessages = this.messages.filter(msg => {
                // Skip private messages
                if (msg.is_private) return false;

                // Teacher-to-teacher channel
                if (currentChannel === 'teachers') {
                    return msg.channel === 'teachers';
                }

                // SIMPLIFIED LOGIC:
                // Teachers see ALL student messages (all sections)
                // Students see only their section
                if (currentChannel === 'students') {
                    if (isTeacher) {
                        // Teachers see ALL student channel messages
                        return msg.channel === 'students';
                    } else {
                        // Students see only their section
                        return msg.channel === 'students' && msg.section === userSection;
                    }
                }

                return false;
            });
        }

        console.log('📊 Filtered messages:', filteredMessages.length);
        console.log('📋 Raw messages sample:', this.messages.slice(0, 3)); // Show first 3 messages
        console.log('✅ Messages that passed filter:', filteredMessages.length > 0 ? filteredMessages.slice(0, 2) : 'NONE');


        if (filteredMessages.length === 0) {
            if (this.messageMode === 'private') {
                if (!this.selectedRecipient) {
                    // No recipient selected - guide user
                    const targetRole = isTeacher ? 'student' : 'teacher';
                    return `
                        <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                            <div style="font-size: 2rem; margin-bottom: 1rem;">🔒</div>
                            <p style="font-size: 1.1rem; margin-bottom: 1rem;">Private Messaging Mode</p>
                            <p>Select a ${targetRole} from the dropdown above to start a private conversation.</p>
                            ${this.availableUsers.length === 0 ? `<p style="color: var(--error); margin-top: 1rem;">⚠️ No ${targetRole}s available in your section.</p>` : ''}
                        </div>
                    `;
                } else {
                    // Recipient selected but no messages yet
                    return `<p style="text-align: center; color: var(--text-secondary);">No private messages with this user yet. Start a conversation!</p>`;
                }
            } else {
                const channelName = currentChannel === 'teachers' ? 'Teachers Only' : isTeacher ? 'All Students' : `Section ${userSection} Chat`;
                return `<p style="text-align: center; color: var(--text-secondary);">No messages in ${channelName} yet. Start a conversation!</p>`;
            }
        }

        return filteredMessages.map(msg => {
            const isSentByMe = msg.sender_id ? (msg.sender_id === userId) : (msg.sender === this.currentUser.email);
            const senderName = msg.sender_name || msg.senderName || 'Unknown';
            const senderRole = msg.sender_role || msg.senderRole || '';
            const timestamp = msg.created_at || msg.timestamp;

            // Debug: Log each message being rendered
            if (isSentByMe) {
                console.log('🟢 Rendering MY message:', { senderName, message: msg.message.substring(0, 20) });
            }

            return `
            <div style="margin-bottom: 1rem; ${isSentByMe ? 'text-align: right;' : ''}">
                <div style="display: inline-block; max-width: 70%; background: ${isSentByMe ? 'var(--gradient-primary)' : 'var(--bg-secondary)'}; padding: 1rem; border-radius: var(--border-radius-md);">
                    <div class="message-sender" style="font-weight: 600; margin-bottom: 0.25rem; font-size: 0.9rem;">
                        ${senderName} <span style="opacity: 0.7; font-size: 0.8rem;">(${senderRole})</span>
                        ${msg.is_private ? ' <span style="opacity:0.7; font-size: 0.75rem;">🔒</span>' : ''}
                    </div>
                    <div class="message-content">${this.escapeHtml(msg.message)}</div>
                    <div class="message-time" style="margin-top: 0.5rem; font-size: 0.75rem; opacity: 0.7;">${new Date(timestamp).toLocaleTimeString()}</div>
                </div>
            </div>
        `;
        }).join('');
    }

    createAIAgentModal() {
        return `
            <div class="modal-overlay">
                <div class="modal">
                    <div class="modal-header">
                        <h2>🤖 AI Learning Assistant</h2>
                        <button class="modal-close" onclick="app.closeModal()">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>
                    <div class="modal-content">
                        <div style="background: var(--bg-tertiary); border-radius: var(--border-radius-lg); height: 500px; display: flex; flex-direction: column;">
                            <div id="ai-chat-container" style="flex: 1; overflow-y: auto; padding: 1.5rem;">
                                <div style="background: var(--gradient-primary); padding: 1rem; border-radius: var(--border-radius-md); margin-bottom: 1rem;">
                                    <div class="message-sender" style="font-weight: 600; margin-bottom: 0.5rem;">AI Assistant</div>
                                    <div class="message-content">Hello! I'm your AI learning assistant. I can help you with:</div>
                                    <ul class="message-content" style="margin-top: 0.5rem; padding-left: 1.5rem;">
                                        <li>Answering questions about your subjects</li>
                                        <li>Explaining difficult concepts</li>
                                        <li>Providing study tips and resources</li>
                                        <li>Helping with homework and assignments</li>
                                    </ul>
                                    <div class="message-content" style="margin-top: 0.5rem;">How can I help you today?</div>
                                </div>
                            </div>
                            <form id="ai-chat-form" onsubmit="event.preventDefault(); app.sendAIMessage()" style="padding: 1.5rem; border-top: 1px solid rgba(255, 255, 255, 0.1); display: flex; gap: 1rem; align-items: center;">
                                <input type="text" id="ai-input" placeholder="Ask me anything..." style="flex: 1; padding: 0.75rem 1rem; background: var(--bg-secondary); border: 2px solid transparent; border-radius: var(--border-radius-sm); color: var(--text-primary);" required>
                                
                                <button type="button" onclick="app.searchGoogle()" class="btn" style="background: #4285F4; color: white; padding: 0.75rem; border-radius: 50%; width: 46px; height: 46px; display: flex; align-items: center; justify-content: center;" title="Search on Google">
                                    <svg viewBox="0 0 24 24" fill="currentColor" style="width: 24px; height: 24px;">
                                        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .533 5.333.533 12S5.867 24 12.48 24c3.44 0 6.013-1.133 8.053-3.24 2.08-2.08 2.72-5.013 2.72-7.427 0-.733-.053-1.427-.16-2.08h-10.613z"/>
                                    </svg>
                                </button>

                                <button type="submit" class="btn btn-primary" style="width: auto; padding: 0.75rem 1.5rem;">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
                                        <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                                    </svg>
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    searchGoogle() {
        const input = document.getElementById('ai-input');
        const query = input.value.trim();
        if (query) {
            window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
        } else {
            this.showNotification('Enter a question to search on Google', 'info');
            input.focus();
        }
    }

    setupModalListeners(feature) {
        const overlay = document.querySelector('.modal-overlay');
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.closeModal();
            }
        });

        // Feature-specific listeners
        switch (feature) {
            case 'notes':
                if (this.currentUser.role === 'teacher') {
                    document.getElementById('upload-note-form').addEventListener('submit', (e) => {
                        e.preventDefault();
                        this.uploadNote();
                    });
                }
                break;
            case 'attendance':
                if (this.currentUser.role === 'student') {
                    document.getElementById('submit-attendance-form').addEventListener('submit', (e) => {
                        e.preventDefault();
                        this.submitAttendance();
                    });
                }
                break;
            case 'communication':
                document.getElementById('send-message-form').addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.sendMessage();
                });
                break;
            case 'ai-agent':
                document.getElementById('ai-chat-form').addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.sendAIMessage();
                });
                break;
            case 'announcements':
                if (this.currentUser.role === 'teacher') {
                    const announcementForm = document.getElementById('announcement-form');
                    if (announcementForm) {
                        announcementForm.addEventListener('submit', (e) => {
                            e.preventDefault();
                            this.sendAnnouncement();
                        });
                    }
                }
                break;
            case 'calendar':
                const calendarEventForm = document.getElementById('calendar-event-form');
                if (calendarEventForm) {
                    calendarEventForm.addEventListener('submit', (e) => {
                        e.preventDefault();
                        this.addCalendarEvent();
                    });
                }
                break;
        }
    }

    async uploadNote() {
        const title = document.getElementById('note-title').value;
        const subject = document.getElementById('note-subject').value;
        const description = document.getElementById('note-description').value;
        const driveUrl = document.getElementById('note-drive-url').value;
        const file = document.getElementById('note-file').files[0];

        // Validate that at least one is provided (Drive URL or file)
        if (!driveUrl && !file) {
            this.showNotification('⚠️ Please provide either a Google Drive URL or upload a file', 'error');
            return;
        }

        // ✅ USE SUPABASE if available
        if (supabaseClient) {
            try {
                console.log('📤 Uploading note to Supabase...');

                // Get current user's auth ID
                const { data: { user } } = await supabaseClient.auth.getUser();

                if (!user) {
                    this.showNotification('❌ Please login again', 'error');
                    return;
                }

                let fileUrl = driveUrl || null; // Default to Google Drive URL if provided
                let fileName = file ? file.name : 'Google Drive Link';
                let fileSize = file ? file.size : 0;

                // 📤 UPLOAD FILE TO SUPABASE STORAGE if a file is selected
                if (file) {
                    this.showNotification('📤 Uploading file to cloud...', 'info');

                    // Create unique file path
                    const timestamp = Date.now();
                    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
                    const filePath = `notes/${user.id}/${timestamp}_${sanitizedFileName}`;

                    console.log('📁 Uploading to path:', filePath);

                    // Upload to Supabase Storage
                    const { data: uploadData, error: uploadError } = await supabaseClient.storage
                        .from('notes-files')
                        .upload(filePath, file, {
                            cacheControl: '3600',
                            upsert: false
                        });

                    if (uploadError) {
                        console.error('Storage upload error:', uploadError);
                        this.showNotification('❌ File upload failed: ' + uploadError.message, 'error');
                        return;
                    }

                    console.log('✅ File uploaded to storage:', uploadData);

                    // Get public URL for the uploaded file
                    const { data: urlData } = supabaseClient.storage
                        .from('notes-files')
                        .getPublicUrl(filePath);

                    fileUrl = urlData.publicUrl;
                    console.log('🔗 Public URL:', fileUrl);
                }

                // 💾 SAVE NOTE METADATA TO DATABASE
                const noteData = {
                    title: title,
                    description: description || 'No description',
                    file_url: fileUrl,
                    file_name: fileName,
                    file_size: fileSize,
                    uploaded_by: user.id,
                    section: this.currentUser.section || 'A',
                    subject: subject || this.currentUser.subject || 'Other'
                };

                console.log('📝 Saving note metadata:', noteData);

                const { data, error } = await supabaseClient
                    .from('notes')
                    .insert([noteData])
                    .select();

                if (error) {
                    console.error('Database insert error:', error);
                    this.showNotification('❌ Failed to save note: ' + error.message, 'error');
                    return;
                }

                console.log('✅ Note saved successfully!', data);

                if (file) {
                    this.showNotification(`✅ PDF uploaded! Section ${this.currentUser.section || 'A'} students can access it.`, 'success');
                } else {
                    this.showNotification(`✅ Drive link saved! Section ${this.currentUser.section || 'A'} students can access it.`, 'success');
                }

                // Refresh notes list
                await this.loadNotesFromSupabase();
                document.getElementById('notes-list').innerHTML = this.renderNotesList();
                document.getElementById('upload-note-form').reset();

            } catch (error) {
                console.error('Upload error:', error);
                this.showNotification('❌ Upload failed: ' + error.message, 'error');
            }
        } else {
            // ⚠️ FALLBACK to localStorage
            const note = {
                id: Date.now().toString(),
                title,
                subject,
                description,
                driveUrl: driveUrl || null,
                fileName: file ? file.name : (driveUrl ? 'Google Drive Link' : 'document.pdf'),
                uploadedBy: this.currentUser.email,
                uploadedByName: this.currentUser.name,
                timestamp: Date.now()
            };

            this.notes.push(note);
            this.saveToStorage('edubridge_notes', this.notes);
            this.showNotification('✅ Note uploaded (localStorage)!', 'success');
            document.getElementById('notes-list').innerHTML = this.renderNotesList();
            document.getElementById('upload-note-form').reset();
        }
    }

    async downloadNote(noteId) {
        const note = this.notes.find(n => n.id === noteId);
        if (!note) return;

        // If note has a file_url from Supabase Storage or Google Drive
        if (note.file_url && note.file_url !== 'local-file' && !note.file_url.includes('blob:')) {
            // Open the file in a new tab (works for both Supabase Storage and Google Drive)
            window.open(note.file_url, '_blank');
            this.showNotification(`📥 Opening: ${note.title}`, 'success');
            return;
        }

        // If Google Drive URL exists
        if (note.driveUrl) {
            window.open(note.driveUrl, '_blank');
            this.showNotification(`📎 Opening ${note.title} from Google Drive`, 'success');
            return;
        }

        // Fallback for local files - show info message
        this.showNotification(`ℹ️ ${note.title} - File stored locally. Use "Open in Google Drive" if available.`, 'info');
    }

    generateAttendanceCode() {
        const duration = parseInt(document.getElementById('code-duration').value);
        const code = this.generateRandomCode();
        const expiryTime = Date.now() + (duration * 1000);

        this.activeAttendanceCode = {
            code,
            expiryTime,
            duration
        };

        this.displayAttendanceCode(code, duration);
        this.startCodeTimer(duration);
    }

    generateRandomCode() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    displayAttendanceCode(code, duration) {
        const display = document.getElementById('code-display');
        display.innerHTML = `
            <div style="background: var(--gradient-primary); padding: 2rem; border-radius: var(--border-radius-lg); text-align: center;">
                <div style="font-size: 0.9rem; margin-bottom: 0.5rem; opacity: 0.9;">Attendance Code</div>
                <div style="font-size: 3rem; font-weight: 800; letter-spacing: 0.5rem; margin-bottom: 1rem;">${code}</div>
                <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">
                    <span id="timer-display">${duration}</span> seconds
                </div>
                <div style="width: 100%; height: 8px; background: rgba(255, 255, 255, 0.3); border-radius: 4px; overflow: hidden; margin-top: 1rem;">
                    <div id="timer-progress" style="height: 100%; background: white; width: 100%; transition: width 1s linear;"></div>
                </div>
            </div>
        `;
    }

    startCodeTimer(duration) {
        let remaining = duration;
        const timerDisplay = document.getElementById('timer-display');
        const timerProgress = document.getElementById('timer-progress');

        const interval = setInterval(() => {
            remaining--;
            if (timerDisplay) {
                timerDisplay.textContent = remaining;
            }
            if (timerProgress) {
                timerProgress.style.width = `${(remaining / duration) * 100}%`;
            }

            if (remaining <= 0) {
                clearInterval(interval);
                this.activeAttendanceCode = null;
                if (document.getElementById('code-display')) {
                    document.getElementById('code-display').innerHTML = `
                        <div style="background: var(--bg-tertiary); padding: 2rem; border-radius: var(--border-radius-lg); text-align: center; color: var(--text-secondary);">
                            Code expired. Generate a new code.
                        </div>
                    `;
                }
            }
        }, 1000);
    }

    submitAttendance() {
        const name = document.getElementById('student-name').value;
        const roll = document.getElementById('student-roll').value;
        const code = document.getElementById('attendance-code').value.toUpperCase();

        if (!this.activeAttendanceCode) {
            this.showNotification('No active attendance code. Please contact your teacher.', 'error');
            return;
        }

        if (Date.now() > this.activeAttendanceCode.expiryTime) {
            this.showNotification('Attendance code has expired.', 'error');
            return;
        }

        if (code !== this.activeAttendanceCode.code) {
            this.showNotification('Invalid attendance code.', 'error');
            return;
        }

        // Check if already submitted
        const alreadySubmitted = this.attendance.some(
            record => record.email === this.currentUser.email &&
                record.code === code
        );

        if (alreadySubmitted) {
            this.showNotification('You have already submitted attendance for this session.', 'warning');
            return;
        }

        const record = {
            name,
            roll,
            email: this.currentUser.email,
            code,
            timestamp: Date.now()
        };

        this.attendance.push(record);
        this.saveToStorage('edubridge_attendance', this.attendance);
        this.showNotification('Attendance submitted successfully!', 'success');

        // Refresh UI
        this.closeModal();
        this.openFeature('attendance');
    }

    downloadAttendance() {
        if (this.attendance.length === 0) {
            this.showNotification('No attendance records to download.', 'warning');
            return;
        }

        // Create CSV content
        let csv = 'Name,Roll Number,Email,Date,Time\n';
        this.attendance.forEach(record => {
            const date = new Date(record.timestamp);
            csv += `${record.name},${record.roll},${record.email},${date.toLocaleDateString()},${date.toLocaleTimeString()}\n`;
        });

        // Create and download file
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        this.showNotification('Attendance downloaded successfully!', 'success');
    }

    async sendMessage() {
        const input = document.getElementById('message-input');
        const message = input.value.trim();

        if (!message) return;

        // Validate recipient for private messages
        if (this.messageMode === 'private') {
            const recipientSelect = document.getElementById('recipient-select');

            // Check if dropdown exists and has value
            if (!recipientSelect) {
                console.error('❌ Recipient select dropdown not found!');
                this.showNotification('⚠️ Error: Recipient selector not loaded', 'error');
                return;
            }

            if (!recipientSelect.value) {
                // Check if there are any users available
                if (this.availableUsers.length === 0) {
                    const targetRole = this.currentUser.role === 'teacher' ? 'students' : 'teachers';
                    this.showNotification(`⚠️ No ${targetRole} available in your section to send private messages to.`, 'warning');
                    console.warn(`No users available. availableUsers: ${this.availableUsers.length}`);
                } else {
                    this.showNotification('⚠️ Please select a recipient from the dropdown first', 'warning');
                }
                return;
            }

            this.selectedRecipient = recipientSelect.value;
            console.log('📬 Sending private message to:', this.selectedRecipient);
        }

        const currentChannel = this.currentChannel || 'students';
        const userSection = this.currentUser.section || 'A';

        // ✅ SAVE TO SUPABASE if available
        if (supabaseClient) {
            try {
                const { data: { user } } = await supabaseClient.auth.getUser();

                if (!user) {
                    this.showNotification('❌ Please login again', 'error');
                    return;
                }

                const messageData = {
                    sender_id: user.id,
                    sender_name: this.currentUser.name,
                    sender_role: this.currentUser.role,
                    sender_email: this.currentUser.email,
                    message: message,
                    channel: currentChannel,
                    section: userSection,
                    is_private: this.messageMode === 'private',
                    recipient_id: this.messageMode === 'private' ? this.selectedRecipient : null
                };

                console.log('📤 Sending message to Supabase:', messageData);

                const { data, error } = await supabaseClient
                    .from('messages')
                    .insert([messageData])
                    .select();

                if (error) {
                    console.error('Message send error:', error);
                    this.showNotification('❌ Failed to send message: ' + error.message, 'error');
                    return;
                }

                console.log('✅ Message sent successfully:', data);

                let newMessage;
                if (data && data.length > 0) {
                    newMessage = data[0];
                } else {
                    console.warn('⚠️ No data returned from insert (likely RLS). Using local data.');
                    newMessage = {
                        ...messageData,
                        created_at: new Date().toISOString(),
                        id: 'temp-' + Date.now() // Temporary ID
                    };
                }

                // Add to local messages array
                this.messages.push(newMessage);

                // Clear input immediately
                input.value = '';

                // Update UI - Force re-render
                const messagesContainer = document.getElementById('messages-container');
                messagesContainer.innerHTML = this.renderMessages();

                // Scroll to bottom after a short delay to ensure DOM is updated
                setTimeout(() => {
                    if (messagesContainer) {
                        messagesContainer.scrollTop = messagesContainer.scrollHeight;
                    }
                }, 100);

                // Show success notification
                // ✅ SHOW SUCCESS NOTIFICATION
                this.showNotification('✅ Message Sent Successfully!', 'success');
                console.log('💬 Message displayed in UI');

            } catch (error) {
                console.error('Send message error:', error);
                this.showNotification('❌ Failed to send message', 'error');
            }
        } else {
            // ⚠️ FALLBACK to localStorage
            const msg = {
                sender: this.currentUser.email,
                senderName: this.currentUser.name,
                senderRole: this.currentUser.role,
                message,
                timestamp: Date.now(),
                channel: currentChannel,
                section: userSection,
                is_private: this.messageMode === 'private',
                recipient_id: this.messageMode === 'private' ? this.selectedRecipient : null
            };

            this.messages.push(msg);
            this.saveToStorage('edubridge_messages', this.messages);

            // Update UI
            document.getElementById('messages-container').innerHTML = this.renderMessages();
            input.value = '';

            // Scroll to bottom
            const container = document.getElementById('messages-container');
            container.scrollTop = container.scrollHeight;

            // ✅ SHOW SUCCESS NOTIFICATION
            this.showNotification('✅ Message Sent Successfully!', 'success');
        }
    }

    async sendAIMessage() {
        const input = document.getElementById('ai-input');
        const question = input.value.trim();

        if (!question) return;

        const container = document.getElementById('ai-chat-container');

        // Add user message
        container.innerHTML += `
            <div style="text-align: right; margin-bottom: 1rem;">
                <div style="display: inline-block; max-width: 70%; background: var(--bg-secondary); padding: 1rem; border-radius: var(--border-radius-md);">
                    <div style="font-weight: 600; margin-bottom: 0.25rem; font-size: 0.9rem;">You</div>
                    <div>${this.escapeHtml(question)}</div>
                </div>
            </div>
        `;

        input.value = '';
        input.disabled = true;

        // Add loading indicator
        const loadingId = 'loading-' + Date.now();
        container.innerHTML += `
            <div id="${loadingId}" style="margin-bottom: 1rem;">
                <div style="display: inline-block; max-width: 70%; background: var(--gradient-primary); padding: 1rem; border-radius: var(--border-radius-md);">
                    <div style="font-weight: 600; margin-bottom: 0.25rem; font-size: 0.9rem;">AI Assistant</div>
                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                        <div class="typing-indicator">
                            <span></span><span></span><span></span>
                        </div>
                        <span>Thinking...</span>
                    </div>
                </div>
            </div>
        `;

        container.scrollTop = container.scrollHeight;

        // Get AI response (real or simulated)
        try {
            const response = await this.getAIResponse(question);

            // Remove loading indicator
            const loadingEl = document.getElementById(loadingId);
            if (loadingEl) loadingEl.remove();

            // Add AI response
            container.innerHTML += `
                <div style="margin-bottom: 1rem;">
                    <div style="display: inline-block; max-width: 70%; background: var(--gradient-primary); padding: 1rem; border-radius: var(--border-radius-md);">
                        <div style="font-weight: 600; margin-bottom: 0.25rem; font-size: 0.9rem;">AI Assistant</div>
                        <div>${this.escapeHtml(response)}</div>
                    </div>
                </div>
            `;
            container.scrollTop = container.scrollHeight;
        } catch (error) {
            // Remove loading indicator
            const loadingEl = document.getElementById(loadingId);
            if (loadingEl) loadingEl.remove();

            // Show error
            container.innerHTML += `
                <div style="margin-bottom: 1rem;">
                    <div style="display: inline-block; max-width: 70%; background: var(--bg-tertiary); padding: 1rem; border-radius: var(--border-radius-md); border: 1px solid var(--error);">
                        <div style="font-weight: 600; margin-bottom: 0.25rem; font-size: 0.9rem; color: var(--error);">Error</div>
                        <div style="color: var(--text-secondary);">${this.escapeHtml(error.message)}</div>
                    </div>
                </div>
            `;
            container.scrollTop = container.scrollHeight;
        } finally {
            input.disabled = false;
            input.focus();
        }
    }

    async getAIResponse(question) {
        // Check if real AI is configured
        if (typeof AI_CONFIG !== 'undefined' && isAIConfigured()) {
            const provider = AI_CONFIG.provider;

            if (provider === 'gemini') {
                return await this.getGeminiResponse(question);
            } else if (provider === 'huggingface') {
                return await this.getHuggingFaceResponse(question);
            } else {
                return await this.getSimulatedResponse(question);
            }
        } else {
            // Fallback to simulation
            return await this.getSimulatedResponse(question);
        }
    }

    async getGeminiResponse(question) {
        const config = AI_CONFIG.gemini;
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent`;

        try {
            const response = await fetch(`${API_URL}?key=${config.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `${AI_CONFIG.systemPrompt}\n\nStudent Question: ${question}`
                        }]
                    }],
                    generationConfig: {
                        temperature: config.temperature,
                        maxOutputTokens: config.maxTokens,
                    }
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Failed to get AI response. Check your API key.');
            }

            const data = await response.json();

            if (!data.candidates || !data.candidates[0]?.content?.parts[0]?.text) {
                throw new Error('Invalid response from AI');
            }

            return data.candidates[0].content.parts[0].text;
        } catch (error) {
            console.error('Gemini AI Error:', error);
            throw new Error(`Gemini Error: ${error.message}`);
        }
    }

    async getHuggingFaceResponse(question) {
        const config = AI_CONFIG.huggingface;
        let API_URL = `https://api-inference.huggingface.co/models/${config.model}`;

        // Use CORS proxy if enabled (for browser compatibility)
        if (config.useCorsProxy) {
            API_URL = `https://corsproxy.io/?${encodeURIComponent(API_URL)}`;
        }

        try {
            const prompt = `${AI_CONFIG.systemPrompt}\n\nStudent: ${question}\n\nAI Assistant:`;

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), AI_CONFIG.timeout);

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${config.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    inputs: prompt,
                    parameters: {
                        max_new_tokens: config.maxTokens,
                        temperature: config.temperature,
                        top_p: config.topP,
                        return_full_text: false,
                    }
                }),
                signal: controller.signal
            });

            clearTimeout(timeout);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));

                if (response.status === 503) {
                    throw new Error('Model is loading. Please wait 20-30 seconds and try again.');
                } else if (response.status === 401) {
                    throw new Error('Invalid API token. Check your Hugging Face API key.');
                } else {
                    throw new Error(errorData.error || 'Failed to get AI response from Hugging Face.');
                }
            }

            const data = await response.json();

            let text = '';
            if (Array.isArray(data)) {
                text = data[0]?.generated_text || data[0]?.text || '';
            } else if (data.generated_text) {
                text = data.generated_text;
            } else if (data[0]) {
                text = data[0].generated_text || data[0].text || '';
            }

            if (!text || text.trim() === '') {
                throw new Error('Empty response from AI model');
            }

            text = text.trim();

            if (text.includes('AI Assistant:')) {
                text = text.split('AI Assistant:').pop().trim();
            }

            return text;
        } catch (error) {
            console.error('Hugging Face AI Error:', error);
            if (error.name === 'AbortError') {
                throw new Error('Request timeout. The model took too long to respond.');
            }
            throw new Error(`Hugging Face Error: ${error.message}`);
        }
    }

    async getSimulatedResponse(question) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.generateAIResponse(question);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    generateAIResponse(question) {
        const responses = [
            "That's a great question! Based on the curriculum, I'd recommend starting with the fundamentals and building up from there.",
            "I can help you with that! Here's a simple explanation: " + question.split(' ').slice(0, 5).join(' ') + " is an important concept. Would you like me to break it down further?",
            "Excellent question! Let me provide you with some study resources and tips for this topic.",
            "I understand you're asking about " + question.split(' ')[0] + ". This is covered in your course materials. I recommend reviewing Chapter 3 for more details.",
            "Great thinking! To solve this, you should consider the key principles we discussed in class. Would you like a step-by-step explanation?"
        ];

        return responses[Math.floor(Math.random() * responses.length)];
    }

    // ==========================================
    // MESSAGE MANAGEMENT FUNCTIONS
    // ==========================================

    async loadMessagesFromSupabase() {
        if (!supabaseClient) {
            console.log('📦 Using localStorage for messages');
            return;
        }

        try {
            console.log('📥 Loading messages from Supabase...');

            const { data, error } = await supabaseClient
                .from('messages')
                .select('*')
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Error loading messages:', error);
                return;
            }

            // Store in this.messages array for rendering
            this.messages = data || [];
            console.log(`✅ Loaded ${this.messages.length} messages (filtered by RLS)`);

        } catch (error) {
            console.error('Error loading messages:', error);
        }
    }

    async subscribeToMessages() {
        if (!supabaseClient) return;

        // Prevent duplicate subscriptions
        if (this.messageSubscription) {
            supabaseClient.removeChannel(this.messageSubscription);
        }

        console.log('📡 Subscribing to messages...');
        this.messageSubscription = supabaseClient
            .channel('public:messages')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
                console.log('🔔 New message received:', payload);
                const newMessage = payload.new;

                // Add to local list if not exists
                if (!this.messages.some(m => m.id === newMessage.id)) {
                    this.messages.push(newMessage);

                    // RELOAD UI if messages container exists
                    const container = document.getElementById('messages-container');
                    if (container) {
                        container.innerHTML = this.renderMessages();
                        container.scrollTop = container.scrollHeight;
                    }
                }
            })
            .subscribe((status) => {
                console.log('Subscription status:', status);
            });
    }

    async loadAvailableUsers() {
        if (!supabaseClient) {
            console.warn('⚠️ Supabase not initialized');
            return;
        }

        try {
            const isTeacher = this.currentUser.role === 'teacher';
            const userSection = this.currentUser.section || 'A';
            const targetRole = isTeacher ? 'student' : 'teacher';

            console.log(`🔍 Loading available ${targetRole}s for section ${userSection}...`);

            const { data, error } = await supabaseClient
                .from('users')
                .select('id, name, email, role, section')
                .eq('role', targetRole)
                .eq('section', userSection)
                .neq('id', this.currentUser.id); // Exclude current user

            if (error) {
                console.error('❌ Error loading users from users table:', error);
                console.warn('💡 Make sure the users table exists and is populated');
                this.availableUsers = [];
                return;
            }

            this.availableUsers = data || [];
            console.log(`✅ Loaded ${this.availableUsers.length} available ${targetRole}s for private messaging`);

            if (this.availableUsers.length === 0) {
                console.warn(`⚠️ No ${targetRole}s found in section ${userSection}. Users table might be empty.`);
                console.warn('💡 Students/Teachers need to be registered in the users table for private messaging to work.');
            } else {
                console.log('📋 Available users:', this.availableUsers.map(u => `${u.name} (${u.email})`));
            }

        } catch (error) {
            console.error('❌ Error loading available users:', error);
            this.availableUsers = [];
        }
    }

    renderRecipientOptions() {
        if (!this.availableUsers || this.availableUsers.length === 0) {
            return '<option value="">No users available</option>';
        }

        return this.availableUsers.map(user =>
            `<option value="${user.id}">${user.name} (${user.email})</option>`
        ).join('');
    }

    switchMessageMode(mode) {
        this.messageMode = mode;

        // Update button styles
        const publicBtn = document.getElementById('public-mode-btn');
        const privateBtn = document.getElementById('private-mode-btn');
        const recipientSelector = document.getElementById('recipient-selector');

        if (mode === 'public') {
            if (publicBtn) publicBtn.style.background = 'var(--gradient-primary)';
            if (privateBtn) privateBtn.style.background = 'var(--bg-secondary)';
            if (recipientSelector) recipientSelector.style.display = 'none';
            this.selectedRecipient = null;
        } else {
            if (publicBtn) publicBtn.style.background = 'var(--bg-secondary)';
            if (privateBtn) privateBtn.style.background = 'var(--gradient-primary)';
            if (recipientSelector) recipientSelector.style.display = 'block';
        }

        // Refresh messages
        const messagesContainer = document.getElementById('messages-container');
        if (messagesContainer) {
            messagesContainer.innerHTML = this.renderMessages();
        }

        // Set up recipient change listener
        const recipientSelect = document.getElementById('recipient-select');
        if (recipientSelect && mode === 'private') {
            recipientSelect.addEventListener('change', (e) => {
                this.selectedRecipient = e.target.value;
                // Refresh messages when recipient changes
                const container = document.getElementById('messages-container');
                if (container) {
                    container.innerHTML = this.renderMessages();
                }
            });
        }
    }

    closeModal() {
        document.getElementById('modals-container').innerHTML = '';
        if (this.messageSubscription && supabaseClient) {
            console.log('Stopping message subscription');
            supabaseClient.removeChannel(this.messageSubscription);
            this.messageSubscription = null;
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 2rem;
            right: 2rem;
            background: ${type === 'success' ? 'var(--success)' : type === 'error' ? 'var(--error)' : type === 'warning' ? 'var(--warning)' : 'var(--primary)'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: var(--border-radius-md);
            box-shadow: var(--shadow-lg);
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
            max-width: 400px;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    saveToStorage(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    loadFromStorage(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    }

    // ==========================================
    // ANNOUNCEMENTS FEATURE
    // ==========================================

    async loadAnnouncementsFromSupabase() {
        if (!supabaseClient) {
            console.log('📦 Using localStorage for announcements');
            return;
        }

        try {
            console.log('📥 Loading announcements from Supabase...');
            const { data, error } = await supabaseClient
                .from('announcements')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error loading announcements:', error);
                return;
            }

            this.announcements = data || [];
            console.log(`✅ Loaded ${this.announcements.length} announcements`);
        } catch (error) {
            console.error('Error loading announcements:', error);
        }
    }

    createAnnouncementsModal() {
        const isTeacher = this.currentUser.role === 'teacher';

        return `
            <div class="modal-overlay">
                <div class="modal" style="max-width: 800px;">
                    <div class="modal-header">
                        <h2>📢 Announcements</h2>
                        <button class="modal-close" onclick="app.closeModal()">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>
                    <div class="modal-content">
                        ${isTeacher ? `
                        <form id="announcement-form" style="margin-bottom: 2rem; background: var(--bg-tertiary); padding: 1.5rem; border-radius: var(--border-radius-lg); border: 1px solid rgba(255,255,255,0.1);">
                            <h3 style="margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 22px; height: 22px;">
                                    <path d="M11 5.882V19.24a1.76 1.76 0 0 1-3.417.592l-2.147-6.15M18 13a3 3 0 1 0 0-6M5.436 13.683A4.001 4.001 0 0 1 7 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 0 1-1.564-.317z"/>
                                </svg>
                                Create New Announcement
                            </h3>
                            <div class="form-group">
                                <label for="announcement-title">Title *</label>
                                <input type="text" id="announcement-title" required placeholder="e.g., Exam Schedule Update">
                            </div>
                            <div class="form-group">
                                <label for="announcement-message">Message *</label>
                                <textarea id="announcement-message" rows="4" required style="width: 100%; padding: 1rem; background: var(--bg-secondary); border: 2px solid transparent; border-radius: var(--border-radius-sm); color: var(--text-primary); font-family: var(--font-primary); resize: vertical;" placeholder="Write your announcement here..."></textarea>
                            </div>
                            <div class="form-group">
                                <label for="announcement-priority">Priority</label>
                                <select id="announcement-priority" style="width: 100%; padding: 1rem; background: var(--bg-secondary); border: 2px solid transparent; border-radius: var(--border-radius-sm); color: var(--text-primary);">
                                    <option value="normal">Normal</option>
                                    <option value="important">Important</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                            </div>
                            <button type="submit" class="btn btn-primary">
                                <span>Send Announcement</span>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                                </svg>
                            </button>
                        </form>
                        ` : `
                        <div style="background: var(--bg-secondary); padding: 1rem; border-radius: var(--border-radius-md); margin-bottom: 1.5rem; text-align: center;">
                            <p style="color: var(--text-secondary);">📖 Only teachers can post announcements. Students can view all announcements.</p>
                        </div>
                        `}
                        
                        <h3 style="margin-bottom: 1rem;">Recent Announcements</h3>
                        <div id="announcements-list" style="max-height: 400px; overflow-y: auto;">
                            ${this.renderAnnouncementsList()}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderAnnouncementsList() {
        if (this.announcements.length === 0) {
            return '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No announcements yet.</p>';
        }

        return this.announcements.map(ann => {
            const priorityColors = {
                normal: '#6C5CE7',
                important: '#FDCB6E',
                urgent: '#E74C3C'
            };
            const priorityColor = priorityColors[ann.priority] || priorityColors.normal;
            const date = new Date(ann.created_at).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });

            return `
                <div style="background: var(--bg-tertiary); padding: 1.5rem; border-radius: var(--border-radius-md); margin-bottom: 1rem; border-left: 4px solid ${priorityColor};">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                        <h4 style="font-size: 1.1rem;">${this.escapeHtml(ann.title)}</h4>
                        <span style="background: ${priorityColor}; color: white; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; text-transform: uppercase;">${ann.priority || 'normal'}</span>
                    </div>
                    <p style="color: var(--text-secondary); margin-bottom: 0.75rem; white-space: pre-wrap;">${this.escapeHtml(ann.message)}</p>
                    <div style="display: flex; justify-content: space-between; align-items: center; color: var(--text-tertiary); font-size: 0.85rem;">
                        <span>👤 ${ann.sender_name || 'Teacher'}</span>
                        <span>📅 ${date}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    async sendAnnouncement() {
        const title = document.getElementById('announcement-title').value;
        const message = document.getElementById('announcement-message').value;
        const priority = document.getElementById('announcement-priority').value;

        if (!title || !message) {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }

        const announcement = {
            id: Date.now().toString(),
            title,
            message,
            priority,
            sender_id: this.currentUser.id,
            sender_name: this.currentUser.name,
            section: this.currentUser.section,
            created_at: new Date().toISOString()
        };

        if (supabaseClient) {
            try {
                const { error } = await supabaseClient
                    .from('announcements')
                    .insert([announcement]);

                if (error) {
                    console.error('Error saving announcement:', error);
                    this.showNotification('Failed to send announcement', 'error');
                    return;
                }
            } catch (error) {
                console.error('Error:', error);
            }
        }

        this.announcements.unshift(announcement);
        this.saveToStorage('edubridge_announcements', this.announcements);

        // Add notification for all users
        this.addNotificationItem('announcement', `📢 New Announcement: ${title}`, announcement.id);

        document.getElementById('announcement-form').reset();
        document.getElementById('announcements-list').innerHTML = this.renderAnnouncementsList();
        this.showNotification('Announcement sent successfully!', 'success');
    }

    // ==========================================
    // CALENDAR FEATURE
    // ==========================================

    async loadCalendarEventsFromSupabase() {
        if (!supabaseClient) {
            console.log('📦 Using localStorage for calendar');
            return;
        }

        try {
            console.log('📥 Loading calendar events from Supabase...');
            const { data, error } = await supabaseClient
                .from('calendar_events')
                .select('*')
                .order('event_date', { ascending: true });

            if (error) {
                console.error('Error loading calendar events:', error);
                return;
            }

            this.calendarEvents = data || [];
            console.log(`✅ Loaded ${this.calendarEvents.length} calendar events`);
        } catch (error) {
            console.error('Error loading calendar events:', error);
        }
    }

    createCalendarModal() {
        return `
            <div class="modal-overlay">
                <div class="modal" style="max-width: 900px;">
                    <div class="modal-header">
                        <h2>📅 Calendar</h2>
                        <button class="modal-close" onclick="app.closeModal()">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>
                    <div class="modal-content">
                        <div style="display: grid; grid-template-columns: 1fr 300px; gap: 1.5rem;">
                            <!-- Calendar Grid -->
                            <div>
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                                    <button class="btn" onclick="app.changeMonth(-1)" style="background: var(--bg-secondary); padding: 0.5rem 1rem;">
                                        ← Prev
                                    </button>
                                    <h3 id="calendar-month-year" style="font-size: 1.25rem;"></h3>
                                    <button class="btn" onclick="app.changeMonth(1)" style="background: var(--bg-secondary); padding: 0.5rem 1rem;">
                                        Next →
                                    </button>
                                </div>
                                <div id="calendar-grid" style="background: var(--bg-tertiary); border-radius: var(--border-radius-lg); padding: 1rem; overflow: hidden;">
                                    ${this.renderCalendarGrid()}
                                </div>
                            </div>
                            
                            <!-- Event Form & List -->
                            <div>
                                <form id="calendar-event-form" style="background: var(--bg-tertiary); padding: 1rem; border-radius: var(--border-radius-lg); margin-bottom: 1rem;">
                                    <h4 style="margin-bottom: 1rem;">Add Event</h4>
                                    <div class="form-group" style="margin-bottom: 0.75rem;">
                                        <label for="event-title" style="font-size: 0.9rem;">Title *</label>
                                        <input type="text" id="event-title" required placeholder="Event title" style="padding: 0.75rem;">
                                    </div>
                                    <div class="form-group" style="margin-bottom: 0.75rem;">
                                        <label for="event-date" style="font-size: 0.9rem;">Date *</label>
                                        <input type="date" id="event-date" required style="padding: 0.75rem;">
                                    </div>
                                    <div class="form-group" style="margin-bottom: 0.75rem;">
                                        <label for="event-type" style="font-size: 0.9rem;">Type</label>
                                        <select id="event-type" style="padding: 0.75rem;">
                                            <option value="exam">📝 Exam</option>
                                            <option value="assignment">📋 Assignment</option>
                                            <option value="holiday">🎉 Holiday</option>
                                            <option value="meeting">👥 Meeting</option>
                                            <option value="personal">🔒 Personal</option>
                                        </select>
                                    </div>
                                    <button type="submit" class="btn btn-primary" style="width: 100%; padding: 0.75rem;">
                                        Add Event
                                    </button>
                                </form>
                                
                                <div style="background: var(--bg-tertiary); padding: 1rem; border-radius: var(--border-radius-lg);">
                                    <h4 style="margin-bottom: 1rem;">Events This Month</h4>
                                    <div id="events-list" style="max-height: 250px; overflow-y: auto;">
                                        ${this.renderEventsList()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderCalendarGrid() {
        const year = this.currentCalendarYear;
        const month = this.currentCalendarMonth;
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();
        const today = new Date();

        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        // Update header
        setTimeout(() => {
            const header = document.getElementById('calendar-month-year');
            if (header) header.textContent = `${monthNames[month]} ${year}`;
        }, 0);

        let html = '<div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px;">';

        // Day headers
        dayNames.forEach(day => {
            html += `<div style="padding: 0.5rem; text-align: center; font-weight: 600; color: var(--text-secondary); font-size: 0.8rem;">${day}</div>`;
        });

        // Empty cells before first day
        for (let i = 0; i < startingDay; i++) {
            html += '<div style="padding: 0.75rem;"></div>';
        }

        // Days of month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            const eventsOnDay = this.getEventsForDate(dateStr);
            const hasTeacherEvent = eventsOnDay.some(e => e.is_public);
            const hasStudentEvent = eventsOnDay.some(e => !e.is_public);

            html += `
                <div onclick="app.showDayEvents('${dateStr}')" style="
                    padding: 0.5rem;
                    text-align: center;
                    cursor: pointer;
                    border-radius: var(--border-radius-sm);
                    background: ${isToday ? 'var(--gradient-primary)' : 'var(--bg-secondary)'};
                    color: ${isToday ? 'white' : 'var(--text-primary)'};
                    position: relative;
                    transition: all 0.2s;
                " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                    ${day}
                    ${hasTeacherEvent ? '<span style="position:absolute;bottom:2px;left:50%;transform:translateX(-50%);width:6px;height:6px;background:#00B894;border-radius:50%;"></span>' : ''}
                    ${hasStudentEvent ? '<span style="position:absolute;bottom:2px;right:4px;width:4px;height:4px;background:#6C5CE7;border-radius:50%;"></span>' : ''}
                </div>
            `;
        }

        html += '</div>';
        return html;
    }

    getEventsForDate(dateStr) {
        const userId = this.currentUser?.id;
        return this.calendarEvents.filter(event => {
            // Check if date matches
            if (event.event_date !== dateStr) return false;

            // Public events (teacher-created) are visible to everyone
            if (event.is_public) return true;

            // Private events (student-created) are only visible to the creator
            return event.user_id === userId;
        });
    }

    renderEventsList() {
        const year = this.currentCalendarYear;
        const month = this.currentCalendarMonth;
        const userId = this.currentUser?.id;

        const monthEvents = this.calendarEvents.filter(event => {
            const eventDate = new Date(event.event_date);
            const dateMatches = eventDate.getMonth() === month && eventDate.getFullYear() === year;

            if (!dateMatches) return false;

            // Show public events OR private events created by current user
            return event.is_public || event.user_id === userId;
        });

        if (monthEvents.length === 0) {
            return '<p style="text-align: center; color: var(--text-secondary); padding: 1rem; font-size: 0.9rem;">No events this month</p>';
        }

        const typeEmojis = {
            exam: '📝',
            assignment: '📋',
            holiday: '🎉',
            meeting: '👥',
            personal: '🔒'
        };

        return monthEvents.map(event => `
            <div style="background: var(--bg-secondary); padding: 0.75rem; border-radius: var(--border-radius-sm); margin-bottom: 0.5rem; border-left: 3px solid ${event.is_public ? '#00B894' : '#6C5CE7'};">
                <div style="font-weight: 600; font-size: 0.9rem;">${typeEmojis[event.event_type] || '📌'} ${this.escapeHtml(event.title)}</div>
                <div style="color: var(--text-secondary); font-size: 0.8rem; margin-top: 0.25rem;">
                    ${new Date(event.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    ${event.is_public ? '<span style="color: #00B894;"> • Public</span>' : '<span style="color: #6C5CE7;"> • Private</span>'}
                </div>
            </div>
        `).join('');
    }

    changeMonth(delta) {
        this.currentCalendarMonth += delta;
        if (this.currentCalendarMonth > 11) {
            this.currentCalendarMonth = 0;
            this.currentCalendarYear++;
        } else if (this.currentCalendarMonth < 0) {
            this.currentCalendarMonth = 11;
            this.currentCalendarYear--;
        }
        document.getElementById('calendar-grid').innerHTML = this.renderCalendarGrid();
        document.getElementById('events-list').innerHTML = this.renderEventsList();
    }

    showDayEvents(dateStr) {
        const events = this.getEventsForDate(dateStr);
        if (events.length === 0) {
            this.showNotification(`No events on ${dateStr}`, 'info');
        } else {
            const titles = events.map(e => e.title).join(', ');
            this.showNotification(`Events: ${titles}`, 'info');
        }
    }

    async addCalendarEvent() {
        const title = document.getElementById('event-title').value;
        const eventDate = document.getElementById('event-date').value;
        const eventType = document.getElementById('event-type').value;

        if (!title || !eventDate) {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }

        const isTeacher = this.currentUser.role === 'teacher';

        // If teacher AND not personal event, make it public
        const isPublic = isTeacher && eventType !== 'personal';

        const event = {
            id: Date.now().toString(),
            title,
            event_date: eventDate,
            event_type: eventType,
            is_public: isPublic,
            user_id: this.currentUser.id,
            user_name: this.currentUser.name,
            section: this.currentUser.section,
            created_at: new Date().toISOString()
        };

        if (supabaseClient) {
            try {
                const { error } = await supabaseClient
                    .from('calendar_events')
                    .insert([event]);

                if (error) {
                    console.error('Error saving calendar event:', error);
                    this.showNotification('Failed to add event', 'error');
                    return;
                }
            } catch (error) {
                console.error('Error:', error);
            }
        }

        this.calendarEvents.push(event);
        this.saveToStorage('edubridge_calendar', this.calendarEvents);

        // Add notification and reminder
        if (isPublic) {
            this.addNotificationItem('calendar', `📅 New Event: ${title} on ${eventDate}`, event.id);
        }
        this.scheduleReminder(event);

        document.getElementById('calendar-event-form').reset();
        document.getElementById('calendar-grid').innerHTML = this.renderCalendarGrid();
        document.getElementById('events-list').innerHTML = this.renderEventsList();
        this.showNotification('Event added successfully!', 'success');
    }

    scheduleReminder(event) {
        const eventDate = new Date(event.event_date);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());

        // If event is today, show reminder immediately
        if (eventDay.getTime() === today.getTime()) {
            this.showReminderToast(event);
        }

        // Store reminder in localStorage for checking on app load
        const reminders = this.loadFromStorage('edubridge_reminders') || [];
        reminders.push({
            eventId: event.id,
            title: event.title,
            date: event.event_date,
            shown: false
        });
        this.saveToStorage('edubridge_reminders', reminders);
    }

    checkReminders() {
        const reminders = this.loadFromStorage('edubridge_reminders') || [];
        const today = new Date().toISOString().split('T')[0];

        reminders.forEach((reminder, index) => {
            if (reminder.date === today && !reminder.shown) {
                setTimeout(() => {
                    this.showReminderToast({ title: reminder.title, event_date: reminder.date });
                    reminders[index].shown = true;
                    this.saveToStorage('edubridge_reminders', reminders);
                }, 2000 + (index * 3000));
            }
        });
    }

    showReminderToast(event) {
        const toast = document.createElement('div');
        toast.className = 'reminder-toast';
        toast.innerHTML = `
            <div class="reminder-toast-header">
                <h4>⏰ Event Today!</h4>
                <button class="reminder-toast-close" onclick="this.parentElement.parentElement.remove()">✕</button>
            </div>
            <div class="reminder-toast-content">
                <strong>${this.escapeHtml(event.title)}</strong><br>
                Scheduled for today (${event.event_date})
            </div>
        `;
        document.body.appendChild(toast);

        setTimeout(() => {
            if (toast.parentElement) toast.remove();
        }, 10000);
    }

    // ==========================================
    // CONTACT FEATURE
    // ==========================================

    createContactModal() {
        return `
            <div class="modal-overlay">
                <div class="modal" style="max-width: 700px;">
                    <div class="modal-header">
                        <h2>📞 Contact Us</h2>
                        <button class="modal-close" onclick="app.closeModal()">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>
                    <div class="modal-content">
                        <!-- Contact Info -->
                        <div style="background: var(--bg-tertiary); padding: 2rem; border-radius: var(--border-radius-lg); margin-bottom: 1.5rem;">
                            <h3 style="margin-bottom: 1.5rem; font-size: 1.25rem;">📬 Get In Touch</h3>
                            
                            <div class="contact-item" style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; padding: 1rem; background: var(--bg-secondary); border-radius: var(--border-radius-md);">
                                <div class="contact-item-icon" style="width: 45px; height: 45px; background: var(--gradient-primary); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" style="width: 22px; height: 22px;">
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                                        <polyline points="22,6 12,13 2,6"/>
                                    </svg>
                                </div>
                                <div>
                                    <h4 style="font-weight: 600; margin-bottom: 0.25rem;">Email Us</h4>
                                    <a href="mailto:suhaschandrakala47@gmail.com" style="color: var(--primary); text-decoration: none;">suhaschandrakala47@gmail.com</a><br>
                                    <a href="mailto:oneforalldeku39@gmail.com" style="color: var(--primary); text-decoration: none;">oneforalldeku39@gmail.com</a>
                                </div>
                            </div>
                            
                            <div class="contact-item" style="display: flex; align-items: center; gap: 1rem; padding: 1rem; background: var(--bg-secondary); border-radius: var(--border-radius-md);">
                                <div class="contact-item-icon" style="width: 45px; height: 45px; background: linear-gradient(135deg, #00B894 0%, #00CEC9 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" style="width: 22px; height: 22px;">
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                        <circle cx="12" cy="10" r="3"/>
                                    </svg>
                                </div>
                                <div>
                                    <h4 style="font-weight: 600; margin-bottom: 0.25rem;">Connect With Us</h4>
                                    <p style="color: var(--text-secondary);">We're here to help with your educational needs!</p>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Pricing Section -->
                        <div class="pricing-card" style="background: var(--bg-tertiary); padding: 2rem; border-radius: var(--border-radius-lg); position: relative; overflow: hidden;">
                            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 4px; background: var(--gradient-primary);"></div>
                            <h3 style="margin-bottom: 1.5rem; font-size: 1.25rem;">💼 Our Services</h3>
                            
                            <div class="pricing-item" style="display: flex; justify-content: space-between; align-items: center; padding: 1.25rem; background: var(--bg-secondary); border-radius: var(--border-radius-md); margin-bottom: 1rem; border: 2px solid transparent; transition: all 0.3s;" onmouseover="this.style.borderColor='var(--primary)';this.style.transform='translateX(5px)'" onmouseout="this.style.borderColor='transparent';this.style.transform='translateX(0)'">
                                <div>
                                    <span style="font-weight: 600; font-size: 1.1rem;">🌐 Website Development</span>
                                    <p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 0.25rem;">Custom website design & development</p>
                                </div>
                                <div style="text-align: right;">
                                    <span class="pricing-item-price" style="font-size: 1.75rem; font-weight: 700; background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">₹200</span>
                                </div>
                            </div>
                            
                            <div class="pricing-item" style="display: flex; justify-content: space-between; align-items: center; padding: 1.25rem; background: var(--bg-secondary); border-radius: var(--border-radius-md); border: 2px solid transparent; transition: all 0.3s;" onmouseover="this.style.borderColor='var(--primary)';this.style.transform='translateX(5px)'" onmouseout="this.style.borderColor='transparent';this.style.transform='translateX(0)'">
                                <div>
                                    <span style="font-weight: 600; font-size: 1.1rem;">📱 App Development</span>
                                    <p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 0.25rem;">Mobile application development</p>
                                </div>
                                <div style="text-align: right;">
                                    <span class="pricing-item-price" style="font-size: 1.75rem; font-weight: 700; background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">₹300</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Footer Note -->
                        <div style="text-align: center; margin-top: 1.5rem; padding: 1rem; background: var(--bg-secondary); border-radius: var(--border-radius-md);">
                            <p style="color: var(--text-secondary); font-size: 0.9rem;">
                                💡 Contact us via email for custom quotes and project discussions!
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // ==========================================
    // NOTIFICATION SYSTEM
    // ==========================================

    toggleNotificationPanel() {
        const panel = document.getElementById('notification-panel');
        if (panel) {
            panel.classList.toggle('active');
            this.updateNotificationBadge();
        }
    }

    addNotificationItem(type, message, refId = null) {
        const notification = {
            id: Date.now().toString(),
            type,
            message,
            refId,
            read: false,
            created_at: new Date().toISOString()
        };

        this.notifications.unshift(notification);
        this.saveToStorage('edubridge_notifications', this.notifications);
        this.updateNotificationBadge();
        this.renderNotificationList();
    }

    updateNotificationBadge() {
        const badge = document.getElementById('notification-badge');
        const unreadCount = this.notifications.filter(n => !n.read).length;

        if (badge) {
            badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
            badge.style.display = unreadCount > 0 ? 'flex' : 'none';
        }
    }

    renderNotificationList() {
        const listElement = document.getElementById('notification-list');
        if (!listElement) return;

        if (this.notifications.length === 0) {
            listElement.innerHTML = '<p class="no-notifications">No new notifications</p>';
            return;
        }

        const typeIcons = {
            notes: '📚',
            communication: '💬',
            announcement: '📢',
            calendar: '📅',
            attendance: '✅'
        };

        listElement.innerHTML = this.notifications.slice(0, 20).map(notif => {
            const icon = typeIcons[notif.type] || '🔔';
            const timeAgo = this.getTimeAgo(notif.created_at);

            return `
                <div class="notification-item ${notif.read ? 'read' : 'unread'}" onclick="app.markNotificationRead('${notif.id}')" style="
                    padding: 0.75rem;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                    cursor: pointer;
                    background: ${notif.read ? 'transparent' : 'rgba(99, 102, 241, 0.1)'};
                    transition: background 0.2s;
                " onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background='${notif.read ? 'transparent' : 'rgba(99, 102, 241, 0.1)'}'"
                >
                    <div style="display: flex; align-items: flex-start; gap: 0.75rem;">
                        <span style="font-size: 1.25rem;">${icon}</span>
                        <div style="flex: 1;">
                            <p style="font-size: 0.9rem; color: var(--text-primary); margin-bottom: 0.25rem;">${this.escapeHtml(notif.message)}</p>
                            <span style="font-size: 0.75rem; color: var(--text-tertiary);">${timeAgo}</span>
                        </div>
                        ${!notif.read ? '<span style="width: 8px; height: 8px; background: var(--primary); border-radius: 50%;"></span>' : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    markNotificationRead(notifId) {
        const notif = this.notifications.find(n => n.id === notifId);
        if (notif) {
            notif.read = true;
            this.saveToStorage('edubridge_notifications', this.notifications);
            this.updateNotificationBadge();
            this.renderNotificationList();
        }
    }

    clearNotifications() {
        this.notifications = [];
        this.saveToStorage('edubridge_notifications', []);
        this.updateNotificationBadge();
        this.renderNotificationList();
        this.showNotification('All notifications cleared', 'success');
    }

    getTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    }
}

// Animation keyframes for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }
`;
document.head.appendChild(style);

// Initialize app
// Initialize app globally
window.app = new EdubridgeApp();

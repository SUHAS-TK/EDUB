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

        // Hide startup animation after 4 seconds
        setTimeout(() => {
            document.getElementById('startup-animation').style.display = 'none';
            document.getElementById('login-screen').classList.remove('hidden');
        }, 4000);

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

        // 🔥 Load notes from Supabase BEFORE showing notes modal
        if (feature === 'notes' && supabaseClient) {
            await this.loadNotesFromSupabase();
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
                        <strong>📚 Section ${this.currentUser.section || 'A'} - Student-Teacher Chat</strong>
                    </div>
                    `}
                    
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
        // Filter messages based on current channel and section
        const currentChannel = this.currentChannel || 'students';
        const userSection = this.currentUser.section || 'A';

        let filteredMessages = this.messages.filter(msg => {
            // Teacher-to-teacher channel
            if (currentChannel === 'teachers') {
                return msg.channel === 'teachers';
            }

            // Student-teacher channel (section-based)
            return msg.channel === 'students' && msg.section === userSection;
        });

        if (filteredMessages.length === 0) {
            const channelName = currentChannel === 'teachers' ? 'Teachers Only' : `Section ${userSection} Chat`;
            return `<p style="text-align: center; color: var(--text-secondary);">No messages in ${channelName} yet. Start a conversation!</p>`;
        }

        return filteredMessages.map(msg => `
        <div style="margin-bottom: 1rem; ${msg.sender === this.currentUser.email ? 'text-align: right;' : ''}">
            <div style="display: inline-block; max-width: 70%; background: ${msg.sender === this.currentUser.email ? 'var(--gradient-primary)' : 'var(--bg-secondary)'}; padding: 1rem; border-radius: var(--border-radius-md);">
                <div style="font-weight: 600; margin-bottom: 0.25rem; font-size: 0.9rem;">
                    ${msg.senderName} <span style="opacity: 0.7; font-size: 0.8rem;">(${msg.senderRole})</span>
                </div>
                <div>${msg.message}</div>
                <div style="margin-top: 0.5rem; font-size: 0.75rem; opacity: 0.7;">${new Date(msg.timestamp).toLocaleTimeString()}</div>
            </div>
        </div>
    `).join('');
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
                                    <div style="font-weight: 600; margin-bottom: 0.5rem;">AI Assistant</div>
                                    <div>Hello! I'm your AI learning assistant. I can help you with:</div>
                                    <ul style="margin-top: 0.5rem; padding-left: 1.5rem;">
                                        <li>Answering questions about your subjects</li>
                                        <li>Explaining difficult concepts</li>
                                        <li>Providing study tips and resources</li>
                                        <li>Helping with homework and assignments</li>
                                    </ul>
                                    <div style="margin-top: 0.5rem;">How can I help you today?</div>
                                </div>
                            </div>
                            <form id="ai-chat-form" style="padding: 1.5rem; border-top: 1px solid rgba(255, 255, 255, 0.1); display: flex; gap: 1rem;">
                                <input type="text" id="ai-input" placeholder="Ask me anything..." style="flex: 1; padding: 0.75rem 1rem; background: var(--bg-secondary); border: 2px solid transparent; border-radius: var(--border-radius-sm); color: var(--text-primary);" required>
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

    downloadNote(noteId) {
        const note = this.notes.find(n => n.id === noteId);
        if (!note) return;

        // If Google Drive URL exists, show info modal
        if (note.driveUrl) {
            this.showNotification(`📎 ${note.title} - Click "Open in Google Drive" to access the file`, 'success');
            return;
        }

        // Simulate download for local files
        this.showNotification(`Downloading: ${note.title}`, 'success');

        // In a real app, this would trigger actual file download
        // For demo, we'll create a dummy text file
        const content = `EDUBRIDGE - Note Download\n\nTitle: ${note.title}\nSubject: ${note.subject}\nDescription: ${note.description}\nUploaded by: ${note.uploadedByName}\n\nThis is a simulated download. In production, this would download the actual file.`;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${note.title}.txt`;
        a.click();
        URL.revokeObjectURL(url);
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

    sendMessage() {
        const input = document.getElementById('message-input');
        const message = input.value.trim();

        if (!message) return;

        const currentChannel = this.currentChannel || 'students';
        const userSection = this.currentUser.section || 'A';

        const msg = {
            sender: this.currentUser.email,
            senderName: this.currentUser.name,
            senderRole: this.currentUser.role,
            message,
            timestamp: Date.now(),
            channel: currentChannel,  // 'students' or 'teachers'
            section: userSection      // Section for filtering
        };

        this.messages.push(msg);
        this.saveToStorage('edubridge_messages', this.messages);

        // Update UI
        document.getElementById('messages-container').innerHTML = this.renderMessages();
        input.value = '';

        // Scroll to bottom
        const container = document.getElementById('messages-container');
        container.scrollTop = container.scrollHeight;
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

    closeModal() {
        document.getElementById('modals-container').innerHTML = '';
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
const app = new EdubridgeApp();

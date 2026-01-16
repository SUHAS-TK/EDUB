// ==========================================
// Supabase Storage Manager for EDUBRIDGE
// Handles all cloud storage operations
// ==========================================

class SupabaseStorageManager {
    constructor() {
        this.useCloud = false;
        this.initialized = false;
        this.currentUser = null;
    }

    // Initialize Supabase
    async initialize() {
        if (typeof supabase === 'undefined') {
            console.warn('⚠️ Supabase SDK not loaded. Using localStorage.');
            return false;
        }

        if (!isSupabaseConfigured()) {
            console.warn('⚠️ Supabase not configured. Using localStorage.');
            return false;
        }

        try {
            this.useCloud = initializeSupabase();
            this.initialized = this.useCloud;

            if (this.useCloud) {
                console.log('✅ Cloud storage enabled (Supabase)');

                // Set up auth state listener
                supabaseClient.auth.onAuthStateChange((event, session) => {
                    if (session?.user) {
                        this.currentUser = session.user;
                        console.log('👤 User signed in:', session.user.email);
                    } else {
                        this.currentUser = null;
                    }
                });
            }

            return this.useCloud;
        } catch (error) {
            console.error('❌ Supabase initialization error:', error);
            return false;
        }
    }

    // ==========================================
    // USER AUTHENTICATION
    // ==========================================

    async registerUser(email, password, name, role) {
        if (!this.useCloud) {
            return this.registerUserLocal(email, password, name, role);
        }

        try {
            // Create user account
            const { data: authData, error: authError } = await supabaseClient.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        name: name,
                        role: role
                    }
                }
            });

            if (authError) throw authError;

            // Store additional user data in users table
            const { error: dbError } = await supabaseClient
                .from('users')
                .insert([
                    {
                        id: authData.user.id,
                        email: email,
                        name: name,
                        role: role,
                        created_at: new Date().toISOString()
                    }
                ]);

            if (dbError) throw dbError;

            return {
                success: true,
                user: { email, name, role },
                message: 'Account created! Please check your email to verify.'
            };
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: error.message };
        }
    }

    async loginUser(email, password) {
        if (!this.useCloud) {
            return this.loginUserLocal(email, password);
        }

        try {
            // Sign in with Supabase Auth
            const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (authError) throw authError;

            // Get user data from users table
            const { data: userData, error: dbError } = await supabaseClient
                .from('users')
                .select('*')
                .eq('id', authData.user.id)
                .single();

            if (dbError) throw dbError;

            return {
                success: true,
                user: {
                    id: userData.id,
                    email: userData.email,
                    name: userData.name,
                    role: userData.role
                }
            };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message };
        }
    }

    async logoutUser() {
        if (!this.useCloud) {
            this.currentUser = null;
            return { success: true };
        }

        try {
            const { error } = await supabaseClient.auth.signOut();
            if (error) throw error;

            this.currentUser = null;
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            return { success: false, error: error.message };
        }
    }

    getCurrentUser() {
        return this.currentUser;
    }

    // ==========================================
    // NOTES MANAGEMENT
    // ==========================================

    async saveNote(note) {
        if (!this.useCloud) {
            return this.saveNoteLocal(note);
        }

        try {
            const { data, error } = await supabaseClient
                .from('notes')
                .insert([
                    {
                        ...note,
                        user_id: this.currentUser?.id,
                        created_at: new Date().toISOString()
                    }
                ])
                .select();

            if (error) throw error;

            return { success: true, id: data[0].id, note: data[0] };
        } catch (error) {
            console.error('Save note error:', error);
            return { success: false, error: error.message };
        }
    }

    async getNotes() {
        if (!this.useCloud) {
            return this.getNotesLocal();
        }

        try {
            const { data, error } = await supabaseClient
                .from('notes')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            return { success: true, notes: data };
        } catch (error) {
            console.error('Get notes error:', error);
            return { success: false, error: error.message };
        }
    }

    async uploadFile(file, path) {
        if (!this.useCloud) {
            return { success: false, error: 'File upload requires cloud storage' };
        }

        try {
            const fileName = `${Date.now()}_${file.name}`;
            const filePath = `${path}/${fileName}`;

            const { data, error } = await supabaseClient.storage
                .from('notes-files')
                .upload(filePath, file);

            if (error) throw error;

            // Get public URL
            const { data: urlData } = supabaseClient.storage
                .from('notes-files')
                .getPublicUrl(filePath);

            return {
                success: true,
                url: urlData.publicUrl,
                path: filePath
            };
        } catch (error) {
            console.error('File upload error:', error);
            return { success: false, error: error.message };
        }
    }

    // ==========================================
    // ATTENDANCE MANAGEMENT
    // ==========================================

    async saveAttendance(record) {
        if (!this.useCloud) {
            return this.saveAttendanceLocal(record);
        }

        try {
            const { data, error } = await supabaseClient
                .from('attendance')
                .insert([
                    {
                        ...record,
                        user_id: this.currentUser?.id,
                        timestamp: new Date().toISOString()
                    }
                ])
                .select();

            if (error) throw error;

            return { success: true, id: data[0].id };
        } catch (error) {
            console.error('Save attendance error:', error);
            return { success: false, error: error.message };
        }
    }

    async getAttendance() {
        if (!this.useCloud) {
            return this.getAttendanceLocal();
        }

        try {
            const { data, error } = await supabaseClient
                .from('attendance')
                .select('*')
                .order('timestamp', { ascending: false });

            if (error) throw error;

            return { success: true, records: data };
        } catch (error) {
            console.error('Get attendance error:', error);
            return { success: false, error: error.message };
        }
    }

    // ==========================================
    // MESSAGES MANAGEMENT
    // ==========================================

    async saveMessage(message) {
        if (!this.useCloud) {
            return this.saveMessageLocal(message);
        }

        try {
            const { data, error } = await supabaseClient
                .from('messages')
                .insert([
                    {
                        ...message,
                        user_id: this.currentUser?.id,
                        timestamp: new Date().toISOString()
                    }
                ])
                .select();

            if (error) throw error;

            return { success: true, id: data[0].id };
        } catch (error) {
            console.error('Save message error:', error);
            return { success: false, error: error.message };
        }
    }

    async getMessages() {
        if (!this.useCloud) {
            return this.getMessagesLocal();
        }

        try {
            const { data, error } = await supabaseClient
                .from('messages')
                .select('*')
                .order('timestamp', { ascending: true });

            if (error) throw error;

            return { success: true, messages: data };
        } catch (error) {
            console.error('Get messages error:', error);
            return { success: false, error: error.message };
        }
    }

    // Real-time message subscription
    subscribeToMessages(callback) {
        if (!this.useCloud) {
            return () => { }; // Return empty unsubscribe function
        }

        const subscription = supabaseClient
            .channel('messages')
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages' },
                (payload) => {
                    callback(payload.new);
                }
            )
            .subscribe();

        return () => subscription.unsubscribe();
    }

    // ==========================================
    // LOCALSTORAGE FALLBACK METHODS
    // ==========================================

    registerUserLocal(email, password, name, role) {
        const users = JSON.parse(localStorage.getItem('edubridge_users') || '{}');

        if (users[email]) {
            return { success: false, error: 'Email already registered' };
        }

        users[email] = { email, password, name, role };
        localStorage.setItem('edubridge_users', JSON.stringify(users));

        return { success: true, user: { email, name, role } };
    }

    loginUserLocal(email, password) {
        const users = JSON.parse(localStorage.getItem('edubridge_users') || '{}');
        const user = users[email];

        if (!user) {
            return { success: false, error: 'User not found' };
        }

        if (user.password !== password) {
            return { success: false, error: 'Incorrect password' };
        }

        this.currentUser = user;
        return { success: true, user };
    }

    saveNoteLocal(note) {
        const notes = JSON.parse(localStorage.getItem('edubridge_notes') || '[]');
        notes.push({ ...note, id: Date.now().toString() });
        localStorage.setItem('edubridge_notes', JSON.stringify(notes));
        return { success: true };
    }

    getNotesLocal() {
        const notes = JSON.parse(localStorage.getItem('edubridge_notes') || '[]');
        return { success: true, notes };
    }

    saveAttendanceLocal(record) {
        const attendance = JSON.parse(localStorage.getItem('edubridge_attendance') || '[]');
        attendance.push(record);
        localStorage.setItem('edubridge_attendance', JSON.stringify(attendance));
        return { success: true };
    }

    getAttendanceLocal() {
        const records = JSON.parse(localStorage.getItem('edubridge_attendance') || '[]');
        return { success: true, records };
    }

    saveMessageLocal(message) {
        const messages = JSON.parse(localStorage.getItem('edubridge_messages') || '[]');
        messages.push(message);
        localStorage.setItem('edubridge_messages', JSON.stringify(messages));
        return { success: true };
    }

    getMessagesLocal() {
        const messages = JSON.parse(localStorage.getItem('edubridge_messages') || '[]');
        return { success: true, messages };
    }
}

// Create global instance
const supabaseStorage = new SupabaseStorageManager();

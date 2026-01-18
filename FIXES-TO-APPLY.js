// ==========================================
// 🔥 CRITICAL FIXES FOR APP.JS
// COPY THESE FUNCTIONS INTO APP.JS
// ==========================================

// ==========================================
// FIX #1: downloadNote - Download actual PDF from Storage
// Replace the existing downloadNote function (around line 1020)
// ==========================================
async downloadNote(noteId) {
    const note = this.notes.find(n => n.id === noteId);
    if (!note) {
        this.showNotification('❌ Note not found', 'error');
        return;
    }

    // ✅ Handle Google Drive URLs
    if (note.driveUrl || note.file_url?.includes('drive.google.com')) {
        const driveLink = note.driveUrl || note.file_url;
        window.open(driveLink, '_blank');
        this.showNotification(`📎 Opening ${note.title} in Google Drive`, 'info');
        return;
    }

    // ✅ Handle Supabase Storage URLs - DOWNLOAD ACTUAL PDF
    if (note.file_url) {
        try {
            this.showNotification(`📥 Downloading ${note.file_name || note.title}...`, 'info');

            // Open PDF in new tab (browser will handle download/view based on user settings)
            window.open(note.file_url, '_blank');

            // Alternative: Force download
            // Uncomment this if you want to force download instead of opening:
            /*
            const response = await fetch(note.file_url);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = note.file_name || `${note.title}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            */

            this.showNotification(`✅ ${note.file_name || note.title} opened!`, 'success');
        } catch (error) {
            console.error('Download error:', error);
            this.showNotification('❌ Download failed: ' + error.message, 'error');
        }
        return;
    }

    // Fallback for old localStorage notes
    this.showNotification('⚠️ This note has no downloadable file', 'warning');
}

// ==========================================  
// FIX #2: Private Messaging System
// Add these NEW functions to the EdubridgeApp class
// ==========================================

// Initialize private messaging
async initPrivateMessaging() {
    if (!supabaseClient) return;

    try {
        // Load list of all users for messaging
        const { data: users, error } = await supabaseClient
            .from('users')
            .select('id, name, email, role, section')
            .order('name');

        if (error) throw error;

        this.allUsers = users || [];
        console.log('✅ Loaded users for messaging:', this.allUsers.length);
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// Create PRIVATE messaging modal (replaces old communication modal)
createPrivateMessagingModal() {
    const currentRole = this.currentUser.role;

    // Get list of users to message
    let contactList = [];
    if (currentRole === 'student') {
        // Students can message teachers only
        contactList = (this.allUsers || []).filter(u => u.role === 'teacher');
    } else {
        // Teachers can message students  
        contactList = (this.allUsers || []).filter(u => u.role === 'student');
    }

    return `
        <div class="modal-overlay">
            <div class="modal" style="max-width: 900px;">
                <div class="modal-header">
                    <h2>💬 Private Messages</h2>
                    <button class="modal-close" onclick="app.closeModal()">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                <div class="modal-content" style="display: flex; gap: 1.5rem; min-height: 500px;">
                    <!-- LEFT: Contact List -->
                    <div style="flex: 0 0 250px; border-right: 1px solid rgba(255,255,255,0.1); padding-right: 1.5rem;">
                        <h3 style="margin-bottom: 1rem; font-size: 0.9rem; text-transform: uppercase; opacity: 0.7;">
                            ${currentRole === 'student' ? 'Teachers' : 'Students'}
                        </h3>
                        <div id="contact-list" style="display: flex; flex-direction: column; gap: 0.5rem;">
                            ${this.renderContactList(contactList)}
                        </div>
                    </div>
                    
                    <!-- RIGHT: Messages -->
                    <div style="flex: 1; display: flex; flex-direction: column;">
                        <div id="selected-contact-header" style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--border-radius-md); margin-bottom: 1rem;">
                            <strong>Select a contact to start messaging</strong>
                        </div>
                        
                        <div style="flex: 1; background: var(--bg-tertiary); border-radius: var(--border-radius-lg); display: flex; flex-direction: column;">
                            <div id="private-messages-container" style="flex: 1; overflow-y: auto; padding: 1.5rem; min-height: 300px;">
                                <p style="text-align: center; color: var(--text-secondary); padding: 2rem;">
                                    Select a contact to view messages
                                </p>
                            </div>
                            
                            <form id="send-private-message-form" style="padding: 1.5rem; border-top: 1px solid rgba(255, 255, 255, 0.1); display: none;">
                                <div style="display: flex; gap: 1rem;">
                                    <input type="text" id="private-message-input" placeholder="Type your message..." style="flex: 1; padding: 0.75rem 1rem; background: var(--bg-secondary); border: 2px solid transparent; border-radius: var(--border-radius-sm); color: var(--text-primary);" required>
                                    <button type="submit" class="btn btn-primary" style="width: auto; padding: 0.75rem 1.5rem;">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
                                            <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                                        </svg>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Render contact list
renderContactList(contacts) {
    if (!contacts || contacts.length === 0) {
        return '<p style="color: var(--text-secondary); font-size: 0.9rem;">No contacts available</p>';
    }

    return contacts.map(contact => `
        <button 
            class="contact-item" 
            data-user-id="${contact.id}"
            data-user-name="${contact.name}"
            data-user-email="${contact.email}"
            onclick="app.selectContact('${contact.id}', '${contact.name}')"
            style="
                width: 100%;
                padding: 0.75rem;
                background: var(--bg-secondary);
                border: 2px solid transparent;
                border-radius: var(--border-radius-sm);
                text-align: left;
                cursor: pointer;
                transition: all 0.2s;
                color: var(--text-primary);
            "
            onmouseover="this.style.background='var(--bg-tertiary)'; this.style.borderColor='var(--primary)';"
            onmouseout="this.style.background='var(--bg-secondary)'; this.style.borderColor='transparent';"
        >
            <div style="font-weight: 600; margin-bottom: 0.25rem;">${contact.name}</div>
            <div style="font-size: 0.8rem; opacity: 0.7;">
                ${contact.role === 'teacher' ? '👩‍🏫 Teacher' : '👨‍🎓 Student'}
                ${contact.section ? ` (Sec ${contact.section})` : ''}
            </div>
        </button>
    `).join('');
}

// Select a contact to chat with
async selectContact(userId, userName) {
    this.selectedContactId = userId;
    this.selectedContactName = userName;

    // Update header
    const header = document.getElementById('selected-contact-header');
    if (header) {
        header.innerHTML = `<strong>💬 Chat with ${userName}</strong>`;
    }

    // Show message form
    const form = document.getElementById('send-private-message-form');
    if (form) {
        form.style.display = 'block';
    }

    // Highlight selected contact
    document.querySelectorAll('.contact-item').forEach(btn => {
        if (btn.dataset.userId === userId) {
            btn.style.background = 'var(--gradient-primary)';
            btn.style.borderColor = 'var(--primary)';
        } else {
            btn.style.background = 'var(--bg-secondary)';
            btn.style.borderColor = 'transparent';
        }
    });

    // Load messages with this contact
    await this.loadPrivateMessages(userId);
}

// Load private messages with specific user
async loadPrivateMessages(contactId) {
    if (!supabaseClient) {
        document.getElementById('private-messages-container').innerHTML =
            '<p style="text-align: center; color: var(--text-secondary);">Cloud messaging not available (Supabase not configured)</p>';
        return;
    }

    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return;

        // Get messages between current user and selected contact
        const { data: messages, error } = await supabaseClient
            .from('private_messages')
            .select(`
                *,
                sender:sender_id(name, email, role),
                recipient:recipient_id(name, email, role)
            `)
            .or(`and(sender_id.eq.${user.id},recipient_id.eq.${contactId}),and(sender_id.eq.${contactId},recipient_id.eq.${user.id})`)
            .order('created_at', { ascending: true });

        if (error) throw error;

        this.privateMessages = messages || [];
        this.renderPrivateMessages();

    } catch (error) {
        console.error('Error loading private messages:', error);
        document.getElementById('private-messages-container').innerHTML =
            `<p style="text-align: center; color: var(--error);">Error loading messages: ${error.message}</p>`;
    }
}

// Render private messages
renderPrivateMessages() {
    const container = document.getElementById('private-messages-container');
    if (!container) return;

    if (!this.privateMessages || this.privateMessages.length === 0) {
        container.innerHTML = `
            <p style="text-align: center; color: var(--text-secondary); padding: 2rem;">
                No messages yet. Start the conversation!
            </p>
        `;
        return;
    }

    container.innerHTML = this.privateMessages.map(msg => {
        const isSentByMe = msg.sender_id === this.currentUser.id;
        const senderName = msg.sender?.name || 'Unknown';
        const msgTime = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return `
            <div style="margin-bottom: 1rem; ${isSentByMe ? 'text-align: right;' : ''}">
                <div style="display: inline-block; max-width: 70%; background: ${isSentByMe ? 'var(--gradient-primary)' : 'var(--bg-secondary)'}; padding: 1rem; border-radius: var(--border-radius-md);">
                    ${!isSentByMe ? `<div style="font-weight: 600; margin-bottom: 0.25rem; font-size: 0.9rem;">${senderName}</div>` : ''}
                    <div>${msg.message}</div>
                    <div style="margin-top: 0.5rem; font-size: 0.75rem; opacity: 0.7;">${msgTime}</div>
                </div>
            </div>
        `;
    }).join('');

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

// Send private message
async sendPrivateMessage(e) {
    if (e) e.preventDefault();

    const input = document.getElementById('private-message-input');
    const message = input.value.trim();

    if (!message || !this.selectedContactId) return;

    if (!supabaseClient) {
        this.showNotification('❌ Cloud messaging not available', 'error');
        return;
    }

    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) {
            this.showNotification('❌ Please login again', 'error');
            return;
        }

        // Insert private message
        const { data, error } = await supabaseClient
            .from('private_messages')
            .insert([{
                sender_id: user.id,
                recipient_id: this.selectedContactId,
                message: message
            }])
            .select();

        if (error) throw error;

        input.value = '';

        // Reload messages
        await this.loadPrivateMessages(this.selectedContactId);

        this.showNotification('✅ Message sent!', 'success');

    } catch (error) {
        console.error('Error sending message:', error);
        this.showNotification('❌ Failed to send message: ' + error.message, 'error');
    }
}

// ==========================================
// FIX #3: Update openFeature to use private messaging
// Replace the 'communication' case in openFeature function
// ==========================================
/*
In the openFeature function, replace:
    case 'communication':
        modalContent = this.createCommunicationModal();
        break;

WITH:
    case 'communication':
        await this.initPrivateMessaging();
        modalContent = this.createPrivateMessagingModal();
        break;
*/

// ==========================================
// FIX #4: Update setupModalListeners for private messaging
// Replace the 'communication' case in setupModalListeners
// ==========================================
/*
In setupModalListeners function, replace:
    case 'communication':
        document.getElementById('send-message-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendMessage();
        });
        break;

WITH:
    case 'communication':
        const privateForm = document.getElementById('send-private-message-form');
        if (privateForm) {
            privateForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.sendPrivateMessage(e);
            });
        }
        break;
*/

// ==========================================
// 📋 INSTALLATION INSTRUCTIONS
// ==========================================
/*
1. OPEN app.js
2. FIND the downloadNote function (around line 1020)
3. REPLACE it with the new downloadNote function above
4. SCROLL to the bottom of the EdubridgeApp class (before the closing bracket)
5. ADD all the new private messaging functions
6. UPDATE openFeature function - change 'communication' case to use createPrivateMessagingModal()
7. UPDATE setupModalListeners function - change 'communication' case to use sendPrivateMessage()
8. SAVE the file
9. RUN the SQL script SETUP-PRIVATE-MESSAGING.sql in Supabase
10. REFRESH your browser
*/

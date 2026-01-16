// ==========================================
// Supabase Configuration for EDUBRIDGE
// Secure Cloud Storage & Database
// ==========================================

const SUPABASE_CONFIG = {
    // 👇 PASTE YOUR SUPABASE CREDENTIALS HERE
    // Get them from: https://supabase.com/dashboard/project/_/settings/api

    url: "https://vawblwlvnwwajmdxhryz.supabase.co", // Your Supabase URL (e.g., https://xxxxx.supabase.co)
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhd2Jsd2x2bnd3YWptZHhocnl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0OTM1ODIsImV4cCI6MjA4NDA2OTU4Mn0.38jzQWS_W-bmkUQSCE7JYwVB3bI1Q_taxfx4zDh-GMw", // Your anon/public key

    // Optional: Service role key (keep this SECRET - only use on server)
    serviceRoleKey: "" // Leave empty for now
};

// Check if Supabase is configured
function isSupabaseConfigured() {
    return SUPABASE_CONFIG.url &&
        SUPABASE_CONFIG.url.trim() !== '' &&
        SUPABASE_CONFIG.anonKey &&
        SUPABASE_CONFIG.anonKey.trim() !== '';
}

// Initialize Supabase client (will be called from app)
let supabaseClient = null;

function initializeSupabase() {
    if (!isSupabaseConfigured()) {
        console.warn('⚠️ Supabase not configured. Using localStorage fallback.');
        return false;
    }

    if (typeof supabase === 'undefined') {
        console.error('❌ Supabase library not loaded!');
        return false;
    }

    try {
        supabaseClient = supabase.createClient(
            SUPABASE_CONFIG.url,
            SUPABASE_CONFIG.anonKey
        );

        console.log('✅ Supabase initialized successfully!');
        return true;
    } catch (error) {
        console.error('❌ Supabase initialization error:', error);
        return false;
    }
}

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SUPABASE_CONFIG, initializeSupabase, isSupabaseConfigured };
}

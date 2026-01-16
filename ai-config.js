// ==========================================
// AI Configuration for EDUBRIDGE
// Multiple FREE AI Providers Supported!
// ==========================================

const AI_CONFIG = {
    // Choose your AI provider:
    // 'assemblyai' - AssemblyAI (FREE: 5 hours/month - VOICE AI)
    // 'gemini' - Google Gemini (FREE: 60 req/min, 1500/day)
    // 'simulation' - No API needed (demo/testing)
    provider: 'assemblyai', // 👈 Using AssemblyAI for voice-based AI

    // ==========================================
    // GOOGLE GEMINI CONFIGURATION
    // ==========================================
    // Get FREE API key: https://makersuite.google.com/app/apikey
    gemini: {
        apiKey: '', // PASTE YOUR GEMINI API KEY HERE
        model: 'gemini-pro',
        temperature: 0.7,
        maxTokens: 1000,
    },

    // ==========================================
    // HUGGING FACE CONFIGURATION
    // ==========================================
    // Get FREE API key: https://huggingface.co/settings/tokens
    huggingface: {
        apiKey: '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', // PASTE YOUR HUGGING FACE TOKEN HERE

        // Choose a model (all FREE!):
        // 'meta-llama/Llama-2-7b-chat-hf' - Fast, good for education
        // 'mistralai/Mixtral-8x7B-Instruct-v0.1' - Very powerful
        // 'microsoft/phi-2' - Small, fast, educational
        // 'google/flan-t5-xxl' - Good for Q&A
        model: 'microsoft/phi-2', // 👈 DEFAULT: Fast & educational

        temperature: 0.7,
        maxTokens: 500,
        topP: 0.95,

        // CORS Fix: Set to true to use Hugging Face in browser (for testing only!)
        // For production, build a backend proxy
        useCorsProxy: true, // ✅ Enables browser access
    },

    // ==========================================
    // SHARED CONFIGURATION
    // ==========================================
    // System prompt for educational context
    systemPrompt: `You are a helpful AI learning assistant for EDUBRIDGE, an educational platform. 
Your role is to:
- Help students understand difficult concepts
- Provide clear, concise explanations
- Encourage critical thinking
- Give study tips and learning strategies
- Answer questions across various subjects
- Be encouraging and supportive
- Keep responses educational and appropriate
- Use simple language for complex topics

Be friendly, patient, and educational in all responses.`,

    // Timeout settings
    timeout: 30000, // 30 seconds
};

// Check if current provider is configured
function isAIConfigured() {
    const provider = AI_CONFIG.provider;

    if (provider === 'assemblyai') {
        // Check if assemblyai is available and configured
        return typeof assemblyAI !== 'undefined' && assemblyAI.isConfigured();
    } else if (provider === 'gemini') {
        return AI_CONFIG.gemini.apiKey && AI_CONFIG.gemini.apiKey.trim() !== '';
    } else if (provider === 'huggingface') {
        return AI_CONFIG.huggingface.apiKey && AI_CONFIG.huggingface.apiKey.trim() !== '';
    } else if (provider === 'simulation') {
        return true; // Always configured
    }

    return false;
}

// Get provider name for display
function getProviderName() {
    const provider = AI_CONFIG.provider;
    if (provider === 'assemblyai') return 'AssemblyAI (Voice)';
    if (provider === 'gemini') return 'Google Gemini';
    if (provider === 'huggingface') return 'Hugging Face';
    if (provider === 'simulation') return 'Simulation Mode';
    return 'Unknown';
}

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AI_CONFIG;
}

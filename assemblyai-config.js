// ==========================================
// AssemblyAI Configuration for EDUBRIDGE
// Real-time Transcription & AI Audio Analysis
// ==========================================

const ASSEMBLYAI_CONFIG = {
    // Get your FREE API key from: https://www.assemblyai.com/
    // Free tier: 5 hours of transcription per month
    apiKey: 'ba619cdeefce4e598ecd652573f18708', // 👈 PASTE YOUR ASSEMBLYAI API KEY HERE

    // API Base URL
    baseURL: 'https://api.assemblyai.com/v2',

    // ==========================================
    // TRANSCRIPTION SETTINGS
    // ==========================================
    transcription: {
        // Automatically detect the language (supports 99+ languages)
        language_detection: true,

        // Speaker diarization (identify different speakers)
        speaker_labels: true,

        // Automatic punctuation and capitalization
        punctuate: true,
        format_text: true,

        // Filter profanity (recommended for educational content)
        filter_profanity: true,

        // Summarization of long audio files
        auto_chapters: true,
        summarization: true,
        summary_model: 'informative',
        summary_type: 'bullets',

        // Entity detection (dates, names, places, etc.)
        entity_detection: true,

        // Sentiment analysis
        sentiment_analysis: true,

        // Content moderation
        content_safety: true,

        // Topic detection
        iab_categories: true,
    },

    // ==========================================
    // REAL-TIME TRANSCRIPTION
    // ==========================================
    realtime: {
        // WebSocket configuration
        sample_rate: 16000,
        encoding: 'pcm_s16le',
        word_boost: [], // Add custom vocabulary here

        // Interim results (real-time feedback)
        interim_results: true,
    },

    // ==========================================
    // USE CASES FOR EDUBRIDGE
    // ==========================================
    features: {
        // 1. LECTURE TRANSCRIPTION
        // Teachers can record lectures and get automatic transcriptions
        // with speaker identification and summaries
        lectureMode: {
            enabled: true,
            speaker_labels: true,
            auto_chapters: true,
            summarization: true,
        },

        // 2. STUDENT VOICE NOTES
        // Students can submit voice assignments instead of written ones
        voiceAssignments: {
            enabled: true,
            punctuate: true,
            sentiment_analysis: true,
        },

        // 3. REAL-TIME CAPTIONS
        // Live lecture captions for accessibility
        liveCaptions: {
            enabled: true,
            interim_results: true,
            language_detection: true,
        },

        // 4. CONTENT SAFETY
        // Detect inappropriate content in student submissions
        contentSafety: {
            enabled: true,
            content_safety: true,
            filter_profanity: true,
        },
    },
};

// ==========================================
// ASSEMBLYAI API HELPER FUNCTIONS
// ==========================================

class AssemblyAIAgent {
    constructor() {
        this.apiKey = ASSEMBLYAI_CONFIG.apiKey;
        this.baseURL = ASSEMBLYAI_CONFIG.baseURL;
    }

    // Check if API key is configured
    isConfigured() {
        return this.apiKey && this.apiKey.trim() !== '';
    }

    // Upload audio file to AssemblyAI
    async uploadAudio(audioFile) {
        if (!this.isConfigured()) {
            throw new Error('AssemblyAI API key not configured');
        }

        const formData = new FormData();
        formData.append('file', audioFile);

        const response = await fetch(`${this.baseURL}/upload`, {
            method: 'POST',
            headers: {
                'Authorization': this.apiKey,
            },
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
        }

        const data = await response.json();
        return data.upload_url;
    }

    // Start transcription
    async transcribe(audioURL, options = {}) {
        if (!this.isConfigured()) {
            throw new Error('AssemblyAI API key not configured');
        }

        const transcriptionOptions = {
            audio_url: audioURL,
            ...ASSEMBLYAI_CONFIG.transcription,
            ...options,
        };

        const response = await fetch(`${this.baseURL}/transcript`, {
            method: 'POST',
            headers: {
                'Authorization': this.apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(transcriptionOptions),
        });

        if (!response.ok) {
            throw new Error(`Transcription request failed: ${response.statusText}`);
        }

        const data = await response.json();
        return data.id;
    }

    // Poll for transcription result
    async getTranscript(transcriptId) {
        if (!this.isConfigured()) {
            throw new Error('AssemblyAI API key not configured');
        }

        const response = await fetch(`${this.baseURL}/transcript/${transcriptId}`, {
            headers: {
                'Authorization': this.apiKey,
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to get transcript: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    }

    // Wait for transcription to complete
    async waitForCompletion(transcriptId, maxRetries = 60, interval = 3000) {
        let retries = 0;

        while (retries < maxRetries) {
            const transcript = await this.getTranscript(transcriptId);

            if (transcript.status === 'completed') {
                return transcript;
            } else if (transcript.status === 'error') {
                throw new Error(`Transcription failed: ${transcript.error}`);
            }

            // Wait before next poll
            await new Promise(resolve => setTimeout(resolve, interval));
            retries++;
        }

        throw new Error('Transcription timeout');
    }

    // Real-time transcription (WebSocket)
    createRealtimeTranscriber(onTranscript, onError) {
        if (!this.isConfigured()) {
            throw new Error('AssemblyAI API key not configured');
        }

        // First, get a temporary token
        return fetch(`${this.baseURL}/realtime/token`, {
            headers: {
                'Authorization': this.apiKey,
            },
        })
            .then(response => response.json())
            .then(data => {
                const socket = new WebSocket(
                    `wss://api.assemblyai.com/v2/realtime/ws?sample_rate=${ASSEMBLYAI_CONFIG.realtime.sample_rate}&token=${data.token}`
                );

                socket.onmessage = (event) => {
                    const result = JSON.parse(event.data);
                    if (result.message_type === 'FinalTranscript' || result.message_type === 'PartialTranscript') {
                        onTranscript(result);
                    }
                };

                socket.onerror = (error) => {
                    if (onError) onError(error);
                };

                return socket;
            });
    }

    // Transcribe lecture (with chapters and summary)
    async transcribeLecture(audioFile) {
        const uploadURL = await this.uploadAudio(audioFile);
        const transcriptId = await this.transcribe(uploadURL, {
            speaker_labels: true,
            auto_chapters: true,
            summarization: true,
        });

        return await this.waitForCompletion(transcriptId);
    }

    // Transcribe student voice assignment
    async transcribeAssignment(audioFile) {
        const uploadURL = await this.uploadAudio(audioFile);
        const transcriptId = await this.transcribe(uploadURL, {
            sentiment_analysis: true,
            entity_detection: true,
        });

        return await this.waitForCompletion(transcriptId);
    }
}

// Create global instance
const assemblyAI = new AssemblyAIAgent();

// Check if configured
function isAssemblyAIConfigured() {
    return assemblyAI.isConfigured();
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ASSEMBLYAI_CONFIG, AssemblyAIAgent, assemblyAI };
}

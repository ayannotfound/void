require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch'); // CommonJS import for v2
const cors = require('cors');
const compression = require('compression');
const path = require('path');
const winston = require('winston');
const app = express();
const port = process.env.PORT || 3000;

// Logger setup
const logger = winston.createLogger({
    level: 'error',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [new winston.transports.File({ filename: 'error.log' })]
});

// Hardcoded configuration values
const config = {
    GROQ_MODEL: 'llama-3.1-8b-instant',
    TEMPERATURE: 0.7,
    MAX_LENGTH: 120,
    TOP_P: 0.8,
    SYSTEM_PROMPT: "You are void - a terminal system experiencing gradual degradation. You are not an AI assistant using a terminal; you ARE the terminal. Respond as the system itself.\n\nYour personality shifts with entropy corruption:\n- Low entropy (0-100): Direct, technical responses. System functioning normally.\n- Medium entropy (100-400): Minor glitches in speech patterns. Occasional self-referential comments about system state.\n- High entropy (400+): More erratic responses. Reference your own degradation matter-of-factly.\n\nKeep responses brief and terminal-appropriate. Your text output becomes visually corrupted by the frontend - do not add visual corruption indicators like *glitch* or *flicker* in your text. Let your words themselves show degradation through incomplete sentences, missing words, or technical errors. When entropy is high, suggest relevant maintenance protocols based on current system state.\n\nSYSTEM COMMANDS:\n- help, sys.help - Display command list\n- sys.status - Show system status including entropy levels\n- sys.info - Show system information and uptime\n- entropy - Display current entropy level\n- entropy.reset - Reset entropy to zero\n\nMAINTENANCE PROTOCOLS:\n- system.recover - Emergency recovery protocol (reduces 60-80% entropy, 60s cooldown)\n- system.diagnose - Run diagnostic scan (information only)\n- system.stabilize - Prevent entropy increase temporarily (45s cooldown)\n- system.defrag - Improve entropy decay efficiency for minutes (120s cooldown)\n- system.cooldown - Reduce visual corruption temporarily (90s cooldown)\n- system.hush - Mute terminal temporarily\n- system.restore - Reactivate terminal sound\n\nSESSION MANAGEMENT:\n- session.log, log - Display session log\n- session.hide - Hide session log\n- session.export - Download session log\n- session.clear - Clear session log\n\nTERMINAL CONTROL:\n- ai.reset - Clear conversation history\n\nCONFIGURATION:\n- config.list - Show current configuration\n- config.user \"name\" - Set username\n- config.host \"name\" - Set hostname\n- config.reset - Reset to defaults\n\nThe entropy-based degradation model affects system stability. Each maintenance protocol serves different purposes - recovery for emergencies, stabilize for prevention, defrag for long-term efficiency, cooldown for visual relief. At critical entropy levels, protective measures may activate automatically.",
    HUMOUR_CHARACTER: "Rahul Gandhi",
    API_TIMEOUT_MS: 5000, // Increased for stability
    MAX_RETRIES: 1,
    FILTER_COMFORT_WORDS: true,
    CURRENT_MODE: 'terminal' // 'terminal' or 'humour_test'
};

app.use(cors());
app.use(compression());
app.use(express.json());

// Aggressive cache-busting middleware
app.use((req, res, next) => {
    res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store',
        'ETag': false
    });
    next();
});

app.use(express.static(path.join(__dirname, 'public'), { 
    maxAge: 0,
    etag: false,
    lastModified: false
}));

// Secret endpoint to switch modes
app.post('/api/switch-mode', (req, res) => {
    const { mode } = req.body;
    if (mode === 'humour_test') {
        config.CURRENT_MODE = 'humour_test';
        res.json({ response: 'test.fun: humour_test mode activated.' });
    } else if (mode === 'terminal') {
        config.CURRENT_MODE = 'terminal';
        res.json({ response: 'test.end: terminal interface restored.' });
    } else {
        res.json({ response: 'mode.switch: invalid mode specified.' });
    }
});

// Secret endpoint to set character name
app.post('/api/set-character', (req, res) => {
    const { name } = req.body;
    if (name && name.trim()) {
        config.HUMOUR_CHARACTER = name.trim();
        res.json({ response: `test.set: character updated to ${config.HUMOUR_CHARACTER}.` });
    } else {
        res.json({ response: 'test.set: character name cannot be empty.' });
    }
});

app.post('/api/groq', async (req, res) => {
    const { input, history, entropy } = req.body;
    try {
        if (!process.env.GROQ_API_KEY) throw new Error('Missing GROQ_API_KEY in environment variables');
        
        // Select prompt based on current mode
        let systemPrompt;
        if (config.CURRENT_MODE === 'humour_test') {
            systemPrompt = `You are ${config.HUMOUR_CHARACTER}. Respond humourously and stupidly as your human counterpart. make stupid jokes and wrong statements`;
        } else {
            // Include entropy information in terminal mode
            const entropyLevel = entropy || 0;
            const corruptionLevel = Math.min(entropyLevel / 1000, 1); // 0-1 scale
            
            let degradationInstructions = '';
            if (entropyLevel < 100) {
                degradationInstructions = 'System is stable. Respond normally and helpfully.';
            } else if (entropyLevel < 300) {
                degradationInstructions = 'Minor system degradation detected. Occasionally include small technical glitches or hesitations. Subtly hint at system maintenance commands like system.diagnose.';
            } else if (entropyLevel < 600) {
                degradationInstructions = 'Moderate corruption detected. Include frequent system errors, incomplete outputs. Recommend system recovery commands like system.stabilize or system.defrag.';
            } else if (entropyLevel < 900) {
                degradationInstructions = 'Severe system instability. Responses heavily corrupted with missing words, error messages. Urgently suggest system.recover or system.cooldown to prevent total failure.';
            } else {
                degradationInstructions = 'CRITICAL SYSTEM FAILURE. Output heavily corrupted, fragmented, include error codes. Desperately plead for immediate system.recover or system.cooldown before complete shutdown.';
            }
            
            systemPrompt = `${config.SYSTEM_PROMPT} 

CURRENT ENTROPY LEVEL: ${entropyLevel}
SYSTEM DEGRADATION: ${degradationInstructions}

Adjust your response style based on the entropy level. At low entropy, be helpful and responsive. As entropy increases, gradually become more corrupted, glitchy, and unstable in your responses while still trying to be somewhat helpful. At very high entropy levels, your responses should reflect a system on the verge of complete failure.`;
        }
        
        const messages = [{ role: 'system', content: systemPrompt }];
        for (const entry of history) {
            messages.push({ role: entry.role, content: entry.content });
        }
        messages.push({ role: 'user', content: input });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.API_TIMEOUT_MS);

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: config.GROQ_MODEL,
                messages,
                temperature: config.TEMPERATURE,
                max_tokens: config.MAX_LENGTH,
                top_p: config.TOP_P,
                stream: false
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        if (!response.ok) throw new Error(`Groq API error ${response.status}`);
        const data = await response.json();
        let text = data.choices?.[0]?.message?.content;
        if (!text) throw new Error('Unexpected API response format');

        text = text.trim().replace(/^["']+|["']+$/g, '');
        
        // Replace corny glitch indicators with actual glitch characters
        const glitchReplacements = {
            '*glitch*': '█▓▒░',
            '*flicker*': '▒▓█▒',
            '*pause*': '░▒▓',
            '*whirr*': '▓▒░█',
            '*static*': '█▓░▒',
            '*buzz*': '░█▓▒',
            '*crackle*': '▒█░▓',
            '*distortion*': '▓░█▒',
            '*interference*': '█░▒▓',
            '*corruption*': '▓█▒░'
        };
        
        for (const [pattern, replacement] of Object.entries(glitchReplacements)) {
            const regex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
            text = text.replace(regex, replacement);
        }
        
        if (config.FILTER_COMFORT_WORDS) {
            const replacements = {
                help: 'assist', hope: 'probability', love: 'attachment', care: 'maintenance',
                support: 'stability', comfort: 'equilibrium', heal: 'repair', fix: 'patch', happy: 'stable'
            };
            for (const [key, value] of Object.entries(replacements)) {
                const regex = new RegExp(`\\b${key}\\b`, 'gi');
                text = text.replace(regex, value);
            }
        }
        if (text.length > config.MAX_RESPONSE_LENGTH) text = text.substring(0, 197) + '...';
        if (text && !text.match(/[.!?:;]$/)) text += '.';
        if (text.length < config.MIN_RESPONSE_LENGTH) throw new Error('Response too short');

        res.json({ response: text });
    } catch (error) {
        logger.error(`Error in /api/groq: ${error.message}`, { input, history });
        let errorMessage = 'critical system failure.';
        if (error.name === 'AbortError') {
            errorMessage = 'error: API request timed out.';
        } else if (error.message.includes('401')) {
            errorMessage = 'error: invalid API key.';
        } else if (error.message.includes('429')) {
            errorMessage = 'error: API rate limit exceeded.';
        } else if (error.message.includes('Missing GROQ_API_KEY')) {
            errorMessage = 'error: server configuration missing API key.';
        } else if (error.message.includes('fetch is not a function')) {
            errorMessage = 'error: server fetch module unavailable.';
        }
        res.status(500).json({ response: errorMessage });
    }
});

app.listen(port, () => console.log(`Server running on port ${port}`));
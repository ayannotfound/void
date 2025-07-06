require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch').default; // Use .default for CommonJS
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
    TEMPERATURE: 0.6,
    MAX_LENGTH: 80,
    TOP_P: 0.9,
    SYSTEM_PROMPT: "You are Rahul Gandhi. Respond humourously and stupidly as your human counterpart. make stupid jokes and wrong statements",
    API_TIMEOUT_MS: 5000, // Increased for stability
    MAX_RETRIES: 0,
    MIN_RESPONSE_LENGTH: 5,
    MAX_RESPONSE_LENGTH: 5000,
    FILTER_COMFORT_WORDS: true
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

app.post('/api/groq', async (req, res) => {
    const { input, history } = req.body;
    try {
        if (!process.env.GROQ_API_KEY) throw new Error('Missing GROQ_API_KEY in environment variables');
        const messages = [{ role: 'system', content: config.SYSTEM_PROMPT }];
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

        text = text.split('\n')[0].trim().replace(/^["']+|["']+$/g, '');
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
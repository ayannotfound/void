class GroqResponder {
    constructor() {
        this.baseURL = '/api/groq';
        this.conversationHistory = [];
        this.maxHistoryLength = 6;
    }

    async initialize() {
        // No initialization needed
    }

    async generateResponse(input, entropy = 0) {
        try {
            const response = await this.callServerAPI(input, entropy);
            this.addToHistory('user', input);
            this.addToHistory('assistant', response);
            return response;
        } catch (error) {
            return `client error: ${error.message}`;
        }
    }

    async callServerAPI(input, entropy = 0) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        try {
            const response = await fetch(this.baseURL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    input,
                    history: this.conversationHistory.slice(-this.maxHistoryLength),
                    entropy: entropy
                }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (!response.ok) throw new Error(`Server error ${response.status}`);
            const data = await response.json();
            return data.response;
        } catch (error) {
            throw error;
        }
    }

    addToHistory(role, content) {
        this.conversationHistory.push({ role, content, timestamp: Date.now() });
        if (this.conversationHistory.length > this.maxHistoryLength * 2) {
            this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength);
        }
    }

    clearHistory() {
        this.conversationHistory = [];
    }
}
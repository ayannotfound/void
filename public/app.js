class VoidOS {
    constructor() {
        this.input = document.getElementById('input');
        this.output = document.getElementById('output');
        this.cursor = document.getElementById('cursor');
        this.log = document.getElementById('log');
        this.prompt = document.getElementById('prompt');
        this.sessionLog = [];
        this.silenceMode = false;
        this.logVisible = false;
        this.isLoggedIn = false;
        this.loginStep = 'boot';
        this.tempUsername = '';
        this.username = localStorage.getItem('you_os_username') || 'user';
        this.hostname = localStorage.getItem('you_os_hostname') || 'void';
        this.groqResponder = new GroqResponder();
        this.initialized = false;
        this.startTime = Date.now();
        this.isTyping = false;
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.focusInput();
        await this.startBootSequence();
    }

    async startBootSequence() {
        const bootMessages = [
            'void v1.0-a',
            '',
            'Initializing core...',
            'Loading existential modules...',
            'Calibrating sensors...',
            'System active.',
            '',
            '[ALERT] ALERT: unauthorized access attempted, login required.',
            '',
        ];
        this.prompt.textContent = '';
        this.input.style.display = 'none';
        
        for (const msg of bootMessages) {
            await this.delay(400);
            this.displayBootMessage(msg);
        }
        await this.delay(800);
        this.startLogin();
    }

    displayBootMessage(text) {
        const element = document.createElement('div');
        if (text.startsWith('[ALERT]')) {
            element.className = 'boot-alert';
            const textSpan = document.createElement('span');
            textSpan.className = 'typing-text';
            textSpan.textContent = text.replace('[ALERT]', '').trim();
            element.appendChild(textSpan);
        } else {
            element.className = 'boot-message';
            element.textContent = text;
        }
        this.output.appendChild(element);
        this.output.scrollTop = this.output.scrollHeight;
    }

    startLogin() {
        this.loginStep = 'username';
        this.prompt.textContent = 'login: ';
        this.input.style.display = 'block';
        this.focusInput();
    }

    async handleLogin(input) {
        if (this.loginStep === 'username') {
            this.tempUsername = input;
            await this.displayUserInput(input, 'login: ');
            await this.displayResponse(`user ${input} authenticated.`);
            await this.delay(500);
            await this.completeLogin();
        }
    }

    async completeLogin() {
        this.username = this.tempUsername || 'user';
        localStorage.setItem('you_os_username', this.username);
        this.input.type = 'text';
        this.isLoggedIn = true;
        this.setupTerminalScrolling();
        await this.initializeSystem();
        this.updatePrompt();
        await this.displayResponse('');
        await this.displayResponse(`Welcome to void, ${this.username}.`);
        await this.displayResponse('Type "system.help" for commands or just speak to the void.');
        await this.displayResponse('system status: critical');
        await this.displayResponse('');
    }

    async initializeSystem() {
        try {
            await this.groqResponder.initialize();
            this.initialized = true;
        } catch (error) {
            this.initialized = false;
            await this.displayResponse('error: failed to initialize system.');
        }
    }

    setupEventListeners() {
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.processInput();
            }
        });
        
        // Better mobile support
        const focusInput = () => {
            // Prevent focus on log overlay
            if (!this.logVisible) {
                this.focusInput();
            }
        };
        
        document.addEventListener('click', focusInput);
        document.addEventListener('touchstart', focusInput);
        document.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Handle virtual keyboard on mobile
        this.input.addEventListener('blur', () => {
            // Delay refocus to prevent infinite loop on mobile
            setTimeout(() => {
                if (!this.logVisible && document.hasFocus()) {
                    this.focusInput();
                }
            }, 100);
        });
        
        // Prevent zoom on iOS when keyboard appears
        this.input.addEventListener('focus', () => {
            // Scroll to bottom when keyboard appears
            setTimeout(() => this.scrollToBottom(), 300);
        });
        
        // Handle mobile keyboard hide/show
        window.addEventListener('resize', () => {
            // Re-scroll to bottom when keyboard changes viewport
            setTimeout(() => this.scrollToBottom(), 100);
        });
    }

    updatePrompt() {
        const now = new Date();
        const date = now.toLocaleDateString('en-GB').replace(/\//g, '-');
        const time = now.toLocaleTimeString('en-GB', { hour12: false }).slice(0, 5);
        this.prompt.textContent = `${this.username}@${this.hostname} ${date} ${time}>`;
    }

    focusInput() {
        this.input.focus();
        this.input.setSelectionRange(this.input.value.length, this.input.value.length);
    }


    async processInput() {
        const userInput = this.input.value.trim();
        if (!userInput && this.isLoggedIn) return;
        
        // Block input if system is typing
        if (this.isTyping) {
            this.input.value = userInput; // Restore the input
            // Flash the prompt to indicate system is busy
            this.prompt.style.opacity = '0.3';
            setTimeout(() => {
                if (this.prompt) this.prompt.style.opacity = '1';
            }, 200);
            return;
        }
        
        // Clear input IMMEDIATELY
        this.input.value = '';
        
        if (!this.isLoggedIn) {
            this.isTyping = true;
            await this.handleLogin(userInput);
            this.isTyping = false;
            return;
        }
        
        this.isTyping = true;
        
        await this.displayUserInput(userInput);
        
        if (await this.handleSystemCommand(userInput)) {
            this.updatePrompt();
            this.isTyping = false;
            return;
        }
        
        this.logInteraction(userInput, '');
        
        if (!this.silenceMode) {
            const response = await this.getResponse(userInput);
            await this.displayResponse(response);
            this.updateLog(response);
        } else {
            const responseElement = document.createElement('div');
            responseElement.className = 'response typing';
            responseElement.innerHTML = '<span class="typing-text">...</span>';
            this.output.appendChild(responseElement);
            this.scrollToBottom();
            await this.delay(500);
            responseElement.className = 'response typing fade-out';
            await this.delay(500);
            responseElement.remove();
        }
        
        this.updatePrompt();
        this.isTyping = false;
    }

    async handleSystemCommand(input) {
        const cmd = input.toLowerCase();
        switch (cmd) {
            // System commands
            case 'sys.help':
            case 'help':
                await this.showHelp();
                return true;
            case 'sys.status':
                await this.showStatus();
                return true;
            case 'sys.info':
                await this.showSystemInfo();
                return true;
            
            // Session management
            case 'session.log':
            case 'log':
                this.showLog();
                return true;
            case 'session.hide':
                this.hideLog();
                return true;
            case 'session.export':
                await this.exportLog();
                return true;
            case 'session.clear':
                await this.clearLog();
                return true;
            
            // AI control
            case 'ai.silence':
                this.silenceMode = true;
                await this.displayResponse('ai.silence: enabled.');
                return true;
            case 'ai.resume':
                this.silenceMode = false;
                await this.displayResponse('ai.resume: enabled.');
                return true;
            case 'ai.reset':
                await this.clearConversationHistory();
                return true;
            
            // User configuration
            case 'config.list':
                await this.showConfig();
                return true;
            case 'config.reset':
                await this.resetConfig();
                return true;
            
            default:
                if (cmd.startsWith('config.user ')) {
                    await this.setUser(cmd.substring(12));
                    return true;
                }
                if (cmd.startsWith('config.host ')) {
                    await this.setHost(cmd.substring(12));
                    return true;
                }
                return false;
        }
    }

    async getResponse(input) {
        if (!this.initialized) return 'system initializing...';
        try {
            const response = await this.groqResponder.generateResponse(input);
            return response || 'system error: no response generated.';
        } catch (error) {
            return 'critical system failure.';
        }
    }

    async displayUserInput(input, customPrompt = null) {
        const userElement = document.createElement('div');
        userElement.className = 'user-input';
        const textSpan = document.createElement('span');
        textSpan.className = 'typing-text';
        userElement.appendChild(textSpan);
        this.output.appendChild(userElement);
        const displayText = customPrompt
            ? `${customPrompt}${input}`
            : `${this.username}@${this.hostname} ${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')} ${new Date().toLocaleTimeString('en-GB', { hour12: false }).slice(0, 5)}> ${input}`;
        textSpan.textContent = displayText;
        this.scrollToBottom();
    }

    async displayResponse(text) {
        if (!text) return;
        const responseElement = document.createElement('div');
        responseElement.className = 'response typing';
        const textSpan = document.createElement('span');
        textSpan.className = 'typing-text';
        responseElement.appendChild(textSpan);
        this.output.appendChild(responseElement);
        this.scrollToBottom();
        const lines = text.split('\n').filter(line => line.trim());
        let fullText = '';
        for (const line of lines) {
            let currentText = fullText;
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (Math.random() < 0.05 && char.match(/[a-zA-Z0-9]/)) {
                    const wrongChar = String.fromCharCode(char.charCodeAt(0) + Math.floor(Math.random() * 5));
                    textSpan.textContent = currentText + wrongChar;
                    await this.delay(40);
                    textSpan.textContent = currentText;
                    await this.delay(30);
                }
                if (Math.random() < 0.02) {
                    const glitchChar = ['#', '%', '$', '!', '@', '*', '?'][Math.floor(Math.random() * 7)];
                    textSpan.textContent = currentText + glitchChar;
                    await this.delay(20);
                    textSpan.textContent = currentText;
                    await this.delay(20);
                }
                if (Math.random() < 0.01 && currentText.length > 0) {
                    textSpan.textContent = currentText.slice(0, -1);
                    await this.delay(30);
                    textSpan.textContent = currentText;
                }
                if (Math.random() < 0.007 && i > 3) {
                    textSpan.textContent = currentText + char + char;
                    await this.delay(25);
                }
                currentText += char;
                textSpan.textContent = currentText;
                this.scrollToBottom();
                if (['.', ',', '-', ':', ';'].includes(char)) {
                    await this.delay(120 + Math.random() * 80);
                } else if (char === ' ') {
                    await this.delay(30 + Math.random() * 20);
                } else {
                    await this.delay(20 + Math.random() * 35);
                }
            }
            if (line !== lines[lines.length - 1]) {
                currentText += '\n';
                fullText = currentText;
                textSpan.textContent = currentText;
                this.scrollToBottom();
                await this.delay(300);
            }
        }
        responseElement.classList.remove('typing');
        this.cleanupOldMessages();
        this.updateLog(text);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    scrollToBottom() {
        this.output.scrollTop = this.output.scrollHeight;
    }

    setupTerminalScrolling() {
        let userScrolledUp = false;
        this.output.addEventListener('scroll', () => {
            const { scrollTop, scrollHeight, clientHeight } = this.output;
            userScrolledUp = !(scrollTop + clientHeight >= scrollHeight - 5);
        });
        this.originalScrollToBottom = this.scrollToBottom;
        this.scrollToBottom = () => {
            if (!userScrolledUp) this.originalScrollToBottom();
        };
        this.input.addEventListener('focus', () => {
            userScrolledUp = false;
            this.originalScrollToBottom();
        });
    }

    cleanupOldMessages() {
        const maxMessages = 50;
        const children = this.output.children;
        while (children.length > maxMessages) {
            this.output.removeChild(this.output.firstChild);
        }
    }

    logInteraction(input, output) {
        this.sessionLog.push({ timestamp: new Date().toISOString(), input, output });
    }

    updateLog(output) {
        if (this.sessionLog.length > 0) {
            this.sessionLog[this.sessionLog.length - 1].output = output;
        }
    }

    showLog() {
        this.logVisible = true;
        this.log.classList.remove('hidden');
        this.renderLog();
    }

    hideLog() {
        this.logVisible = false;
        this.log.classList.add('hidden');
    }

    renderLog() {
        this.log.innerHTML = this.sessionLog.map(entry => `
            <div class="log-entry">
                <span class="log-timestamp">[${new Date(entry.timestamp).toLocaleTimeString()}]</span>
                <span class="log-input">> ${entry.input}</span>
                ${entry.output ? `<br><span class="log-timestamp">[${new Date(entry.timestamp).toLocaleTimeString()}]</span><span class="log-output">${entry.output}</span>` : ''}
            </div>
        `).join('');
        this.log.scrollTop = this.log.scrollHeight;
    }

    async exportLog() {
        const logData = this.sessionLog.map(entry => {
            const time = new Date(entry.timestamp).toISOString();
            return `[${time}] > ${entry.input}\n${entry.output ? `[${time}] ${entry.output}\n` : ''}`;
        }).join('\n');
        const blob = new Blob([logData], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `you.os-session-${new Date().toISOString().split('T')[0]}.log`;
        a.click();
        URL.revokeObjectURL(url);
        await this.displayResponse('session.export: log file downloaded.');
    }

    async clearLog() {
        this.sessionLog = [];
        if (this.logVisible) this.renderLog();
        await this.displayResponse('session.clear: log entries purged.');
    }

    async clearConversationHistory() {
        if (this.groqResponder) {
            this.groqResponder.clearHistory();
            await this.displayResponse('ai.reset: conversation history cleared.');
        }
    }

    async setUser(username) {
        if (!username || username.trim() === '') {
            await this.displayResponse('config.user: error - username cannot be empty.');
            return;
        }
        this.username = username.trim().replace(/"/g, '');
        localStorage.setItem('you_os_username', this.username);
        this.updatePrompt();
        await this.displayResponse(`config.user: set to ${this.username}`);
    }

    async setHost(hostname) {
        if (!hostname || hostname.trim() === '') {
            await this.displayResponse('config.host: error - hostname cannot be empty.');
            return;
        }
        this.hostname = hostname.trim().replace(/"/g, '');
        localStorage.setItem('you_os_hostname', this.hostname);
        this.updatePrompt();
        await this.displayResponse(`config.host: set to ${this.hostname}`);
    }

    async showHelp() {
        const helpLines = [
            'system commands:',
            '',
            'sys.help, help - show this help menu',
            'sys.status - show system status',
            'sys.info - show system information',
            '',
            'session.log, log - display session log',
            'session.hide - hide session log',
            'session.export - download session log',
            'session.clear - clear session log',
            '',
            'ai.silence - disable ai responses',
            'ai.resume - enable ai responses',
            'ai.reset - clear conversation history',
            '',
            'config.list - show current configuration',
            'config.user "name" - set username',
            'config.host "name" - set hostname',
            'config.reset - reset to defaults'
        ];
        for (const line of helpLines) {
            await this.displayResponse(line);
        }
    }

    async showStatus() {
        const status = [
            `system.status: ${this.initialized ? 'operational' : 'degraded'}`,
            `ai.status: ${this.silenceMode ? 'silenced' : 'active'}`,
            `session.entries: ${this.sessionLog.length}`,
            `session.visible: ${this.logVisible ? 'true' : 'false'}`,
            `user.identity: ${this.username}@${this.hostname}`
        ];
        for (const line of status) {
            await this.displayResponse(line);
        }
    }

    async showSystemInfo() {
        const info = [
            'void terminal v1.0',
            'powered by groq llama-3.1-8b-instant',
            'existential command processor',
            `uptime: ${Math.floor((Date.now() - this.startTime) / 1000)}s`,
            'status: decaying as intended'
        ];
        for (const line of info) {
            await this.displayResponse(line);
        }
    }

    async showConfig() {
        const config = [
            'current configuration:',
            `config.user: ${this.username}`,
            `config.host: ${this.hostname}`,
            `config.silence: ${this.silenceMode}`,
            `config.log_visible: ${this.logVisible}`,
            `config.session_count: ${this.sessionLog.length}`
        ];
        for (const line of config) {
            await this.displayResponse(line);
        }
    }

    async resetConfig() {
        this.username = 'user';
        this.hostname = 'void';
        this.silenceMode = false;
        localStorage.setItem('you_os_username', this.username);
        localStorage.setItem('you_os_hostname', this.hostname);
        this.hideLog();
        this.updatePrompt();
        await this.displayResponse('config.reset: defaults restored.');
    }
}

document.addEventListener('DOMContentLoaded', () => new VoidOS());

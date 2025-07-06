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
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.startCursorSync();
        this.focusInput();
        await this.startBootSequence();
    }

    async startBootSequence() {
        const bootMessages = [
            'you.os v1.0',
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
        await this.displayResponse(`Welcome to you.os, ${this.username}.`);
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
        document.addEventListener('click', () => this.focusInput());
        document.addEventListener('contextmenu', (e) => e.preventDefault());
        this.input.addEventListener('blur', () => setTimeout(() => this.focusInput(), 100));
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

    startCursorSync() {
        this.updateCursorPosition = () => {
            if (!this.input || !this.prompt || !this.cursor) return;
            const cursorPosition = this.input.selectionEnd || this.input.selectionStart;
            const inputLineRect = this.input.parentElement.getBoundingClientRect();
            const inputRect = this.input.getBoundingClientRect();
            const textBeforeCursor = this.input.value.substring(0, cursorPosition);
            const textWidth = this.getTextWidth(textBeforeCursor, this.input);
            this.cursor.style.left = `${inputRect.left - inputLineRect.left + textWidth}px`;
            this.cursor.style.opacity = this.input.selectionStart === this.input.selectionEnd ? '1' : '0';
        };
        this.input.addEventListener('input', this.updateCursorPosition);
        this.input.addEventListener('keyup', (e) => {
            this.updateCursorPosition();
            if (e.key === 'Enter') {
                setTimeout(this.updateCursorPosition, 0);
            }
        });
        this.input.addEventListener('click', this.updateCursorPosition);
        window.addEventListener('resize', this.updateCursorPosition);
    }

    getTextWidth(text, element) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const styles = window.getComputedStyle(element);
        context.font = `${styles.fontSize} ${styles.fontFamily}`;
        return context.measureText(text).width;
    }

    async processInput() {
        const userInput = this.input.value.trim();
        if (!userInput && this.isLoggedIn) return;
        if (!this.isLoggedIn) {
            await this.handleLogin(userInput);
            this.input.value = '';
            return;
        }
        await this.displayUserInput(userInput);
        if (this.handleSystemCommand(userInput)) {
            this.input.value = '';
            this.updatePrompt();
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
        this.input.value = '';
        this.updatePrompt();
    }

    handleSystemCommand(input) {
        const cmd = input.toLowerCase();
        switch (cmd) {
            case 'log.show':
                this.showLog();
                return true;
            case 'log.hide':
                this.hideLog();
                return true;
            case 'log.export':
                this.exportLog();
                return true;
            case 'log.clear':
                this.clearLog();
                return true;
            case 'silence.enable':
                this.silenceMode = true;
                this.displayResponse('silence mode enabled.');
                return true;
            case 'silence.disable':
                this.silenceMode = false;
                this.displayResponse('silence mode disabled.');
                return true;
            case 'history.clear':
                this.clearConversationHistory();
                return true;
            case 'system.help':
                this.showHelp();
                return true;
            default:
                if (cmd.startsWith('user.set ')) {
                    this.setUser(cmd.substring(9));
                    return true;
                }
                if (cmd.startsWith('host.set ')) {
                    this.setHost(cmd.substring(9));
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

    exportLog() {
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
        this.displayResponse('log exported.');
    }

    clearLog() {
        this.sessionLog = [];
        if (this.logVisible) this.renderLog();
        this.displayResponse('log cleared.');
    }

    clearConversationHistory() {
        if (this.groqResponder) {
            this.groqResponder.clearHistory();
            this.displayResponse('conversation history cleared.');
        }
    }

    setUser(username) {
        if (!username || username.trim() === '') {
            this.displayResponse('error: username cannot be empty.');
            return;
        }
        this.username = username.trim().replace(/"/g, '');
        localStorage.setItem('you_os_username', this.username);
        this.updatePrompt();
        this.displayResponse(`username set to: ${this.username}`);
    }

    setHost(hostname) {
        if (!hostname || hostname.trim() === '') {
            this.displayResponse('error: hostname cannot be empty.');
            return;
        }
        this.hostname = hostname.trim().replace(/"/g, '');
        localStorage.setItem('you_os_hostname', this.hostname);
        this.updatePrompt();
        this.displayResponse(`hostname set to: ${this.hostname}`);
    }

    async showHelp() {
        const helpLines = [
            'system commands:',
            'log.show - display session log',
            'log.hide - hide session log',
            'log.export - download session log',
            'log.clear - clear session log',
            'silence.enable - enable silence mode',
            'silence.disable - disable silence mode',
            'history.clear - clear conversation history',
            'user.set "name" - set username',
            'host.set "name" - set hostname',
            'system.help - show available commands'
        ];
        for (const line of helpLines) {
            await this.displayResponse(line);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => new VoidOS());
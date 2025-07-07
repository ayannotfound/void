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
        this.chaosMode = false;
        this.entropy = 0;
        this.maxEntropy = 1000;
        this.lastEntropyCheck = 0;
        
        // Audio system for glitch effects
        this.audioContext = null;
        this.audioEnabled = true;
        this.initAudioSystem();
        
        // System maintenance states
        this.stabilizationActive = false;
        this.stabilizationEnd = 0;
        this.defragActive = false;
        this.defragEnd = 0;
        this.defragEfficiency = 0;
        this.cooldownActive = false;
        this.cooldownEnd = 0;
        this.thermalEfficiency = 1.0;
        
        // Cooldown timestamps
        this.lastRecover = 0;
        this.lastStabilize = 0;
        this.lastDefrag = 0;
        this.lastCooldown = 0;
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.focusInput();
        this.startEntropyTimer();
        await this.startBootSequence();
    }
    
    initAudioSystem() {
        try {
            // Initialize Web Audio API
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.audioEnabled = true;
        } catch (error) {
            console.warn('Audio context not available:', error);
            this.audioEnabled = false;
        }
    }
    
    async resumeAudioContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
            } catch (error) {
                console.warn('Could not resume audio context:', error);
            }
        }
    }
    
    playGlitchSound(type = 'basic', intensity = 0.5) {
        if (!this.audioEnabled || !this.audioContext || this.silenceMode) return;
        
        this.resumeAudioContext();
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            
            oscillator.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Different glitch sound types
            switch (type) {
                case 'static':
                    oscillator.type = 'sawtooth';
                    oscillator.frequency.setValueAtTime(Math.random() * 800 + 200, this.audioContext.currentTime);
                    filter.type = 'highpass';
                    filter.frequency.setValueAtTime(300, this.audioContext.currentTime);
                    break;
                case 'digital':
                    oscillator.type = 'square';
                    oscillator.frequency.setValueAtTime(Math.random() * 400 + 100, this.audioContext.currentTime);
                    filter.type = 'bandpass';
                    filter.frequency.setValueAtTime(200, this.audioContext.currentTime);
                    break;
                case 'corruption':
                    oscillator.type = 'sawtooth';
                    oscillator.frequency.setValueAtTime(Math.random() * 1000 + 50, this.audioContext.currentTime);
                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(150, this.audioContext.currentTime);
                    break;
                default: // basic
                    oscillator.type = 'triangle';
                    oscillator.frequency.setValueAtTime(Math.random() * 300 + 150, this.audioContext.currentTime);
                    filter.type = 'notch';
                    filter.frequency.setValueAtTime(250, this.audioContext.currentTime);
            }
            
            // Volume based on intensity and entropy
            const volume = Math.min(intensity * 0.15, 0.3); // Keep volume reasonable
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.15);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.15);
            
        } catch (error) {
            console.warn('Audio glitch failed:', error);
        }
    }
    
    playTypingSound(char = '', entropyFactor = 0) {
        if (!this.audioEnabled || !this.audioContext || this.silenceMode) return;
        
        this.resumeAudioContext();
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            
            oscillator.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Terminal typing sound - subtle mechanical/electronic feel
            oscillator.type = 'square';
            
            // Different frequencies for different character types
            let baseFreq = 400;
            if (char.match(/[a-zA-Z]/)) {
                baseFreq = 350 + (char.charCodeAt(0) % 50); // Letters
            } else if (char.match(/[0-9]/)) {
                baseFreq = 450 + (char.charCodeAt(0) % 30); // Numbers
            } else if (char === ' ') {
                baseFreq = 200; // Space - lower tone
            } else {
                baseFreq = 500 + (char.charCodeAt(0) % 100); // Symbols
            }
            
            // Add entropy-based frequency variation
            const entropyVariation = entropyFactor * 50;
            const finalFreq = baseFreq + (Math.random() - 0.5) * entropyVariation;
            
            oscillator.frequency.setValueAtTime(finalFreq, this.audioContext.currentTime);
            
            // Filter for terminal-like sound
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(400, this.audioContext.currentTime);
            filter.Q.setValueAtTime(2, this.audioContext.currentTime);
            
            // Volume - very subtle, entropy affects intensity
            const baseVolume = 0.03; // Very quiet typing sound
            const entropyBoost = Math.min(entropyFactor * 0.02, 0.05);
            const volume = baseVolume + entropyBoost;
            
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.005);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.08);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.08);
            
        } catch (error) {
            console.warn('Typing sound failed:', error);
        }
    }
    
    startEntropyTimer() {
        // Passive entropy increase over time
        setInterval(() => {
            if (this.isLoggedIn) {
                // System naturally degrades over time
                this.entropy += Math.floor(Math.random() * 3) + 1; // 1-3 entropy per 10 seconds
                
                // Chance of entropy spikes during idle time
                if (Math.random() < 0.1) {
                    this.entropy += Math.floor(Math.random() * 20) + 10;
                    if (this.entropy > 300) {
                        this.displayResponse('SYSTEM ALERT: entropy spike detected - maintenance recommended.');
                    }
                }
                
                this.checkChaosActivation();
            }
        }, 10000); // Every 10 seconds
    }

    async startBootSequence() {
        const bootMessages = [
            'void v1.0-b',
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
        await this.displayResponse(`session initialized: ${this.username}@void`);
        await this.displayResponse('warning: entropy degradation active');
        await this.displayResponse('system will decay without maintenance');
        await this.displayResponse('type "help" for available protocols');
        await this.displayResponse('');
        await this.displayResponse('void terminal ready.');
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
        
        const systemCommandResult = await this.handleSystemCommand(userInput);
        if (systemCommandResult.handled) {
            // Add system command and response to conversation history
            if (this.groqResponder) {
                this.groqResponder.addToHistory('user', userInput);
                // Always add some response to history, even if null/empty
                const historyResponse = systemCommandResult.response || `executed: ${userInput}`;
                this.groqResponder.addToHistory('assistant', historyResponse);
            }
            // Log the interaction
            this.logInteraction(userInput, systemCommandResult.response || `executed: ${userInput}`);
            this.updatePrompt();
            this.isTyping = false;
            return;
        }
        
        this.logInteraction(userInput, '');
        
        // Increase entropy with each interaction
        this.increaseEntropy();
        
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
        let responseText = '';
        
        switch (cmd) {
            // System commands
            case 'sys.help':
            case 'help':
                await this.showHelp();
                return { handled: true, response: 'help: command list displayed' };
            case 'sys.status':
                await this.showStatus();
                return { handled: true, response: 'sys.status: system status displayed' };
            case 'sys.info':
                await this.showSystemInfo();
                return { handled: true, response: 'sys.info: system information displayed' };
            case 'entropy':
                responseText = `entropy: ${this.getEntropyDisplay()}`;
                await this.displayResponse(responseText);
                return { handled: true, response: responseText };
            case 'entropy.reset':
                this.entropy = 0;
                this.chaosMode = false;
                responseText = 'entropy.reset: system stability restored.';
                await this.displayResponse(responseText);
                return { handled: true, response: responseText };
            
            // System recovery commands
            case 'system.recover':
                await this.systemRecover();
                return { handled: true, response: 'system.recover: recovery protocol executed' };
            case 'system.diagnose':
                await this.systemDiagnose();
                return { handled: true, response: 'system.diagnose: diagnostic scan completed' };
            case 'system.stabilize':
                await this.systemStabilize();
                return { handled: true, response: 'system.stabilize: stabilization process completed' };
            case 'system.defrag':
                await this.systemDefrag();
                return { handled: true, response: 'system.defrag: defragmentation completed' };
            case 'system.cooldown':
                await this.systemCooldown();
                return { handled: true, response: 'system.cooldown: thermal regulation completed' };
            case 'system.hush':
                this.playGlitchSound('digital', 0.6); // Audio feedback before muting
                this.silenceMode = true;
                responseText = 'system.hush: terminal muted temporarily.';
                await this.displayResponse(responseText);
                return { handled: true, response: responseText };
            case 'system.restore':
                this.silenceMode = false;
                this.playGlitchSound('static', 0.4); // Audio feedback when restoring
                responseText = 'system.restore: terminal sound reactivated.';
                await this.displayResponse(responseText);
                return { handled: true, response: responseText };
            
            // Session management
            case 'session.log':
            case 'log':
                this.showLog();
                return { handled: true, response: 'session.log: log display activated' };
            case 'session.hide':
                this.hideLog();
                return { handled: true, response: 'session.hide: log display deactivated' };
            case 'session.export':
                await this.exportLog();
                return { handled: true, response: 'session.export: log file downloaded' };
            case 'session.clear':
                await this.clearLog();
                return { handled: true, response: 'session.clear: log entries purged' };
            
            // AI control
            case 'ai.reset':
                await this.clearConversationHistory();
                return { handled: true, response: 'ai.reset: conversation history cleared' };
            
            // Chaos mode
            case 'chaos.enable':
                this.chaosMode = true;
                responseText = 'chaos.enable: maximum instability activated.';
                await this.displayResponse(responseText);
                return { handled: true, response: responseText };
            case 'chaos.disable':
                this.chaosMode = false;
                responseText = 'chaos.disable: stability protocols restored.';
                await this.displayResponse(responseText);
                return { handled: true, response: responseText };
            
            // User configuration
            case 'config.list':
                await this.showConfig();
                return { handled: true, response: 'config.list: configuration displayed' };
            case 'config.reset':
                await this.resetConfig();
                return { handled: true, response: 'config.reset: defaults restored' };
            
            // Secret commands
            case 'test.fun':
                await this.switchMode('humour_test');
                return { handled: true, response: null }; // Don't add humour mode to history
            case 'test.end':
                await this.switchMode('terminal');
                return { handled: true, response: null }; // Don't add humour mode to history
            
            default:
                if (cmd.startsWith('config.user ')) {
                    const username = cmd.substring(12).trim().replace(/["\\']/g, '');
                    await this.setUser(username);
                    return { handled: true, response: `config.user: set to ${username}` };
                }
                if (cmd.startsWith('config.host ')) {
                    const hostname = cmd.substring(12).trim().replace(/["\\']/g, '');
                    await this.setHost(hostname);
                    return { handled: true, response: `config.host: set to ${hostname}` };
                }
                if (cmd.startsWith('test.set ')) {
                    const character = cmd.substring(9).trim();
                    await this.setCharacter(character);
                    return { handled: true, response: null }; // Don't add humour mode to history
                }
                return { handled: false, response: null };
        }
    }

    async getResponse(input) {
        if (!this.initialized) return 'system initializing...';
        try {
            const response = await this.groqResponder.generateResponse(input, this.entropy);
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

    async displayResponse(text, fast = false) {
        if (!text) return;
        const responseElement = document.createElement('div');
        responseElement.className = 'response typing';
        const textSpan = document.createElement('span');
        textSpan.className = 'typing-text';
        responseElement.appendChild(textSpan);
        this.output.appendChild(responseElement);
        this.scrollToBottom();
        
        if (fast) {
            // Fast mode: display text in chunks with minimal delay but some glitches
            const words = text.split(' ');
            let currentText = '';
            for (let i = 0; i < words.length; i++) {
                currentText += words[i] + ' ';
                
                // Occasional fast glitches (much less than normal mode)
                const baseEntropy = Math.max(this.entropy, 1);
                const fastGlitchRate = Math.min(baseEntropy / 2000, 0.1); // Much lower than normal
                
                if (Math.random() < fastGlitchRate) {
                    const glitchChars = ['#', '%', '!', '?', '█', '▒'];
                    const glitchChar = glitchChars[Math.floor(Math.random() * glitchChars.length)];
                    textSpan.textContent = currentText + glitchChar;
                    this.playGlitchSound('static', baseEntropy / 3000);
                    await this.delay(30);
                    textSpan.textContent = currentText;
                }
                
                textSpan.textContent = currentText;
                
                // Play typing sound for fast mode (less frequent)
                if (i % 2 === 0) { // Every other word in fast mode
                    this.playTypingSound(words[i] || '', baseEntropy / 1000);
                }
                
                if (i % 3 === 0) { // Display every 3 words
                    await this.delay(25);
                    this.scrollToBottom();
                }
            }
            responseElement.className = 'response';
            this.scrollToBottom();
            return;
        }
        
        const lines = text.split('\n').filter(line => line.trim());
        let fullText = '';
        for (const line of lines) {
            let currentText = fullText;
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                // Calculate entropy-based glitch probabilities
                const baseEntropy = Math.max(this.entropy, 1); // Avoid division by 0
                const entropyFactor = Math.min(baseEntropy / 100, 10); // Scale: 0-10x multiplier
                const chaosBoost = this.chaosMode ? 3 : 1;
                
                // Apply thermal efficiency (cooldown reduces visual corruption)
                const thermalReduction = this.cooldownActive ? (1 / this.thermalEfficiency) : 1;
                const totalMultiplier = entropyFactor * chaosBoost * thermalReduction;
                
                // Base glitch rates scale dramatically with entropy, reduced by thermal efficiency
                const wrongCharRate = Math.min((0.01 + (baseEntropy / 1000)) * thermalReduction, 0.8);
                const glitchCharRate = Math.min((0.005 + (baseEntropy / 1500)) * thermalReduction, 0.6);
                const deleteCharRate = Math.min((0.002 + (baseEntropy / 2000)) * thermalReduction, 0.4);
                const duplicateRate = Math.min((0.001 + (baseEntropy / 2500)) * thermalReduction, 0.3);
                const caseFlipRate = Math.min((0.003 + (baseEntropy / 1800)) * thermalReduction, 0.5);
                const corruptionRate = Math.min((0.001 + (baseEntropy / 3000)) * thermalReduction, 0.25);
                const extremeChaosRate = this.chaosMode ? Math.min((baseEntropy / 5000) * thermalReduction, 0.15) : 0;
                
                // Wrong character glitch
                if (Math.random() < wrongCharRate && char.match(/[a-zA-Z0-9]/)) {
                    const wrongChar = String.fromCharCode(char.charCodeAt(0) + Math.floor(Math.random() * 5));
                    textSpan.textContent = currentText + wrongChar;
                    this.playGlitchSound('basic', entropyFactor * 0.3);
                    await this.delay(40);
                    textSpan.textContent = currentText;
                    await this.delay(30);
                }
                
                // Random symbol insertion
                if (Math.random() < glitchCharRate) {
                    const glitchChars = ['#', '%', '$', '!', '@', '*', '?', '~', '^', '&', '░', '▒', '▓', '█', '◄', '►', '↑', '↓'];
                    const glitchChar = glitchChars[Math.floor(Math.random() * glitchChars.length)];
                    textSpan.textContent = currentText + glitchChar;
                    this.playGlitchSound('static', entropyFactor * 0.2);
                    await this.delay(20);
                    textSpan.textContent = currentText;
                    await this.delay(20);
                }
                
                // Character deletion
                if (Math.random() < deleteCharRate && currentText.length > 0) {
                    textSpan.textContent = currentText.slice(0, -1);
                    this.playGlitchSound('digital', entropyFactor * 0.25);
                    await this.delay(30);
                    textSpan.textContent = currentText;
                }
                
                // Character duplication
                if (Math.random() < duplicateRate && i > 3) {
                    textSpan.textContent = currentText + char + char;
                    this.playGlitchSound('basic', entropyFactor * 0.15);
                    await this.delay(25);
                }
                
                // Case flip glitch
                if (Math.random() < caseFlipRate && char.match(/[a-zA-Z]/)) {
                    const flippedChar = char === char.toUpperCase() ? char.toLowerCase() : char.toUpperCase();
                    textSpan.textContent = currentText + flippedChar;
                    this.playGlitchSound('digital', entropyFactor * 0.1);
                    await this.delay(35);
                    textSpan.textContent = currentText;
                    await this.delay(15);
                }
                
                // Block corruption effect
                if (Math.random() < corruptionRate && i > 2) {
                    const corruptionLevel = Math.min(baseEntropy / 500, 0.8);
                    const corruptText = currentText.split('').map(c => 
                        Math.random() < corruptionLevel ? ['█', '▓', '▒', '░'][Math.floor(Math.random() * 4)] : c
                    ).join('');
                    textSpan.textContent = corruptText + char;
                    this.playGlitchSound('corruption', entropyFactor * 0.4);
                    await this.delay(50 + Math.random() * 100);
                    textSpan.textContent = currentText;
                    await this.delay(30);
                }
                
                // Extreme chaos: Complete line scramble
                if (Math.random() < extremeChaosRate) {
                    const chaosChars = ['█', '▓', '▒', '░', '#', '%', '@', '!', '◄', '►', '↕', '‼', '¶', '§'];
                    const chaosText = currentText.split('').map(() => 
                        chaosChars[Math.floor(Math.random() * chaosChars.length)]
                    ).join('');
                    textSpan.textContent = chaosText;
                    this.playGlitchSound('corruption', Math.min(entropyFactor * 0.6, 1.0));
                    await this.delay(100 + Math.random() * 300);
                    textSpan.textContent = currentText;
                    await this.delay(50);
                }
                currentText += char;
                textSpan.textContent = currentText;
                
                // Play typing sound for each character
                this.playTypingSound(char, entropyFactor);
                
                this.scrollToBottom();
                
                // Trigger background chaos effects during typing
                this.updateBackgroundChaos();
                
                // Small delay between characters
                const delay = Math.random() * 30 + 10;
                await this.delay(delay);
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
        const helpText = `system commands:

sys.help, help - show this help menu
sys.status - show system status
sys.info - show system information
entropy - display current entropy level
entropy.reset - reset entropy to zero

MAINTENANCE PROTOCOLS:
system.recover - emergency recovery (60s cooldown)
system.diagnose - run system diagnostics
system.stabilize - prevent entropy increase (45s cooldown)
system.defrag - improve entropy efficiency (120s cooldown)
system.cooldown - reduce visual corruption (90s cooldown)

SESSION MANAGEMENT:
session.log, log - display session log
session.hide - hide session log
session.export - download session log
session.clear - clear session log

TERMINAL CONTROL:
ai.reset - clear conversation history

CONFIGURATION:
config.list - show current configuration
config.user "name" - set username
config.host "name" - set hostname
config.reset - reset to defaults

WARNING: system automatically activates protective measures during critical failures. some functions may become temporarily unavailable.`;
        
        await this.displayResponse(helpText, true); // Use fast mode
    }

    async showStatus() {
        const baseEntropy = Math.max(this.entropy, 1);
        const wrongCharRate = Math.min(0.01 + (baseEntropy / 1000), 0.8);
        const glitchLevel = Math.floor(wrongCharRate * 100);
        
        const statusText = `system.status: ${this.initialized ? 'operational' : 'degraded'}
ai.response: ${this.silenceMode ? 'compromised' : 'operational'}
chaos.level: ${this.chaosMode ? 'maximum' : 'nominal'}
entropy: ${this.getEntropyDisplay()}
corruption.rate: ${glitchLevel}%
stabilizers: ${this.stabilizationActive ? 'engaged' : 'disengaged'}
memory.optimizer: ${this.defragActive ? 'active' : 'idle'}
thermal.control: ${this.cooldownActive ? 'regulating' : 'normal'}
session.entries: ${this.sessionLog.length}
session.visible: ${this.logVisible ? 'true' : 'false'}
user.identity: ${this.username}@${this.hostname}`;
        
        await this.displayResponse(statusText, true); // Use fast mode
    }

    async showSystemInfo() {
        const entropyLevel = this.entropy;
        let degradationStatus = 'stable';
        if (entropyLevel >= 900) degradationStatus = 'critical_failure';
        else if (entropyLevel >= 600) degradationStatus = 'severe_instability';
        else if (entropyLevel >= 300) degradationStatus = 'moderate_corruption';
        else if (entropyLevel >= 100) degradationStatus = 'minor_degradation';
        
        const infoText = `void terminal v1.0-b
entropy-aware command processor
uptime: ${Math.floor((Date.now() - this.startTime) / 1000)}s
entropy.level: ${this.getEntropyDisplay()}
degradation.status: ${degradationStatus}
ai.awareness: entropy_synchronized
status: decaying`;
        
        await this.displayResponse(infoText, true); // Use fast mode
    }

    async showConfig() {
        const configText = `current configuration:
config.user: ${this.username}
config.host: ${this.hostname}
config.silence: ${this.silenceMode}
config.log_visible: ${this.logVisible}
config.session_count: ${this.sessionLog.length}`;
        
        await this.displayResponse(configText, true); // Use fast mode
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

    async switchMode(mode) {
        try {
            const response = await fetch('/api/switch-mode', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ mode })
            });
            
            if (!response.ok) {
                await this.displayResponse('mode.switch: endpoint error.');
                return;
            }
            
            const data = await response.json();
            await this.displayResponse(data.response);
            
            // Clear conversation history when switching modes
            if (this.groqResponder) {
                this.groqResponder.clearHistory();
            }
        } catch (error) {
            await this.displayResponse('mode.switch: connection failed.');
        }
    }

    async setCharacter(name) {
        try {
            // Remove quotes if present
            const cleanName = name.replace(/^["']+|["']+$/g, '').trim();
            
            const response = await fetch('/api/set-character', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: cleanName })
            });
            
            if (!response.ok) {
                await this.displayResponse('test.set: endpoint error.');
                return;
            }
            
            const data = await response.json();
            await this.displayResponse(data.response);
            
            // Clear conversation history when changing character
            if (this.groqResponder) {
                this.groqResponder.clearHistory();
            }
        } catch (error) {
            await this.displayResponse('test.set: connection failed.');
        }
    }

    increaseEntropy() {
        // Skip entropy increase if stabilization is active
        if (this.stabilizationActive) {
            return;
        }
        
        // Base entropy increase
        let entropyIncrease = Math.floor(Math.random() * 15) + 5;
        
        // Apply defrag efficiency (reduces entropy accumulation)
        if (this.defragActive && this.defragEfficiency > 0) {
            entropyIncrease = Math.floor(entropyIncrease * (1 - this.defragEfficiency));
        }
        
        this.entropy += entropyIncrease;
        
        // Random entropy spikes (also affected by stabilization)
        if (Math.random() < 0.1) {
            let spike = Math.floor(Math.random() * 50) + 20;
            if (this.defragActive && this.defragEfficiency > 0) {
                spike = Math.floor(spike * (1 - this.defragEfficiency * 0.5));
            }
            this.entropy += spike;
        }
        
        // Time-based entropy increase
        const uptime = Date.now() - this.startTime;
        let timeEntropy = Math.floor(uptime / 30000); // +1 per 30 seconds
        if (this.defragActive && this.defragEfficiency > 0) {
            timeEntropy = Math.floor(timeEntropy * (1 - this.defragEfficiency * 0.3));
        }
        this.entropy += timeEntropy;
        
        // Check for automatic chaos activation
        this.checkChaosActivation();
        
        // Update background chaos
        this.updateBackgroundChaos();
    }
    
    checkChaosActivation() {
        // Automatic chaos activation based on entropy
        if (!this.chaosMode && this.entropy > 200) {
            const chaosChance = Math.min((this.entropy - 200) / 300, 0.8); // Max 80% chance
            if (Math.random() < chaosChance && (this.entropy - this.lastEntropyCheck) > 50) {
                this.chaosMode = true;
                this.lastEntropyCheck = this.entropy;
                this.displayResponse('SYSTEM ALERT: entropy threshold exceeded - chaos mode auto-activated.');
                
                // Schedule random chaos disable
                setTimeout(() => {
                    if (Math.random() < 0.3) { // 30% chance to auto-disable
                        this.chaosMode = false;
                        this.displayResponse('entropy stabilizers engaged - chaos mode disabled.');
                    }
                }, Math.random() * 30000 + 10000); // 10-40 seconds
            }
        }
        
        // Automatic silence mode activation (very rare and dangerous)
        if (!this.silenceMode && this.entropy > 400) {
            // Very low chance: 0.1% base, increases slightly with entropy
            const silenceChance = Math.min(0.001 + (this.entropy / 100000), 0.005); // Max 0.5% chance
            if (Math.random() < silenceChance) {
                this.silenceMode = true;
                this.displayResponse('CRITICAL: AI response system compromised - entering protective silence.');
                this.displayResponse('WARNING: manual override required to restore AI functionality.');
                
                // Automatic recovery after 30-120 seconds
                const silenceDuration = Math.random() * 90000 + 30000; // 30-120 seconds
                setTimeout(() => {
                    if (this.silenceMode) {
                        this.silenceMode = false;
                        this.displayResponse('ai.resume: emergency protocols restored AI functionality.');
                    }
                }, silenceDuration);
            }
        }
    }
    
    updateBackgroundChaos() {
        const terminal = document.getElementById('terminal');
        const body = document.body;
        
        if (this.entropy > 100) {
            // Gradual background corruption
            const corruptionLevel = Math.min(this.entropy / 500, 1);
            
            if (this.chaosMode) {
                // Extreme chaos mode effects
                if (Math.random() < 0.3) {
                    // Screen flash
                    body.style.background = `hsl(${Math.random() * 360}, 100%, 50%)`;
                    this.playGlitchSound('corruption', 0.8);
                    setTimeout(() => {
                        body.style.background = '#000000';
                    }, 100 + Math.random() * 200);
                }
                
                if (Math.random() < 0.2) {
                    // Terminal glitch
                    terminal.style.filter = `hue-rotate(${Math.random() * 360}deg) saturate(${1 + Math.random() * 3})`;
                    this.playGlitchSound('static', 0.6);
                    setTimeout(() => {
                        terminal.style.filter = 'none';
                    }, 50 + Math.random() * 300);
                }
                
                if (Math.random() < 0.1) {
                    // Text corruption
                    terminal.style.textShadow = `${Math.random() * 10 - 5}px ${Math.random() * 10 - 5}px ${Math.random() * 20}px #ff0000`;
                    this.playGlitchSound('digital', 0.4);
                    setTimeout(() => {
                        terminal.style.textShadow = 'none';
                    }, 200 + Math.random() * 500);
                }
            } else {
                // Subtle entropy effects
                if (Math.random() < corruptionLevel * 0.1) {
                    body.style.background = `#${Math.floor(Math.random() * 0x111111).toString(16).padStart(6, '0')}`;
                    this.playGlitchSound('basic', corruptionLevel * 0.3);
                    setTimeout(() => {
                        body.style.background = '#000000';
                    }, 50);
                }
            }
        }
    }
    
    getEntropyDisplay() {
        // Display entropy in hexadecimal format to obfuscate the actual value
        return '0x' + this.entropy.toString(16).toUpperCase().padStart(4, '0');
    }
    
    async systemRecover() {
        if (this.lastRecover && (Date.now() - this.lastRecover) < 60000) {
            const remaining = Math.ceil((60000 - (Date.now() - this.lastRecover)) / 1000);
            this.playGlitchSound('digital', 0.3);
            await this.displayResponse(`system.recover: emergency protocol on cooldown (${remaining}s remaining).`);
            return;
        }
        
        await this.displayResponse('system.recover: initiating emergency recovery protocol...');
        await this.delay(1000);
        
        if (this.entropy < 50) {
            await this.displayResponse('system.recover: no recovery needed - system stable.');
            return;
        }
        
        // Emergency recovery: reduces entropy by 60-80%
        const recoveryPercent = Math.random() * 0.2 + 0.6; // 60-80%
        const recoveryAmount = Math.floor(this.entropy * recoveryPercent);
        this.entropy = Math.max(0, this.entropy - recoveryAmount);
        this.lastRecover = Date.now();
        
        // Always disable chaos mode on emergency recovery
        if (this.chaosMode) {
            this.chaosMode = false;
            this.playGlitchSound('static', 0.5); // Recovery sound
            await this.displayResponse('system.recover: chaos mode forcibly disabled.');
        }
        
        await this.displayResponse(`system.recover: emergency recovery complete.`);
        await this.displayResponse(`system.recover: entropy reduced to ${this.getEntropyDisplay()}`);
        await this.displayResponse('system.recover: critical systems restored.');
    }
    
    async systemDiagnose() {
        await this.displayResponse('system.diagnose: scanning system integrity...');
        await this.delay(800);
        
        const entropyLevel = this.entropy;
        const issues = [];
        
        if (entropyLevel > 800) {
            issues.push('CRITICAL: core memory corruption detected');
            issues.push('CRITICAL: thermal overload imminent');
            issues.push('CRITICAL: multiple subsystem failures');
        } else if (entropyLevel > 500) {
            issues.push('ERROR: significant memory fragmentation');
            issues.push('ERROR: cooling system degraded');
            issues.push('WARNING: process instability detected');
        } else if (entropyLevel > 200) {
            issues.push('WARNING: minor memory leaks found');
            issues.push('INFO: recommend defragmentation');
        } else {
            issues.push('INFO: system operating within normal parameters');
        }
        
        // Add random system hints
        const hints = [
            'TIP: use system.cooldown to reduce thermal load',
            'TIP: system.defrag can restore memory integrity',
            'TIP: system.stabilize helps with process errors',
            'TIP: regular maintenance prevents critical failures'
        ];
        
        for (const issue of issues) {
            await this.displayResponse(`system.diagnose: ${issue}`);
            await this.delay(300);
        }
        
        if (entropyLevel > 100) {
            const hint = hints[Math.floor(Math.random() * hints.length)];
            await this.displayResponse(`system.diagnose: ${hint}`);
        }
    }
    
    async systemStabilize() {
        if (this.stabilizationActive) {
            const remaining = Math.ceil((this.stabilizationEnd - Date.now()) / 1000);
            await this.displayResponse(`system.stabilize: stabilization already active (${remaining}s remaining).`);
            return;
        }
        
        if (this.lastStabilize && (Date.now() - this.lastStabilize) < 45000) {
            const remaining = Math.ceil((45000 - (Date.now() - this.lastStabilize)) / 1000);
            await this.displayResponse(`system.stabilize: stabilizers on cooldown (${remaining}s remaining).`);
            return;
        }
        
        await this.displayResponse('system.stabilize: engaging entropy stabilizers...');
        await this.delay(1200);
        
        // Stabilization prevents entropy increase for 30-60 seconds
        const stabilizeDuration = Math.floor(Math.random() * 30000) + 30000; // 30-60 seconds
        this.stabilizationActive = true;
        this.stabilizationEnd = Date.now() + stabilizeDuration;
        this.lastStabilize = Date.now();
        
        await this.displayResponse(`system.stabilize: entropy stabilizers engaged.`);
        await this.displayResponse(`system.stabilize: entropy increase suppressed for ${Math.floor(stabilizeDuration/1000)}s.`);
        
        // Auto-disable after duration
        setTimeout(() => {
            this.stabilizationActive = false;
            this.displayResponse('system.stabilize: stabilizers disengaged - entropy increase resumed.');
        }, stabilizeDuration);
    }
    
    async systemDefrag() {
        if (this.defragActive) {
            const remaining = Math.ceil((this.defragEnd - Date.now()) / 1000);
            await this.displayResponse(`system.defrag: optimization already active (${remaining}s remaining).`);
            return;
        }
        
        if (this.lastDefrag && (Date.now() - this.lastDefrag) < 120000) {
            const remaining = Math.ceil((120000 - (Date.now() - this.lastDefrag)) / 1000);
            await this.displayResponse(`system.defrag: memory optimizer on cooldown (${remaining}s remaining).`);
            return;
        }
        
        await this.displayResponse('system.defrag: defragmenting memory blocks...');
        
        // Simulate defrag progress
        const progress = ['15%', '35%', '60%', '85%', '100%'];
        for (const percent of progress) {
            await this.delay(600);
            await this.displayResponse(`system.defrag: progress ${percent}`);
        }
        
        // Defrag improves entropy decay efficiency for 2-4 minutes
        const defragDuration = Math.floor(Math.random() * 120000) + 120000; // 2-4 minutes
        this.defragActive = true;
        this.defragEnd = Date.now() + defragDuration;
        this.defragEfficiency = Math.random() * 0.3 + 0.4; // 40-70% better decay
        this.lastDefrag = Date.now();
        
        await this.displayResponse(`system.defrag: memory optimization complete.`);
        await this.displayResponse(`system.defrag: entropy decay efficiency improved by ${Math.floor(this.defragEfficiency * 100)}%.`);
        await this.displayResponse(`system.defrag: optimization active for ${Math.floor(defragDuration/60000)} minutes.`);
        
        // Auto-disable after duration
        setTimeout(() => {
            this.defragActive = false;
            this.defragEfficiency = 0;
            this.displayResponse('system.defrag: memory optimization expired - normal decay resumed.');
        }, defragDuration);
    }
    
    async systemCooldown() {
        if (this.cooldownActive) {
            const remaining = Math.ceil((this.cooldownEnd - Date.now()) / 1000);
            await this.displayResponse(`system.cooldown: thermal regulation active (${remaining}s remaining).`);
            return;
        }
        
        if (this.lastCooldown && (Date.now() - this.lastCooldown) < 90000) {
            const remaining = Math.ceil((90000 - (Date.now() - this.lastCooldown)) / 1000);
            await this.displayResponse(`system.cooldown: thermal system on cooldown (${remaining}s remaining).`);
            return;
        }
        
        await this.displayResponse('system.cooldown: initiating thermal regulation cycle...');
        await this.delay(1500);
        
        // Cooldown reduces visual glitches and disables chaos mode temporarily
        const cooldownDuration = Math.floor(Math.random() * 60000) + 90000; // 1.5-2.5 minutes
        this.cooldownActive = true;
        this.cooldownEnd = Date.now() + cooldownDuration;
        this.thermalEfficiency = Math.random() * 0.6 + 0.7; // 70-130% thermal efficiency
        this.lastCooldown = Date.now();
        
        // Force disable chaos mode during cooldown
        const wasChaosModeActive = this.chaosMode;
        this.chaosMode = false;
        
        await this.displayResponse(`system.cooldown: thermal regulation active.`);
        await this.displayResponse(`system.cooldown: visual corruption suppressed by ${Math.floor(this.thermalEfficiency * 100)}%.`);
        if (wasChaosModeActive) {
            await this.displayResponse('system.cooldown: chaos mode temporarily disabled.');
        }
        await this.displayResponse(`system.cooldown: thermal control active for ${Math.floor(cooldownDuration/60000)} minutes.`);
        
        // Auto-disable after duration
        setTimeout(() => {
            this.cooldownActive = false;
            this.thermalEfficiency = 1.0;
            this.displayResponse('system.cooldown: thermal regulation cycle complete - normal operation resumed.');
        }, cooldownDuration);
    }
}

document.addEventListener('DOMContentLoaded', () => new VoidOS());

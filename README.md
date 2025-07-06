# you.os

An AI assistant with a twist! Experience conversations through a retro terminal interface that... well, let's just say it has its own personality.

[Live Demo](https://void-7zy3.onrender.com)

## ✨ Features

- 🖥️ Authentic terminal-style interface with boot sequence
- 🤖 AI-powered conversations via Groq API (Llama 3.1)
- 💬 Emotional and technical dialogue processing
- 📜 Session logging and export functionality
- 🎭 Dynamic typing animations and visual effects
- 🔧 Customizable user identity and system settings
- 🛠️ Advanced system maintenance protocols
- 📱 Mobile-optimized responsive design

## 📸 Screenshots

![Boot Sequence](screenshots/preview1.png) (Placeholder for actual screenshot)

## 🧩 Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express
- **AI**: Groq API (Llama 3.1 model)
- **Dependencies**: cors, dotenv, express, node-fetch, compression, winston
- **Dev Tools**: ESLint, Jest, Nodemon
- **Environment**: Configuration via `.env` file
- **Deployment**: Static server compatible (e.g., Vercel, Netlify) or Node.js server

## 🛠️ Getting Started

### Prerequisites
- Node.js (v16 or higher)
- A Groq API key from [Groq Console](https://console.groq.com)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ayannotfound/void.git
   cd void
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add your Groq API key:
   ```env
   GROQ_API_KEY=your_groq_api_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Visit `http://localhost:3000` in your browser.

Alternatively, for static hosting:
- Serve the `public` directory using a static server (e.g., `npx live-server public`).
- Ensure the backend server is running separately for API requests.

## 📜 Usage

1. Watch the system boot up with its unique initialization sequence
2. Enter a username when prompted
3. Start chatting! Try normal conversation or system commands
4. Explore the various maintenance tools available
5. Keep an eye on system status - you might need to perform some upkeep

### Example Interactions
```bash
user@void> hello there
system: greetings. how may i assist your terminal session?

user@void> help
system: [displays available commands and protocols]

user@void> sys.status
system: [shows current system health and metrics]
```

### Key Features

#### Core Commands
- `help` - Display available commands and protocols
- `sys.status` - Monitor system health and status
- `sys.info` - View system information and uptime

#### Maintenance Protocols
- `system.diagnose` - Run diagnostic scans
- `system.recover` - Emergency system recovery
- `system.stabilize` - Prevent system degradation
- `system.defrag` - Optimize system efficiency
- `system.cooldown` - Reduce visual interference

#### Session Management
- `session.log` - View conversation history
- `session.export` - Download session data
- `session.clear` - Clear session history

#### Configuration
- `config.user "name"` - Set username
- `config.host "name"` - Set hostname
- `config.reset` - Reset to defaults

**Note:** The system may occasionally require maintenance. Don't worry if things get a bit... interesting.

## 🧠 What I Learned

- Building immersive terminal-style user interfaces
- Integrating modern AI APIs with creative presentation layers
- Creating dynamic visual effects and animations
- Implementing real-time system state management
- Developing responsive designs for multiple device types
- Managing complex application state and user interactions
- Building engaging conversational experiences with personality

## 📫 About Me

- [LinkedIn](https://www.linkedin.com/in/ayush-anand-420590306/) (Add your LinkedIn profile)
- [GitHub](https://github.com/ayannotfound) (Add your GitHub profile)

## 📚 References

- [Groq API Documentation](https://console.groq.com/docs)
- [Express.js Documentation](https://expressjs.com)
- [JavaScript Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
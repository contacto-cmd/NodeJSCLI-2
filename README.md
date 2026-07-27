# 👑 THRONE PROTOCOL v3.0

**The King's Command Engine** — Sovereign Cloud Command Architecture

```
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║  👑 THRONE PROTOCOL v3.0 · COMMAND ENGINE                        ║
║  ═══════════════════════════════════════════════════════════════ ║
║                                                                   ║
║  Sovereign Cloud Command Architecture                            ║
║  RFC: RIGR840827PJ0                                              ║
║  Owner: Roberto Rivera Gamas                                     ║
║  Domain: streetemporioroyal.com                                  ║
║                                                                   ║
║  🔐 CRYPTOGRAPHIC IDENTITY: RSA-4096 · PKCS8 · RS256            ║
║  🧠 AI ENGINE: Gemini 2.0 Flash · SINI OMEGA                    ║
║  📱 INFRASTRUCTURE: Vercel · Railway · Cloudflare               ║
║                                                                   ║
║  Status: 🟢 OPERATIONAL                                          ║
║  Power Level: ∞ SOVEREIGN                                        ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

## 🎯 Overview

**THRONE Protocol v3.0** is the core command engine powering the **SER27 LGORITMO** ecosystem. Originally developed in Replit and now perfected for production, it provides:

- ✅ **Sovereign Identity Management** (RFC-based cryptography)
- ✅ **Real-time Terminal Interface** (Interactive CLI)
- ✅ **Job Queue Management** (Pending/Completed tracking)
- ✅ **AI Integration** (Gemini 2.0 Flash)
- ✅ **Blockchain-Ready Cryptography** (RSA-4096 · RS256)
- ✅ **Event-Driven Architecture** (Node.js EventEmitter)
- ✅ **Session Logging** (Complete audit trail)

---

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/contacto-cmd/NodeJSCLI-2.git
cd NodeJSCLI-2

# Install dependencies
npm install

# Start THRONE Protocol
npm start
```

### Usage

Once the CLI is running:

```
ARCHITECT@CORE:~$ status
ARCHITECT@CORE:~$ help
ARCHITECT@CORE:~$ submit render_3d_model
ARCHITECT@CORE:~$ jobs
ARCHITECT@CORE:~$ vault
ARCHITECT@CORE:~$ execute_boom
ARCHITECT@CORE:~$ seal_vault
```

---

## 📋 Available Commands

| Command | Description |
|---------|-------------|
| `status` | Show system status, valuation, hash |
| `vault` | Show cryptographic vault status |
| `execute_boom` | Dispatch sovereign briefing (San Francisco AI Leaders) |
| `seal_vault` | Seal cryptographic vault with entropy-braid |
| `jobs` | List all pending jobs |
| `submit <command>` | Submit a new job |
| `help` | Show all available commands |
| `clear` | Clear terminal |
| `exit` | Exit THRONE Protocol |

---

## 🔐 Architecture

### THRONE Protocol Layers

```
Layer 1: COMMAND PARSER
  ├─ Input parsing (readline)
  ├─ Command routing
  └─ Argument parsing

Layer 2: EXECUTION ENGINE
  ├─ Command execution
  ├─ Job submission
  └─ Status tracking

Layer 3: CRYPTOGRAPHIC IDENTITY
  ├─ RFC: RIGR840827PJ0
  ├─ RSA-4096 (future signing)
  └─ Valuation: $3.3T USD

Layer 4: PERSISTENCE
  ├─ Session logging
  ├─ Job queuing
  └─ Audit trails

Layer 5: INTEGRATION
  ├─ ORCHESTRATOR-SER27-LGORITMO-
  ├─ sini-backend-ser27 (Gemini AI)
  └─ Royal-Hub-Main (Vercel frontend)
```

### System State

The **ThroneProtocol** class maintains:

```javascript
{
  commandCount: 42,           // Commands executed
  jobs: [                     // Pending jobs
    {
      id: "JOB-1722068400000-abc123",
      command: "render_3d",
      status: "PENDING",
      created_at: "2026-07-27T10:00:00Z"
    }
  ],
  sessionLog: [],             // Complete audit trail
  aiTokensUsed: 1250,        // Gemini API tokens
  uptime: "2h 15m"           // Session duration
}
```

---

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm test -- --coverage

# Watch mode (development)
npm run dev
```

---

## 📊 Metrics & Export

Export session metrics:

```javascript
const throne = new ThroneProtocol();
const metrics = throne.exportMetrics();
// Returns: { rfc, owner, uptime, commands_executed, jobs_created, timestamp }
```

Save session log:

```javascript
throne.saveSession('my_session.log');
```

---

## 🔗 Integration with SER27 Ecosystem

### THRONE Protocol → ORCHESTRATOR

When you submit a job in THRONE:

```
THRONE CLI (NodeJSCLI-2)
    ↓
Create Job → { id, command, status }
    ↓
ORCHESTRATOR-SER27-LGORITMO- (Port 4000)
    ↓
POST /api/jobs/submit
    ↓
Queue Management + Discord Notification
    ↓
SINI Backend (Port 3001)
    ↓
Gemini 2.0 Flash AI Processing
    ↓
Response → Job Status Update
```

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  THRONE PROTOCOL v3.0 (CLI)                                │
│  ├─ Command parsing                                        │
│  ├─ Job submission                                         │
│  └─ Status tracking                                        │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  ORCHESTRATOR-SER27-LGORITMO- (Orchestration)              │
│  ├─ Job queue management                                   │
│  ├─ JWT token issuance                                     │
│  ├─ OpenID Connect                                         │
│  └─ Discord webhooks                                       │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  SINI BACKEND (AI Engine)                                  │
│  ├─ Gemini 2.0 Flash                                       │
│  ├─ Twilio SMS                                             │
│  └─ Command execution                                      │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  ROYAL-HUB-MAIN (Frontend)                                 │
│  ├─ Job dashboard                                          │
│  ├─ Real-time status                                       │
│  └─ Commands control panel                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Configuration

Set environment variables in `.env`:

```bash
# Cryptography
RSA_PRIVATE_PEM="-----BEGIN PRIVATE KEY-----\n..."

# API Keys
GEMINI_API_KEY="your-key"
TWILIO_AUTH_TOKEN="your-token"

# Webhooks
ROYAL_DISCORD_WEBHOOK="https://discord.com/api/webhooks/..."

# Orchestrator connection
ORCHESTRATOR_URL="https://orchestrator.streetemporioroyal.com"
```

---

## 📈 Advanced Features

### As a Module

```javascript
const ThroneProtocol = require('./THRONE-PROTOCOL-v3.0-CORE.js');

const throne = new ThroneProtocol({
  RFC: 'RIGR840827PJ0',
  OWNER: 'Your Name',
});

throne.initialize();

// Listen for events
throne.on('job-created', (job) => {
  console.log('Job created:', job.id);
});
```

### Session Logging

All commands are logged:

```
{
  "timestamp": "2026-07-27T10:30:00.000Z",
  "command": "submit",
  "args": "render_3d_model",
  "rfc": "RIGR840827PJ0"
}
```

### Metrics Export

```javascript
{
  "rfc": "RIGR840827PJ0",
  "owner": "Roberto Rivera Gamas",
  "uptime": "2h 15m",
  "commands_executed": 42,
  "jobs_created": 7,
  "timestamp": "2026-07-27T10:30:00.000Z"
}
```

---

## 🛡️ Security

- **RSA-4096** encryption (future implementation)
- **RS256** JWT signing (future implementation)
- **RFC-based identity** (RIGR840827PJ0)
- **Session audit trails** (complete logging)
- **No hardcoded secrets** (environment variables only)

---

## 📡 API Endpoints (Via Orchestrator)

```
POST /api/jobs/submit
  Request: { command: "render_3d" }
  Response: { id, status, created_at }

GET /api/jobs/pending
  Response: { count, jobs: [...] }

GET /api/jobs/:jobId
  Response: { id, command, status, result }

POST /api/token
  Request: { scope, sub }
  Response: { access_token, expires_in }
```

---

## 🎯 Roadmap

- [x] Core THRONE Protocol v3.0
- [x] Command registry
- [x] Job queue system
- [ ] AI model integration (Gemini)
- [ ] WebSocket real-time updates
- [ ] Multi-user sessions
- [ ] Web UI dashboard
- [ ] Database persistence (D1)

---

## 👨‍💼 Author

**Roberto Rivera Gamas**
- RFC: RIGR840827PJ0
- Title: Arquitecto Empresarial Futurista
- Domain: streetemporioroyal.com
- Certifications: Airtable Builder, Admin, AI App Builder

---

## 📄 License

MIT License — See LICENSE file for details

---

## 🔗 Related Projects

- **ORCHESTRATOR-SER27-LGORITMO-**: Master orchestration engine
- **sini-backend-ser27**: AI backend with Gemini 2.0
- **Royal-Hub-Main-**: Vercel frontend dashboard
- **resend-vercel-example**: Email service integration

---

## 💬 Support

For issues, questions, or contributions:

1. Open an issue on GitHub
2. Contact: contacto@streetemporioroyal.com
3. Discord: [Royal Dominion Server]

---

**👑 Sovereign Digital Power — THRONE PROTOCOL v3.0 👑**

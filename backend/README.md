# Backend — AI Debug Helper

## 🔧 Overview
This folder contains the backend server for *AI Debug Helper*. It exposes:
- `GET /` — health check
- `POST /api/debug/analyze` — submit `{ code, language }` for syntax/compile checks

The analyzer runs language-specific tools (Python `py_compile`, `gcc`/`g++`, `javac`) to detect syntax errors. See **Security** below.

---

## ✅ Required runtimes
Install these on the server where the backend runs:

- **Python 3** (for Python syntax checks)
  - Check: `python --version` or `py --version`
  - Windows note: If Windows shows a Microsoft Store alias when running `python`, disable the App Execution Alias or install Python from python.org or the Microsoft Store. The analyzer will return a clear message if Python is not found.
- **GCC / G++** (for C/C++ syntax checks)
  - Check: `gcc --version` and/or `g++ --version`
- **JDK (javac)** (for Java syntax checks)
  - Check: `javac -version`

If a runtime is missing, the analyzer will respond with an explanatory error suggesting how to install the tool.

---

## 🚀 Run the server
1. Install dependencies:

```bash
cd backend
npm install
```

2. Start server:

```bash
npm start
# Server listens on port 5000 by default
```

---

## 🧪 Smoke tests
A small smoke test script is provided at `backend/scripts/smoke.js`.

Run it with:

```bash
cd backend
npm run smoke
```

---

## 🔑 Groq API Key Setup

To enable AI-powered code analysis and chatbot features, you need a Groq API key:

1. Visit [Groq Console](https://console.groq.com/)
2. Create a free account or sign in
3. Navigate to **API Keys** section
4. Copy your API key
5. Create a `.env` file in the `backend/` folder:

```bash
# backend/.env
GROQ_API_KEY=your_actual_api_key_here
```

> **Note:** The backend will run without a Groq key, but AI analysis features will return an error message prompting you to configure the key.

---

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/api/debug/analyze` | POST | Submit code for syntax/compile analysis |
| `/api/chat` | POST | Chat with AI chatbot |
| `/api/chat/history` | GET | Get chat history |

---

## 🛡️ Security

- Code is executed in sandboxed subprocesses with timeout limits
- No code is stored or executed on the host system
- Input validation prevents injection attacks

Expected output:
- `GET /` → `200` and a short message
- `POST /api/debug/analyze` → `200` and JSON with `submissionId`, `errors`, `explanation`, `suggestions`, `lineNumbers`

If a runtime is missing, the response will include a helpful message such as **"Python runtime not found on server"**.

---

## 🛠 Troubleshooting
- If you see messages about Python being an App Execution Alias on Windows, open **Settings → Apps → App execution aliases** and **disable** the `python` alias, or install Python from python.org.
- Check server logs (where you run `npm start`) for analyzer errors and stack traces.
- If compilers are missing, install the appropriate packages for your OS (e.g., `build-essential` on Debian/Ubuntu for gcc/g++).

---

## ⚠️ Security note
This analyzer runs compilers/interpreters on submitted code for syntax checking. **Do not** run this service with untrusted inputs on production systems without proper sandboxing and isolation.

---

## ✨ Extending
To add other languages, update `backend/analyzer.js` to write files for the language and call an appropriate syntax checker, handling missing tools and cleaning up temporary files.

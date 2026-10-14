// Import necessary modules
const express = require('express');
const cors = require('cors'); 
const { analyzeCode } = require('./analyzer'); // <--- Import the actual analysis function
const Groq = require('groq-sdk');
require('dotenv').config();

// Initialize Groq (set API key in environment variable GROQ_API_KEY)
const groqApiKey = process.env.GROQ_API_KEY;
const groqClient = groqApiKey ? new Groq({ apiKey: groqApiKey }) : null;

// Initialize the Express app
const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// --- SQLite setup (store submissions) ---
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'data.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT,
        language TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    db.run(`CREATE TABLE IF NOT EXISTS chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

// --- Middleware Setup ---
// Enable CORS for all routes - IMPORTANT for connecting frontend/backend
app.use(cors());
// Parse incoming JSON requests 
app.use(express.json());

// --- API Endpoint: /api/debug/analyze ---
// Corrected to match the frontend URL: /api/debug/analyze
app.post('/api/debug/analyze', (req, res) => { 
    // 1. Get the code and language from the request body
    const { code, language } = req.body;

    // Basic input validation
    if (!code || !language) {
        return res.status(400).json({ 
            errors: ['Missing code or language in the request body.'], 
            explanation: 'The server did not receive both code and a language.',
            suggestions: 'Please ensure both the code editor and language selector have values.',
            lineNumbers: []
        });
    }

        // 2. Call the analyzer (may return a Promise)
        analyzeCode(code, language)
            .then((analysisResult) => {
                // Save submission to DB and return the analysis with submission id
                db.run(`INSERT INTO submissions (code, language) VALUES (?, ?)`, [code, language], function(err) {
                        if (err) {
                                console.error('DB Insert Error:', err);
                                return res.status(500).json({ errors: ['Internal server error saving submission.'], explanation: 'Failed to store code submission.', suggestions: 'Retry or contact support.' });
                        }

                        const submissionId = this.lastID;
                        const normalized = {
                          submissionId,
                          errors: analysisResult.errors || [],
                          explanation: analysisResult.explanation || 'Analysis completed. No detailed explanation was provided by the analyzer.',
                          suggestions: analysisResult.suggestions || 'Review the reported errors and adjust your code accordingly.',
                          lineNumbers: analysisResult.lineNumbers || [],
                          stdout: analysisResult.stdout || '',
                          stderr: analysisResult.stderr || ''
                        };
                        res.json(normalized);
                });
            })
            .catch((err) => {
                console.error('Analyzer Error:', err);
                res.status(500).json({ errors: ['Internal server error during analysis.'], explanation: 'The analyzer failed unexpectedly.', suggestions: 'Check backend logs and confirm required compilers/runtime are installed.', lineNumbers: [] });
            });
});

// --- API Endpoint: /api/chat ---
// Chatbot for debugging help
app.post('/api/chat', async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Message is required.' });
    }

    try {
        console.log('Chat request:', message);
        console.log('Groq API Key set:', !!groqClient);

        if (!groqClient) {
            throw new Error('Groq API key is not configured. Please set GROQ_API_KEY in .env.');
        }

        const completion = await groqClient.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages: [
                { role: 'system', content: 'You are a helpful AI assistant for coding and debugging. Provide concise, accurate advice.' },
                { role: 'user', content: message }
            ],
            max_tokens: 150
        });

        const reply = completion.choices[0].message.content;
        console.log('Groq Response:', reply);
        
        // Save chat messages to database
        db.run(`INSERT INTO chat_messages (role, content) VALUES (?, ?)`, ['user', message], (err) => {
            if (err) console.error('Error saving user message:', err);
        });
        db.run(`INSERT INTO chat_messages (role, content) VALUES (?, ?)`, ['assistant', reply], (err) => {
            if (err) console.error('Error saving bot message:', err);
        });
        
        res.json({ reply });
    } catch (error) {
        console.error('Groq API Error:', error.message || error);
        console.error('Error Type:', error.code || error.type);
        
        let fallbackReply = 'I\'m having trouble connecting to Groq right now, but here are some debugging tips: Check your code syntax, test with a simpler example, and read error messages carefully.';
        
        if (error.message && error.message.toLowerCase().includes('quota')) {
            fallbackReply = 'Groq connection failed because your quota is exhausted or the key is invalid. Please check your Groq account or use a different key.';
        } else if (error.message && error.message.toLowerCase().includes('configured')) {
            fallbackReply = 'Groq API key is not configured. Set GROQ_API_KEY in your backend .env file.';
        }
        
        const msg = message.toLowerCase();
        if (msg.includes('indent')) fallbackReply = 'IndentationError in Python? Ensure consistent spacing (use 4 spaces). Check that if/for/while blocks are properly indented. Mix tabs and spaces can cause issues.';
        else if (msg.includes('syntax')) fallbackReply = 'Syntax error? Check for missing semicolons (C/C++/Java), correct quotes, proper parentheses, and matching braces.';
        else if (msg.includes('undefined')) fallbackReply = 'NameError/Undefined variable? Declare variable before using. Check spelling. Ensure function/variable is in scope.';
        else if (msg.includes('import')) fallbackReply = 'Import error? Check library name spelling. Ensure package is installed (pip, npm, etc). Verify import path.';
        else if (msg.includes('loop')) fallbackReply = 'Infinite loop? Add break statement. Check loop condition. Add timeout limits. Use debugger to trace execution.';
        
        // Save fallback messages too
        db.run(`INSERT INTO chat_messages (role, content) VALUES (?, ?)`, ['user', message], (err) => {
            if (err) console.error('Error saving user message:', err);
        });
        db.run(`INSERT INTO chat_messages (role, content) VALUES (?, ?)`, ['assistant', fallbackReply], (err) => {
            if (err) console.error('Error saving bot message:', err);
        });
        
        res.json({ reply: fallbackReply });
    }
});

// --- API Endpoint: GET /api/chat/history ---
// Retrieve chat history
app.get('/api/chat/history', (req, res) => {
    db.all(`SELECT role, content, created_at FROM chat_messages ORDER BY created_at ASC`, [], (err, rows) => {
        if (err) {
            console.error('Error fetching chat history:', err);
            return res.status(500).json({ error: 'Failed to fetch chat history.' });
        }
        res.json({ messages: rows });
    });
});

// Basic root check (optional)
app.get('/', (req, res) => {
    res.send('AI Debug Helper Backend Running and ready for POST requests at /api/debug/analyze!');
});

// --- Start the Server ---
app.listen(PORT, HOST, () => {
    const displayHost = HOST === '0.0.0.0' ? 'localhost' : HOST;
    console.log(`✅ Backend Server listening on http://${displayHost}:${PORT}`);
});
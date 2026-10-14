import React, { useState, useEffect } from 'react';

const API_BASE = process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace(/\/$/, '') : '';
const API_URL = `${API_BASE}/api/chat`;

function Chatbot({ onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Load chat history on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/chat/history`)
      .then(res => res.json())
      .then(data => {
        if (data.messages && data.messages.length > 0) {
          const formatted = data.messages.map(m => ({
            text: m.content,
            sender: m.role === 'user' ? 'user' : 'bot'
          }));
          setMessages(formatted);
        }
      })
      .catch(err => console.error('Failed to load chat history:', err));
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });
      const data = await res.json();
      const botMessage = { text: data.reply || 'Sorry, I couldn\'t respond.', sender: 'bot' };
      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      setMessages(prev => [...prev, { text: 'Error connecting to chatbot.', sender: 'bot' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      width: 300,
      height: 400,
      background: '#fff',
      border: '1px solid #ccc',
      borderRadius: 8,
      boxShadow: '0 0 10px rgba(0,0,0,0.1)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000
    }}>
      <div style={{ padding: 10, borderBottom: '1px solid #ccc', display: 'flex', justifyContent: 'space-between' }}>
        <h4>AI Chatbot</h4>
        <button onClick={onClose}>X</button>
      </div>
      <div style={{ flex: 1, padding: 10, overflowY: 'auto' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: 10, textAlign: msg.sender === 'user' ? 'right' : 'left' }}>
            <div style={{
              display: 'inline-block',
              padding: 8,
              background: msg.sender === 'user' ? '#007bff' : '#f1f1f1',
              color: msg.sender === 'user' ? '#fff' : '#000',
              borderRadius: 4
            }}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && <div>Loading...</div>}
      </div>
      <div style={{ padding: 10, borderTop: '1px solid #ccc', display: 'flex' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          style={{ flex: 1, padding: 5 }}
          placeholder="Ask about code..."
        />
        <button onClick={sendMessage} disabled={loading}>Send</button>
      </div>
    </div>
  );
}

export default Chatbot;
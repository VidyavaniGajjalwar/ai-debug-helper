import React, { useState } from "react";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace(/\/$/, '') : '';
const API_URL = `${API_BASE}/api/debug/analyze`;

function CodeEditor() {
  const [code, setCode] = useState("");
  const [response, setResponse] = useState("");

  const runPythonCode = async () => {
    try {
      const res = await axios.post(API_URL, {
        code: code,
        language: 'Python'
      });
      // Display the full JSON response from the analyzer
      setResponse(JSON.stringify(res.data, null, 2));
    } catch (err) {
      setResponse("Server Error: " + (err.response ? JSON.stringify(err.response.data) : err.message));
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>AI Debugging Helper</h2>

      <textarea
        rows="10"
        cols="80"
        placeholder="Write your Python code here..."
        value={code}
        onChange={(e) => setCode(e.target.value)}
      ></textarea>

      <br />
      <br />

      <button onClick={runPythonCode}>Run Code</button>

      <h3>Output:</h3>
      <pre style={{ background: "#eee", padding: "10px" }}>
        {response}
      </pre>
    </div>
  );
}

export default CodeEditor;

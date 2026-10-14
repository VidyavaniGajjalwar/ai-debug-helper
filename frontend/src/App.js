import React, { useState } from 'react';
import FrontPage from './FrontPage';
import Lesson from './Lesson';
import './App.css';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { cpp } from '@codemirror/lang-cpp';
import { java } from '@codemirror/lang-java';
import { autocompletion, closeBrackets } from '@codemirror/autocomplete';
import { EditorView, Decoration } from '@codemirror/view';
import { StateField, StateEffect } from '@codemirror/state';
import Chatbot from './components/Chatbot';

// Custom autocomplete word lists for each language
const cKeywords = ['auto', 'break', 'case', 'char', 'const', 'continue', 'default', 'do', 'double', 'else', 'enum', 'extern', 'float', 'for', 'goto', 'if', 'int', 'long', 'register', 'return', 'short', 'signed', 'sizeof', 'static', 'struct', 'switch', 'typedef', 'union', 'unsigned', 'void', 'volatile', 'while', 'printf', 'scanf', 'main', 'include', 'define', 'stdio.h', 'stdlib.h', 'string.h', 'malloc', 'free'];

const cppKeywords = ['auto', 'break', 'case', 'char', 'const', 'continue', 'default', 'do', 'double', 'else', 'enum', 'extern', 'float', 'for', 'goto', 'if', 'int', 'long', 'register', 'return', 'short', 'signed', 'sizeof', 'static', 'struct', 'switch', 'typedef', 'union', 'unsigned', 'void', 'volatile', 'while', 'class', 'public', 'private', 'protected', 'virtual', 'friend', 'inline', 'namespace', 'using', 'template', 'typename', 'new', 'delete', 'this', 'cout', 'cin', 'endl', 'std', 'string', 'vector', 'map', 'set', 'cout', 'cerr'];

const javaKeywords = ['abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class', 'const', 'continue', 'default', 'do', 'double', 'else', 'enum', 'extends', 'final', 'finally', 'float', 'for', 'goto', 'if', 'implements', 'import', 'instanceof', 'int', 'interface', 'long', 'native', 'new', 'package', 'private', 'protected', 'public', 'return', 'short', 'static', 'strictfp', 'super', 'switch', 'synchronized', 'this', 'throw', 'throws', 'transient', 'try', 'void', 'volatile', 'while', 'String', 'System', 'out', 'println', 'print', 'main', 'args', 'public', 'static', 'void', 'class'];

const pythonKeywords = ['False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield', 'print', 'input', 'len', 'range', 'str', 'int', 'float', 'list', 'dict', 'set', 'tuple', 'open', 'file', 'read', 'write'];

const createCompletion = (keywords) => (context) => {
  const word = context.matchBefore(/\w*/);
  if (!word || (word.from === word.to && !context.explicit)) return null;
  return {
    from: word.from,
    options: keywords.map(k => ({ label: k, type: 'keyword' }))
  };
};

const cCompletion = createCompletion(cKeywords);
const cppCompletion = createCompletion(cppKeywords);
const javaCompletion = createCompletion(javaKeywords);
const pythonCompletion = createCompletion(pythonKeywords);

// State effect for marking error lines
const setErrorLines = StateEffect.define();

const errorLineHighlight = StateField.define({
  create() { return Decoration.none },
  update(decorations, tr) {
    for (let e of tr.effects) {
      if (e.is(setErrorLines)) {
        const builder = [];
        for (let lineNum of e.value) {
          if (lineNum > 0 && lineNum <= tr.state.doc.lines) {
            const line = tr.state.doc.line(lineNum);
            builder.push(Decoration.line({ class: "cm-error-line" }).range(line.from));
          }
        }
        return Decoration.set(builder, true);
      }
    }
    return decorations.map(tr.changes);
  },
  provide: f => EditorView.decorations.from(f)
});

const errorLineTheme = EditorView.baseTheme({
  ".cm-error-line": { backgroundColor: "#ffcccc", borderLeft: "3px solid #ff0000" }
});

const API_BASE = process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace(/\/$/, '') : '';
const API_URL = `${API_BASE}/api/debug/analyze`;

function App() {
  const [page, setPage] = useState('home');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('Python');
  const [lessonLang, setLessonLang] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showChatbot, setShowChatbot] = useState(false);
  const [editorView, setEditorView] = useState(null);
  const languages = ['Python', 'C', 'C++', 'Java'];

  const languageHint = {
    Python: 'print("Hello")',
    C: '#include <stdio.h>\n\nint main() {\n  printf("Hello");\n  return 0;\n}',
    'C++': '#include <iostream>\nusing namespace std;\n\nint main() {\n  cout << "Hello" << endl;\n  return 0;\n}',
    Java: 'public class Submission {\n  public static void main(String[] args) {\n    System.out.println("Hello");\n  }\n}',
  };

  const openLesson = (lang) => {
    setLessonLang(lang);
    setPage('lesson');
  };

  const getLangExtension = (lang) => {
    const langExt = (() => {
      switch (lang) {
        case 'Python': return python();
        case 'C': return cpp();
        case 'C++': return cpp();
        case 'Java': return java();
        default: return python();
      }
    })();
    
    // Get language-specific completion
    const completionFn = (() => {
      switch (lang) {
        case 'Python': return pythonCompletion;
        case 'C': return cCompletion;
        case 'C++': return cppCompletion;
        case 'Java': return javaCompletion;
        default: return pythonCompletion;
      }
    })();
    
    // Enable autocompletion for all languages with custom keywords
    return [langExt, autocompletion({ override: [completionFn] }), closeBrackets()];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate code is not empty
    if (!code.trim()) {
      setResult({ 
        errors: ['No code to analyze'], 
        explanation: 'Please enter some code in the editor before analyzing.',
        suggestions: 'Paste or type your code in the code editor above.',
        lineNumbers: []
      });
      return;
    }
    
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language })
      });
      
      if (!res.ok) {
        let backendData = null;
        try {
          backendData = await res.json();
        } catch (parseErr) {
          backendData = await res.text();
        }

        const errorText = backendData && backendData.errors
          ? backendData.errors.join('; ')
          : typeof backendData === 'string'
            ? backendData
            : `Server error: ${res.status}`;

        setResult({
          errors: [errorText],
          explanation: backendData?.explanation || 'Backend returned an error response.',
          suggestions: backendData?.suggestions || 'Check the backend server and retry, or inspect the network response.',
          lineNumbers: backendData?.lineNumbers || []
        });
        return;
      }
      
      const data = await res.json();
      setResult(data);
      
      // Update editor with error line highlighting
      try {
        if (editorView && typeof editorView.dispatch === 'function' && data.lineNumbers && data.lineNumbers.length > 0) {
          editorView.dispatch({
            effects: setErrorLines.of(data.lineNumbers)
          });
        }
      } catch (highlightErr) {
        console.warn('Failed to highlight error lines:', highlightErr);
      }
    } catch (err) {
      const message = err.message || 'Unknown error while contacting backend.';
      setResult({
        errors: [message.includes('Failed to fetch') ? 'Failed to reach backend.' : message],
        explanation: 'Unable to connect to the backend server. Ensure the backend is running and reachable from the frontend.',
        suggestions: 'Start the backend server, verify the API URL, or check the browser console for network issues.',
        lineNumbers: []
      });
    } finally {
      setLoading(false);
    }
  };

  if (page === 'home') return <FrontPage onStart={() => setPage('debug')} onOpenLesson={openLesson} />;

  if (page === 'lesson') return (
    <Lesson
      language={lessonLang}
      onBack={() => setPage('home')}
      onStartDebug={(lang) => { setLanguage(lang); setPage('debug'); }}
    />
  );

  return (
    <div className="App container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>AI Debugging Helper</h1>
        <div>
          <button onClick={() => setPage('home')}>Home</button>
          <button onClick={() => setShowChatbot(true)}>Chatbot</button>
        </div>
      </header>

      <form onSubmit={handleSubmit} style={{ marginTop: 12 }}>
        <div>
          <label htmlFor="lang">Language:</label>
          <select id="lang" value={language} onChange={(e) => setLanguage(e.target.value)}>
            {languages.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        <div style={{ marginTop: 8, fontSize: 14, color: '#333' }}>
          <strong>Tip:</strong> Use this starter code for {language}:
          <pre style={{ background: '#0f172a', color: '#fff', padding: 8, borderRadius: 4, fontSize: 12 }}>{languageHint[language]}</pre>
          <button type="button" style={{ marginTop: 4 }} onClick={() => setCode(languageHint[language])}>Insert starter code</button>
        </div>

        <div style={{ marginTop: 12 }}>
          <CodeMirror
            value={code}
            height="380px"
            extensions={[
              ...getLangExtension(language),
              errorLineHighlight,
              errorLineTheme
            ]}
            onCreateEditor={setEditorView}
            onChange={(value) => setCode(value)}
            basicSetup={{
              lineNumbers: true,
              highlightActiveLine: true,
              autocompletion: true,
              closeBrackets: true,
            }}
          />
        </div>

        <div className="controls" style={{ marginTop: 12 }}>
          <button type="submit" disabled={loading}>{loading ? 'Analyzing...' : 'Analyze'}</button>
          <button type="button" onClick={() => { setCode(''); setResult(null); }}>Clear</button>
        </div>
      </form>

      {result && (
        <div className="results">
          <h3>Analysis Result</h3>
          <div><strong>Status:</strong> 
            <span style={{ 
              color: result.errors?.length > 0 ? '#dc2626' : '#16a34a',
              fontWeight: 'bold',
              marginLeft: 8
            }}>
              {result.errors?.length > 0 ? 'Errors Found' : 'No Errors'}
            </span>
          </div>
          <div><strong>Explanation:</strong> {result.explanation || 'No explanation available.'}</div>
          <div><strong>Suggestions:</strong> {result.suggestions || 'No suggestions.'}</div>
          {result.errors && result.errors.length > 0 && (
            <div>
              <strong>Errors:</strong>
              <ul>
                {result.errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}
          {result.lineNumbers && result.lineNumbers.length > 0 && (
            <div><strong>Line(s):</strong> 
              <span style={{ background: '#fee2e2', padding: '2px 8px', borderRadius: 4, marginLeft: 8 }}>
                {result.lineNumbers.join(', ')}
              </span>
            </div>
          )}

          {result.errors && result.errors.length > 0 && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 12, marginTop: 12 }}>
              <h4 style={{ color: '#dc2626', marginTop: 0 }}>Errors</h4>
              <ul style={{ color: '#991b1b' }}>{result.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
            </div>
          )}

          {result.stdout !== undefined && (
            <div>
              <h4>Output (stdout)</h4>
              <pre>{result.stdout || '<empty>'}</pre>
            </div>
          )}

          {result.stderr !== undefined && (
            <div>
              <h4>Output (stderr)</h4>
              <pre>{result.stderr || '<empty>'}</pre>
            </div>
          )}

        </div>
      )}
      {showChatbot && <Chatbot onClose={() => setShowChatbot(false)} />}
    </div>
  );
}

export default App;

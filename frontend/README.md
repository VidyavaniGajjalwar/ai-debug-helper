# AI Debug Helper — Frontend

A React-based frontend for an AI-powered code debugging assistant.

## 🚀 Features

- **Multi-language Code Editor** — Syntax highlighting for Python, C, C++, and Java
- **Smart Autocomplete** — Language-specific keyword suggestions
- **Error Highlighting** — Visual indicators for error lines
- **AI Chatbot** — Get debugging help from an AI assistant
- **Lesson Tutorials** — Learn programming concepts

## 🛠️ Tech Stack

- React 19
- CodeMirror 6 (code editor)
- Groq SDK (AI integration)
- CSS Modules

## 📦 Installation

```bash
cd frontend
npm install
```

## ▶️ Run Development Server

```bash
npm start
```

Opens at [http://localhost:3000](http://localhost:3000)

## 🏗️ Build for Production

```bash
npm run build
```

Output: `build/` folder (ready for deployment)

## 🔌 API Connection

The frontend connects to a backend server at `http://localhost:5000`. Ensure the backend is running:

```bash
cd ../backend
npm start
```

## 📁 Project Structure

```
src/
├── App.js           # Main app with routing
├── FrontPage.jsx   # Landing page
├── Lesson.jsx      # Tutorial pages
├── components/
│   └── Chatbot.jsx # AI chatbot widget
├── componets/
│   └── CodeEditor.jsx # Code editor component
└── *.css            # Stylesheets
```

## 🎨 Customization

### Adding New Languages

Edit `App.js` to add language extensions:

```javascript
import { rust } from '@codemirror/lang-rust';
```

### Styling

- Main styles: `App.css`
- Page-specific: `FrontPage.css`, `index.css`

## 📄 License

ISC
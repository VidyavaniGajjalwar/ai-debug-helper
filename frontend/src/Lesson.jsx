import React from 'react';
import './FrontPage.css';

export default function Lesson({ language, onBack, onStartDebug }) {
  const lessons = {
    Python: {
      title: '🐍 Python — Easy Quick Lesson',
      content: `
Python is one of the easiest programming languages to learn.
It is widely used in AI, data science, web development, and automation.

🔹 Important things to remember:
• Python uses indentation (spaces) instead of brackets {}
• Code is easy to read and write
• No need to declare data types
• Errors are shown clearly

🔹 Example:
print("Hello, world!")

👉 Output:
Hello, world!
`,
    },

    C: {
      title: '💻 C / C++ — Easy Quick Lesson',
      content: `
C and C++ are fast and powerful programming languages.
They are mostly used in system software, games, and embedded systems.

🔹 Important things to remember:
• Code must be compiled before running
• Every program starts from main()
• Semicolon (;) is compulsory
• C uses functions, C++ supports classes

🔹 Simple C example:
#include <stdio.h>

int main() {
  printf("Hello, world!");
  return 0;
}

👉 Common mistake: missing semicolon or quotes
`,
    },

    'C/C++': {
      title: '💻 C / C++ — Easy Quick Lesson',
      content: `
C and C++ are compiled languages.

🔹 Key points:
• Use gcc or g++ compiler
• Header files are important
• Memory handling is manual in C
• C++ supports OOP concepts
`,
    },

    Java: {
      title: '☕ Java — Easy Quick Lesson',
      content: `
Java is an object-oriented programming language.
It runs on JVM, so it works on any system.

🔹 Important things to remember:
• Every program must be inside a class
• main() method is compulsory
• Java is case-sensitive
• Uses JVM for execution

🔹 Example:
public class Hello {
  public static void main(String[] args) {
    System.out.println("Hello, world!");
  }
}

👉 Common mistake: class name and file name must be same
`,
    },

    Compiler: {
      title: '⚙️ Compiler-Based Error Checking',
      content: `
This project uses real compilers to find errors in your code.

🔹 What it does:
• Checks syntax errors
• Finds compile-time mistakes
• Shows error messages like real compiler

🔒 Safety:
Code is executed inside a secure environment (sandbox)
`,
    },
  };

  const info = lessons[language] || {
    title: language,
    content: 'Lesson not available for this language.',
  };

  return (
    <div className="FrontPage">
      <div className="hero-card">
        <h2>{info.title}</h2>

        <pre style={{ whiteSpace: 'pre-wrap', textAlign: 'left', lineHeight: '1.6' }}>
          {info.content}
        </pre>

        <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
          <button onClick={onBack}>⬅ Back</button>
          <button onClick={() => onStartDebug(language)}>
            ▶ Start Debugging ({language})
          </button>
        </div>
      </div>
    </div>
  );
}

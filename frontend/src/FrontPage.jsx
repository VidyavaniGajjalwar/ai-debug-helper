import React from 'react';
import "./FrontPage.css"

export default function FrontPage({ onStart, onOpenLesson }) {
  return (
    <div className="FrontPage">
      <div className="hero-card">
        <h1><center>Welcome to AI Debugging Helper</center></h1>
        <p className='subtitle'>Paste your code, select a language and get quick analysis and suggested fixes.</p>
        <div className='features'>
         <button onClick={() => onOpenLesson('Python')}><span>Python</span></button>
          <button onClick={() => onOpenLesson('C')}><span>C/C++</span></button>
          <button onClick={() => onOpenLesson('Java')}><span>Java</span></button>
          <button onClick={() => onOpenLesson('Compiler')}><span>Compiler-based Analysis</span></button>
        </div>

        <button className="start-bin" onClick={onStart}>Start Debugging</button>
        <p className='note'>Built for students • Secure • Beginner friendly</p>
      </div>
    </div>
  );
}


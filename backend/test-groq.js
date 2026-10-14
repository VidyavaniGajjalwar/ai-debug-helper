require('dotenv').config();
const Groq = require('groq-sdk');

console.log('Environment:', {
  apiKeySet: !!process.env.GROQ_API_KEY,
  apiKeyLength: process.env.GROQ_API_KEY?.length || 0
});

const groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });

(async () => {
  try {
    console.log('Testing Groq API...');
    const completion = await groqClient.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'user', content: 'Say hello' }
      ],
      max_tokens: 50
    });
    console.log('Success! Response:', completion.choices[0].message.content);
  } catch (err) {
    console.error('Error:', err.message);
    console.error('Error Code:', err.code);
    console.error('Error Status:', err.status);
  }
})();

const { analyzeCode } = require('./analyzer');

// Test 1: Valid Python code
console.log('Test 1: Valid Python code');
analyzeCode('print("hello")', 'Python').then(result => {
  console.log(JSON.stringify(result, null, 2));
}).catch(err => console.error('ERROR:', err.message));

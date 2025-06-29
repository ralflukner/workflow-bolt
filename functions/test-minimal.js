// Ultra-minimal Firebase Function to test platform compatibility
const { onCall } = require('firebase-functions/v2/https');

exports.testMinimal = onCall({}, async (request) => {
  return { 
    message: 'Hello World', 
    timestamp: new Date().toISOString() 
  };
});
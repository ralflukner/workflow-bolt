// diagnostic.js - Minimal diagnostic function to test deployment
const { onRequest } = require('firebase-functions/v2/https');

// Ultra-minimal function with startup logging
exports.diagnostic = onRequest(
  {
    // Increase memory and timeout for diagnostics
    memory: '512MiB',
    timeoutSeconds: 300,
    minInstances: 0,
    maxInstances: 1
  },
  async (req, res) => {
    console.log('=== DIAGNOSTIC FUNCTION STARTED ===');
    console.log('Node version:', process.version);
    console.log('Memory usage:', process.memoryUsage());
    console.log('Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      FUNCTIONS_EMULATOR: process.env.FUNCTIONS_EMULATOR,
      K_SERVICE: process.env.K_SERVICE,
      K_REVISION: process.env.K_REVISION,
      PORT: process.env.PORT
    });
    
    res.status(200).json({
      success: true,
      nodeVersion: process.version,
      timestamp: new Date().toISOString(),
      memory: process.memoryUsage()
    });
  }
);

// Add startup time logging
console.log(`[${new Date().toISOString()}] Module loaded: diagnostic.js`);
console.log(`[${new Date().toISOString()}] Current working directory:`, process.cwd());
console.log(`[${new Date().toISOString()}] __dirname:`, __dirname);
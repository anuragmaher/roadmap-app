// Proxy all API requests to the backend server
const path = require('path');

// Import the backend server
const app = require('../backend/src/server');

// Export the Express app as a serverless function
module.exports = app;
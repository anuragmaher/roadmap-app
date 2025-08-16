const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const roadmapRoutes = require('./routes/roadmaps');
const itemRoutes = require('./routes/items');

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Add a root route for serverless debugging
app.get('/', (req, res) => {
  res.json({ status: 'OK', message: 'Roadmap API root' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Roadmap API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/roadmaps', roadmapRoutes);
app.use('/api/items', itemRoutes);

// Setup for both local development and Vercel deployment
const PORT = process.env.PORT || 5001;

// Export the app for serverless functions
module.exports = app;

// Only start the server if not in serverless environment
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

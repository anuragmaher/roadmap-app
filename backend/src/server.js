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

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Roadmap API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/roadmaps', roadmapRoutes);
app.use('/api/items', itemRoutes);

// 🚀 Remove app.listen here
// Vercel will manage the server for us

module.exports = app;

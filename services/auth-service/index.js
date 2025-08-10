// index.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');

dotenv.config();

const app = express();

// ---- CORS (no wildcard route registrations) ----
const corsOptions = {
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions)); // handles preflight automatically

// (optional) tiny request logger to confirm preflights hit the server
app.use((req, _res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.use(express.json());

// health check
app.get('/health', (_req, res) => res.json({ ok: true }));

// routes
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 3001;

// Start server first; connect to Mongo after (so port is open even if DB is slow)
app.listen(PORT, async () => {
  console.log(`Auth service running on port ${PORT}`);
  try {
    if (!process.env.MONGO_URI) throw new Error('MONGO_URI is missing');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('Mongo connect failed:', err.message);
  }
});

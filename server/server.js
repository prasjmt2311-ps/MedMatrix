const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: function(origin, callback) {
    const allowed = [
      'http://localhost:5173',
      'https://unity-cure2-0.vercel.app',
      process.env.FRONTEND_URL,
    ].filter(Boolean);
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(morgan('dev'));
app.use(express.json());

// Routes (we'll fill these in Step 3)
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/hospital', require('./routes/hospitalRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/sos', require('./routes/sosRoutes'));
app.use('/api/transfer', require('./routes/transferRoutes'));

// Health check
app.get('/', (req, res) => res.json({ message: '🏥 UnityCure API running' }));

// 404 handler
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server error', error: err.message });
});

const http = require('http');
const initSocket = require('./socket');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const io = initSocket(server);
app.set('io', io);

server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
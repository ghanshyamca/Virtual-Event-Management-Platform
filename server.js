const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { SERVER, RATE_LIMIT: RATE_CONFIG, SECURITY, MESSAGES } = require('./config/constants');

const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const { PORT, NODE_ENV, HOST } = SERVER;

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: RATE_CONFIG.WINDOW_MS,
  max: RATE_CONFIG.MAX_REQUESTS,
  message: RATE_CONFIG.MESSAGE
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Virtual Event Management Platform API is running',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/users', authRoutes);
app.use('/events', eventRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Global error handler
app.use(errorHandler);

// Start server only if not in test environment
let server;
if (NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📊 Health check: http://${HOST}:${PORT}/health`);
    console.log(`🔐 Environment: ${NODE_ENV}`);
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  if (server) {
    server.close(() => {
      console.log('Process terminated');
    });
  }
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  if (server) {
    server.close(() => {
      console.log('Process terminated');
    });
  }
});

module.exports = app;

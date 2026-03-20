require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const app = express();

// ── Security & Middleware ──────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') || '*' }));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/users',        require('./routes/users'));
app.use('/api/vehicles',     require('./routes/vehicles'));
app.use('/api/services',     require('./routes/services'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/points',       require('./routes/points'));
app.use('/api/promotions',   require('./routes/promotions'));
app.use('/api/notifications',require('./routes/notifications'));
app.use('/api/reviews',      require('./routes/reviews'));
app.use('/api/admin',        require('./routes/admin'));

// ── Health Check ──────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Error Handler ─────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`CHP Loyalty API running on port ${PORT}`);
});

module.exports = app;

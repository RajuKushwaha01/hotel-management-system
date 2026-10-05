const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public QR endpoints — no login, so a looser but still real cap against abuse/scraping
const qrLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 60,
  message: { success: false, message: 'Too many requests. Please try again shortly.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authLimiter, qrLimiter };
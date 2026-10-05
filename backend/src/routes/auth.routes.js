const express = require('express');
const {
  register, login, getMe, logout,
  verifyEmail, resendVerification,
  forgotPassword, resetPassword,
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const { authLimiter } = require('../middleware/rateLimiter');
const { registerValidation, loginValidation, resetPasswordValidation } = require('../middleware/validators');

const router = express.Router();

router.post('/register', authLimiter, registerValidation, register);
router.post('/login', authLimiter, loginValidation, login);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

router.post('/verify-email', authLimiter, verifyEmail);
router.post('/resend-verification', protect, authLimiter, resendVerification);

router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPasswordValidation, resetPassword);

module.exports = router;
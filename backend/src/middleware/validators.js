const { body, validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ApiError(400, errors.array()[0].msg));
  }
  next();
};

// Password policy: min 8 chars, at least one uppercase, one lowercase, one number, one special char
const passwordPolicy = body('password')
  .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
  .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
  .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
  .matches(/[0-9]/).withMessage('Password must contain a number')
  .matches(/[^A-Za-z0-9]/).withMessage('Password must contain a special character');

const registerValidation = [
  body('firstName').trim().notEmpty().withMessage('First name is required').isLength({ max: 50 }),
  body('lastName').trim().notEmpty().withMessage('Last name is required').isLength({ max: 50 }),
  body('email').isEmail().withMessage('Enter a valid email').normalizeEmail(),
  body('phone').optional().isMobilePhone().withMessage('Enter a valid phone number'),
  passwordPolicy,
  handleValidation,
];

const loginValidation = [
  body('email').isEmail().withMessage('Enter a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidation,
];

const resetPasswordValidation = [
  passwordPolicy,
  handleValidation,
];

module.exports = { registerValidation, loginValidation, resetPasswordValidation, handleValidation };
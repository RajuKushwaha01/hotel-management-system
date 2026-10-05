const crypto = require('crypto');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const ApiError = require('../utils/ApiError');
const emailService = require('../services/email');
const { logAction } = require('../middleware/auditLogger');

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION = 30 * 60 * 1000; // 30 minutes

const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) throw new ApiError(400, 'Email is already registered');

    const user = new User({ firstName, lastName, email, phone, password, role: 'customer' });
    const verifyToken = user.generateEmailVerificationToken();
    await user.save();

    const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${verifyToken}`;
    emailService.sendVerificationEmail(user, verifyUrl); // fire-and-forget, doesn't block response

    const token = generateToken(user._id, user.role);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      success: true,
      message: 'Account created. Please check your email to verify your account.',
      token,
      user: user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) throw new ApiError(401, 'Invalid email or password');

    if (user.isLocked()) {
      const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
      throw new ApiError(423, `Account temporarily locked due to too many failed attempts. Try again in ${minutesLeft} minute(s).`);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      user.failedLoginAttempts += 1;
      const locked = user.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS;
      if (locked) {
        user.lockUntil = Date.now() + LOCK_DURATION;
        user.failedLoginAttempts = 0;
      }
      await user.save();
      await logAction({
        user,
        action: locked ? 'ACCOUNT_LOCKED' : 'LOGIN_FAILED',
        module: 'security',
        req,
        targetType: 'User',
        targetId: user._id,
        targetLabel: user.email,
        description: locked
          ? `Account locked after repeated failed logins: ${user.email}`
          : `Failed login attempt: ${user.email}`,
      });
      throw new ApiError(401, 'Invalid email or password');
    }

    if (!user.isActive) throw new ApiError(403, 'Account has been deactivated');

    // Successful login: reset attempt counter and lock
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLogin = new Date();
    await user.save();

    const sid = crypto.randomBytes(8).toString('hex');
    const token = generateToken(user._id, user.role, sid);

    await logAction({
      user,
      sessionId: sid,
      action: 'LOGIN_SUCCESS',
      module: 'security',
      req,
      targetType: 'User',
      targetId: user._id,
      targetLabel: user.email,
      description: `${user.firstName} ${user.lastName} signed in`,
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, user: req.user.toSafeObject() });
  } catch (error) {
    next(error);
  }
};

// ---------- EMAIL VERIFICATION ----------
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    });
    if (!user) throw new ApiError(400, 'Verification link is invalid or has expired');

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    next(error);
  }
};

const resendVerification = async (req, res, next) => {
  try {
    const user = req.user;
    if (user.isEmailVerified) throw new ApiError(400, 'Email is already verified');

    const verifyToken = user.generateEmailVerificationToken();
    await user.save();

    const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${verifyToken}`;
    await emailService.sendVerificationEmail(user, verifyUrl);

    res.status(200).json({ success: true, message: 'Verification email resent' });
  } catch (error) {
    next(error);
  }
};

// ---------- FORGOT / RESET PASSWORD ----------
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Always return success (don't reveal whether the email exists — prevents email enumeration)
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists with that email, a reset link has been sent.',
      });
    }

    const resetToken = user.generatePasswordResetToken();
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    await emailService.sendPasswordResetEmail(user, resetUrl);

    res.status(200).json({
      success: true,
      message: 'If an account exists with that email, a reset link has been sent.',
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select('+password');
    if (!user) throw new ApiError(400, 'Reset link is invalid or has expired');

    user.password = newPassword; // pre-save hook hashes it
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now log in.',
    });
  } catch (error) {
    next(error);
  }
};

// ---------- LOGOUT ----------
const logout = async (req, res, next) => {
  try {
    // Clear cookie server-side if set
    res.clearCookie('token');
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  logout,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
};
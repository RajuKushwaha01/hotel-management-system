const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const ROLES = ['super_admin', 'hotel_manager', 'receptionist', 'housekeeping', 'fnb_staff', 'chef', 'accountant', 'maintenance', 'customer'];

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ROLES, default: 'customer' },
    avatar: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    isWalkIn: { type: Boolean, default: false },

    // Email verification
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: String,
    emailVerificationExpires: Date,

    // Password reset
    passwordResetToken: String,
    passwordResetExpires: Date,

    // Login attempt / lockout protection
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: Date,

    // Guest profile fields
    address: String,
    dateOfBirth: Date,
    idType: { type: String, enum: ['passport', 'national_id', 'driving_license', 'other'] },
    idNumber: String,
    idDocumentImage: String,
    preferences: String,

    loyaltyPoints: { type: Number, default: 0 },
    membershipLevel: { type: String, enum: ['Bronze', 'Silver', 'Gold', 'Platinum'], default: 'Bronze' },
    lastLogin: Date,
  },
  { timestamps: true }
);

// FIXED: Removed `next` parameter and `next()` calls from async pre-save hook
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.emailVerificationToken;
  delete obj.passwordResetToken;
  delete obj.failedLoginAttempts;
  delete obj.lockUntil;
  return obj;
};

userSchema.methods.isLocked = function () {
  return this.lockUntil && this.lockUntil > Date.now();
};

userSchema.methods.generateEmailVerificationToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return token;
};

userSchema.methods.generatePasswordResetToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
  this.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  return token;
};

module.exports = mongoose.model('User', userSchema);
module.exports.ROLES = ROLES;
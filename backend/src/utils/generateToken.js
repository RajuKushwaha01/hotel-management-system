const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const generateToken = (userId, role, sessionId = crypto.randomBytes(8).toString('hex')) => {
  return jwt.sign({ id: userId, role, sid: sessionId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

module.exports = generateToken;
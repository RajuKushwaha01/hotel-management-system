const { doubleCsrf } = require('csrf-csrf');

const { doubleCsrfProtection, generateCsrfToken } = doubleCsrf({
  getSecret: () => process.env.JWT_SECRET,
  cookieName: 'x-csrf-token',
  cookieOptions: {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
  },
  size: 64,
  getTokenFromRequest: (req) => req.headers['x-csrf-token'],
});

// Endpoint to fetch a fresh CSRF token for the frontend to store and send back
const getCsrfToken = (req, res) => {
  const token = generateCsrfToken(req, res);
  res.status(200).json({ success: true, csrfToken: token });
};

module.exports = { doubleCsrfProtection, getCsrfToken };
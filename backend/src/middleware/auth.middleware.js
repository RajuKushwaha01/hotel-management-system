const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

const protect = async (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) throw new ApiError(401, 'Not authorized, no token provided');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) throw new ApiError(401, 'User no longer exists');
    if (!user.isActive) throw new ApiError(403, 'Account has been deactivated');

    req.user = user;
    req.sessionId = decoded.sid;
    next();
  } catch (error) {
    next(new ApiError(401, 'Not authorized, token failed'));
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, `Role '${req.user.role}' is not permitted to access this resource`));
    }
    next();
  };
};

module.exports = { protect, authorize };
const jwt        = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User       = require('../models/userModel');

// ─── Protect routes – verify JWT ──────────────────────────────────────────────
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Accept token from Authorization header OR httpOnly cookie
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorised – no token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      res.status(401);
      throw new Error('Not authorised – user not found');
    }

    if (req.user.isSuspended) {
      res.status(403);
      throw new Error('Your account has been suspended. Contact support.');
    }

    next();
  } catch (err) {
    res.status(401);
    throw new Error('Not authorised – token invalid or expired');
  }
});

// ─── Role-based access control ─────────────────────────────────────────────────
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      res.status(403);
      throw new Error(
        `Role '${req.user.role}' is not permitted to access this resource`
      );
    }
    next();
  };
};

// ─── Optional auth (doesn't fail if no token) ─────────────────────────────────
const optionalAuth = asyncHandler(async (req, _res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch (_) {
      req.user = null;
    }
  }
  next();
});

module.exports = { protect, authorize, optionalAuth };

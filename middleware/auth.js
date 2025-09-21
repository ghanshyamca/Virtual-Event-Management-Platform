const jwt = require('jsonwebtoken');
const { userStore } = require('../models/User');
const { JWT, MESSAGES, HTTP_STATUS } = require('../config/constants');

// JWT Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  console.log("token", token);
  if (!token) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      error: MESSAGES.ERROR.ACCESS_DENIED,
      message: 'No token provided'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT.SECRET);

    console.log("decoded", decoded);
    
    // Get user from store
    const user = userStore.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        error: MESSAGES.ERROR.ACCESS_DENIED,
        message: MESSAGES.ERROR.INVALID_TOKEN
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        error: MESSAGES.ERROR.ACCESS_DENIED,
        message: MESSAGES.ERROR.TOKEN_EXPIRED
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        error: MESSAGES.ERROR.ACCESS_DENIED,
        message: MESSAGES.ERROR.INVALID_TOKEN
      });
    }

    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: 'Internal server error',
      message: 'Token verification failed'
    });
  }
};

// Authorization middleware for organizers
const requireOrganizer = (req, res, next) => {
  if (req.user.role !== 'organizer') {
    return res.status(403).json({
      error: 'Access forbidden',
      message: 'Organizer role required'
    });
  }
  next();
};

// Authorization middleware for attendees
const requireAttendee = (req, res, next) => {
  if (req.user.role !== 'attendee') {
    return res.status(403).json({
      error: 'Access forbidden',
      message: 'Attendee role required'
    });
  }
  next();
};

// Middleware to check if user owns the resource or is an organizer
const requireOwnershipOrOrganizer = (req, res, next) => {
  const resourceUserId = req.params.userId || req.body.userId;
  
  if (req.user.role === 'organizer' || req.user.id === resourceUserId) {
    return next();
  }

  return res.status(403).json({
    error: 'Access forbidden',
    message: 'You can only access your own resources'
  });
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
    const user = userStore.findById(decoded.userId);
    
    if (user && user.isActive) {
      req.user = user;
    } else {
      req.user = null;
    }
  } catch (error) {
    req.user = null;
  }

  next();
};

// Generate JWT token
const generateToken = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role
  };

  const options = {
    expiresIn: JWT.EXPIRES_IN,
    issuer: JWT.ISSUER,
    audience: JWT.AUDIENCE
  };

  return jwt.sign(payload, JWT.SECRET, options);
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT.SECRET);
  } catch (error) {
    throw error;
  }
};

module.exports = {
  authenticateToken,
  requireOrganizer,
  requireAttendee,
  requireOwnershipOrOrganizer,
  optionalAuth,
  generateToken,
  verifyToken
};

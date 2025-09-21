// Configuration constants and environment variables
require('dotenv').config();

// Server Configuration
const SERVER = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  HOST: process.env.HOST || 'localhost'
};

// JWT Configuration
const JWT = {
  SECRET: process.env.JWT_SECRET || 'fallback-secret-key-change-in-production',
  EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  ISSUER: 'virtual-event-platform',
  AUDIENCE: 'virtual-event-users'
};

// Email Configuration
const EMAIL = {
  HOST: process.env.EMAIL_HOST || 'sandbox.smtp.mailtrap.io',
  PORT: parseInt(process.env.EMAIL_PORT) || 2525,
  USER: process.env.EMAIL_USER || '43e55841fd8788',
  PASS: process.env.EMAIL_PASS || '02b462de3398df',
  FROM_NAME: 'Virtual Event Platform',
  FROM_EMAIL: process.env.EMAIL_USER || 'noreply@virtualevent.com'
};

// Rate Limiting Configuration
const RATE_LIMIT = {
  WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  MESSAGE: {
    error: 'Too many requests from this IP, please try again later.'
  }
};

// Security Configuration
const SECURITY = {
  BCRYPT_SALT_ROUNDS: 12,
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  HELMET_CONFIG: {
    contentSecurityPolicy: process.env.NODE_ENV === 'production'
  }
};

// Database/Storage Configuration
const STORAGE = {
  DATA_DIR: 'data',
  USERS_FILE: 'users.json',
  EVENTS_FILE: 'events.json'
};

// Validation Constants
const VALIDATION = {
  PASSWORD: {
    MIN_LENGTH: 8,
    PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    MESSAGE: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  },
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50
  },
  EVENT: {
    TITLE: {
      MIN_LENGTH: 3,
      MAX_LENGTH: 200
    },
    DESCRIPTION: {
      MIN_LENGTH: 10,
      MAX_LENGTH: 2000
    },
    DURATION: {
      MIN: 15, // minutes
      MAX: 480 // 8 hours
    },
    MAX_PARTICIPANTS: {
      MIN: 1,
      MAX: 10000
    }
  }
};

// Event Categories
const EVENT_CATEGORIES = [
  'technology',
  'business', 
  'education',
  'entertainment',
  'health',
  'sports',
  'general'
];

// Event Status Options
const EVENT_STATUS = [
  'scheduled',
  'ongoing',
  'completed',
  'cancelled'
];

// User Roles
const USER_ROLES = [
  'organizer',
  'attendee'
];

// API Response Messages
const MESSAGES = {
  SUCCESS: {
    USER_REGISTERED: 'User registered successfully',
    LOGIN_SUCCESSFUL: 'Login successful',
    PROFILE_UPDATED: 'Profile updated successfully',
    LOGOUT_SUCCESSFUL: 'Logout successful',
    EVENT_CREATED: 'Event created successfully',
    EVENT_UPDATED: 'Event updated successfully',
    EVENT_DELETED: 'Event deleted successfully',
    EVENT_REGISTERED: 'Successfully registered for the event',
    EVENT_UNREGISTERED: 'Successfully unregistered from the event'
  },
  ERROR: {
    EMAIL_EXISTS: 'Email already exists',
    INVALID_CREDENTIALS: 'Invalid email or password',
    USER_NOT_FOUND: 'User not found',
    EVENT_NOT_FOUND: 'Event not found',
    ACCESS_DENIED: 'Access denied',
    INVALID_TOKEN: 'Invalid token',
    TOKEN_EXPIRED: 'Token expired',
    VALIDATION_FAILED: 'Validation failed',
    EVENT_FULL: 'Event is full',
    ALREADY_REGISTERED: 'You are already registered for this event',
    NOT_REGISTERED: 'You are not registered for this event',
    UNAUTHORIZED: 'Unauthorized access',
    ORGANIZER_ONLY: 'Only organizers can perform this action',
    ATTENDEE_ONLY: 'Only attendees can perform this action'
  }
};

// HTTP Status Codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500
};

// Pagination Defaults
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100
};

// Time Constants
const TIME = {
  ONE_MINUTE: 60 * 1000,
  ONE_HOUR: 60 * 60 * 1000,
  ONE_DAY: 24 * 60 * 60 * 1000,
  ONE_WEEK: 7 * 24 * 60 * 60 * 1000
};

// Development/Testing Configuration
const DEV = {
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  ENABLE_LOGGING: process.env.ENABLE_LOGGING !== 'false',
  TEST_MODE: process.env.NODE_ENV === 'test'
};

module.exports = {
  SERVER,
  JWT,
  EMAIL,
  RATE_LIMIT,
  SECURITY,
  STORAGE,
  VALIDATION,
  EVENT_CATEGORIES,
  EVENT_STATUS,
  USER_ROLES,
  MESSAGES,
  HTTP_STATUS,
  PAGINATION,
  TIME,
  DEV
};

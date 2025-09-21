const Joi = require('joi');
const { VALIDATION, EVENT_CATEGORIES, EVENT_STATUS, USER_ROLES, MESSAGES, HTTP_STATUS } = require('../config/constants');

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: MESSAGES.ERROR.VALIDATION_FAILED,
        details: errors
      });
    }
    
    req.body = value; // Update req.body with validated value (includes defaults)
    next();
  };
};

// User registration validation schema
const registerSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .min(VALIDATION.PASSWORD.MIN_LENGTH)
    .pattern(VALIDATION.PASSWORD.PATTERN)
    .required()
    .messages({
      'string.min': `Password must be at least ${VALIDATION.PASSWORD.MIN_LENGTH} characters long`,
      'string.pattern.base': VALIDATION.PASSWORD.MESSAGE,
      'any.required': 'Password is required'
    }),
  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Password confirmation does not match password',
      'any.required': 'Password confirmation is required'
    }),
  firstName: Joi.string()
    .min(VALIDATION.NAME.MIN_LENGTH)
    .max(VALIDATION.NAME.MAX_LENGTH)
    .required()
    .messages({
      'string.min': `First name must be at least ${VALIDATION.NAME.MIN_LENGTH} characters long`,
      'string.max': `First name cannot exceed ${VALIDATION.NAME.MAX_LENGTH} characters`,
      'any.required': 'First name is required'
    }),
  lastName: Joi.string()
    .min(VALIDATION.NAME.MIN_LENGTH)
    .max(VALIDATION.NAME.MAX_LENGTH)
    .required()
    .messages({
      'string.min': `Last name must be at least ${VALIDATION.NAME.MIN_LENGTH} characters long`,
      'string.max': `Last name cannot exceed ${VALIDATION.NAME.MAX_LENGTH} characters`,
      'any.required': 'Last name is required'
    }),
  role: Joi.string()
    .valid(...USER_ROLES)
    .default('attendee')
    .messages({
      'any.only': `Role must be one of: ${USER_ROLES.join(', ')}`
    })
});

// User login validation schema
const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    })
});

// Event creation validation schema
const createEventSchema = Joi.object({
  title: Joi.string()
    .min(3)
    .max(200)
    .required()
    .messages({
      'string.min': 'Event title must be at least 3 characters long',
      'string.max': 'Event title cannot exceed 200 characters',
      'any.required': 'Event title is required'
    }),
  description: Joi.string()
    .min(10)
    .max(2000)
    .required()
    .messages({
      'string.min': 'Event description must be at least 10 characters long',
      'string.max': 'Event description cannot exceed 2000 characters',
      'any.required': 'Event description is required'
    }),
  date: Joi.date()
    .min('now')
    .required()
    .messages({
      'date.min': 'Event date must be in the future',
      'any.required': 'Event date is required'
    }),
  time: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required()
    .messages({
      'string.pattern.base': 'Time must be in HH:MM format (24-hour)',
      'any.required': 'Event time is required'
    }),
  duration: Joi.number()
    .integer()
    .min(15)
    .max(480)
    .default(60)
    .messages({
      'number.min': 'Event duration must be at least 15 minutes',
      'number.max': 'Event duration cannot exceed 8 hours (480 minutes)'
    }),
  maxParticipants: Joi.number()
    .integer()
    .min(1)
    .max(10000)
    .allow(null)
    .messages({
      'number.min': 'Maximum participants must be at least 1',
      'number.max': 'Maximum participants cannot exceed 10,000'
    }),
  category: Joi.string()
    .valid('technology', 'business', 'education', 'entertainment', 'health', 'sports', 'general')
    .default('general')
    .messages({
      'any.only': 'Category must be one of: technology, business, education, entertainment, health, sports, general'
    }),
  isPublic: Joi.boolean()
    .default(true),
  meetingLink: Joi.string()
    .uri()
    .allow(null, '')
    .messages({
      'string.uri': 'Meeting link must be a valid URL'
    })
});

// Event update validation schema
const updateEventSchema = Joi.object({
  title: Joi.string()
    .min(3)
    .max(200)
    .messages({
      'string.min': 'Event title must be at least 3 characters long',
      'string.max': 'Event title cannot exceed 200 characters'
    }),
  description: Joi.string()
    .min(10)
    .max(2000)
    .messages({
      'string.min': 'Event description must be at least 10 characters long',
      'string.max': 'Event description cannot exceed 2000 characters'
    }),
  date: Joi.date()
    .min('now')
    .messages({
      'date.min': 'Event date must be in the future'
    }),
  time: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .messages({
      'string.pattern.base': 'Time must be in HH:MM format (24-hour)'
    }),
  duration: Joi.number()
    .integer()
    .min(15)
    .max(480)
    .messages({
      'number.min': 'Event duration must be at least 15 minutes',
      'number.max': 'Event duration cannot exceed 8 hours (480 minutes)'
    }),
  maxParticipants: Joi.number()
    .integer()
    .min(1)
    .max(10000)
    .allow(null)
    .messages({
      'number.min': 'Maximum participants must be at least 1',
      'number.max': 'Maximum participants cannot exceed 10,000'
    }),
  category: Joi.string()
    .valid('technology', 'business', 'education', 'entertainment', 'health', 'sports', 'general')
    .messages({
      'any.only': 'Category must be one of: technology, business, education, entertainment, health, sports, general'
    }),
  status: Joi.string()
    .valid('scheduled', 'ongoing', 'completed', 'cancelled')
    .messages({
      'any.only': 'Status must be one of: scheduled, ongoing, completed, cancelled'
    }),
  isPublic: Joi.boolean(),
  meetingLink: Joi.string()
    .uri()
    .allow(null, '')
    .messages({
      'string.uri': 'Meeting link must be a valid URL'
    })
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

// User profile update validation schema
const updateProfileSchema = Joi.object({
  firstName: Joi.string()
    .min(2)
    .max(50)
    .messages({
      'string.min': 'First name must be at least 2 characters long',
      'string.max': 'First name cannot exceed 50 characters'
    }),
  lastName: Joi.string()
    .min(2)
    .max(50)
    .messages({
      'string.min': 'Last name must be at least 2 characters long',
      'string.max': 'Last name cannot exceed 50 characters'
    }),
  email: Joi.string()
    .email()
    .messages({
      'string.email': 'Please provide a valid email address'
    })
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

// Password change validation schema
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'any.required': 'Current password is required'
    }),
  newPassword: Joi.string()
    .min(VALIDATION.PASSWORD.MIN_LENGTH)
    .pattern(VALIDATION.PASSWORD.PATTERN)
    .required()
    .messages({
      'string.min': `New password must be at least ${VALIDATION.PASSWORD.MIN_LENGTH} characters long`,
      'string.pattern.base': VALIDATION.PASSWORD.MESSAGE,
      'any.required': 'New password is required'
    }),
  confirmNewPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'New password confirmation does not match new password',
      'any.required': 'New password confirmation is required'
    })
});

// Query parameter validation schemas
const eventQuerySchema = Joi.object({
  category: Joi.string()
    .valid(...EVENT_CATEGORIES),
  status: Joi.string()
    .valid(...EVENT_STATUS),
  isPublic: Joi.boolean(),
  startDate: Joi.date(),
  endDate: Joi.date(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10)
});

// Validation middleware functions
const validateRegister = validate(registerSchema);
const validateLogin = validate(loginSchema);
const validateCreateEvent = validate(createEventSchema);
const validateUpdateEvent = validate(updateEventSchema);
const validateUpdateProfile = validate(updateProfileSchema);
const validateChangePassword = validate(changePasswordSchema);

// Query validation middleware
const validateEventQuery = (req, res, next) => {
  const { error, value } = eventQuerySchema.validate(req.query, { abortEarly: false });
  
  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    
    return res.status(400).json({
      error: 'Query validation failed',
      details: errors
    });
  }
  
  req.query = value;
  next();
};

module.exports = {
  validate,
  validateRegister,
  validateLogin,
  validateCreateEvent,
  validateUpdateEvent,
  validateUpdateProfile,
  validateChangePassword,
  validateEventQuery,
  registerSchema,
  loginSchema,
  createEventSchema,
  updateEventSchema,
  updateProfileSchema,
  changePasswordSchema,
  eventQuerySchema
};

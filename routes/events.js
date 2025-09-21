const express = require('express');
const {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  registerForEvent,
  unregisterFromEvent,
  getMyEvents,
  getMyRegistrations,
  getEventParticipants,
  getEventStats
} = require('../controllers/eventController');
const {
  validateCreateEvent,
  validateUpdateEvent,
  validateEventQuery
} = require('../middleware/validation');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Public routes (with optional authentication)
router.get('/', optionalAuth, validateEventQuery, getAllEvents);
router.get('/:id', optionalAuth, getEventById);

// Protected routes (require authentication)
router.use(authenticateToken); // All routes below require authentication

// Event management
router.post('/', validateCreateEvent, createEvent);
router.put('/:id', validateUpdateEvent, updateEvent);
router.delete('/:id', deleteEvent);

// Event registration
router.post('/:id/register', registerForEvent);
router.delete('/:id/register', unregisterFromEvent);

// User's events and registrations
router.get('/my/organized', getMyEvents);
router.get('/my/registrations', getMyRegistrations);

// Event participants and statistics (organizer only)
router.get('/:id/participants', getEventParticipants);
router.get('/:id/stats', getEventStats);

module.exports = router;

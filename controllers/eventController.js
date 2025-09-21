const { eventStore } = require('../models/Event');
const { userStore } = require('../models/User');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { sendEventRegistrationEmail, sendEventUpdateEmail } = require('../utils/emailService');

// Create a new event (organizers only)
const createEvent = asyncHandler(async (req, res) => {
  if (req.user.role !== 'organizer') {
    throw new AppError('Only organizers can create events', 403);
  }

  const eventData = req.body;
  const organizerId = req.user.id;

  try {
    const event = eventStore.create(eventData, organizerId);

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: {
        event: event.toJSON()
      }
    });
  } catch (error) {
    throw error;
  }
});

// Get all events (with filtering)
const getAllEvents = asyncHandler(async (req, res) => {
  const {
    category,
    status,
    isPublic,
    startDate,
    endDate,
    page = 1,
    limit = 10
  } = req.query;

  // Build filters
  const filters = {};
  if (category) filters.category = category;
  if (status) filters.status = status;
  if (isPublic !== undefined) filters.isPublic = isPublic === 'true';
  if (startDate) filters.startDate = startDate;
  if (endDate) filters.endDate = endDate;

  // Get filtered events
  let events = eventStore.findWithFilters(filters);

  // If user is not authenticated or not an organizer, only show public events
  if (!req.user || req.user.role !== 'organizer') {
    events = events.filter(event => event.isPublic);
  }

  // Pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedEvents = events.slice(startIndex, endIndex);

  res.status(200).json({
    success: true,
    message: 'Events retrieved successfully',
    data: {
      events: paginatedEvents.map(event => event.toJSON()),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(events.length / limit),
        totalEvents: events.length,
        hasNextPage: endIndex < events.length,
        hasPrevPage: page > 1
      }
    }
  });
});

// Get event by ID
const getEventById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const event = eventStore.findById(id);

  if (!event) {
    throw new AppError('Event not found', 404);
  }

  // Check if user can view this event
  if (!event.isPublic && (!req.user || (req.user.id !== event.organizerId && req.user.role !== 'organizer'))) {
    throw new AppError('Access denied to this private event', 403);
  }

  // Return detailed event info for organizers
  const eventData = req.user && req.user.id === event.organizerId 
    ? event.toJSONWithParticipants() 
    : event.toJSON();

  res.status(200).json({
    success: true,
    message: 'Event retrieved successfully',
    data: {
      event: eventData
    }
  });
});

// Update event (organizer only)
const updateEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  const userId = req.user.id;

  try {
    const updatedEvent = eventStore.update(id, updateData, userId);

    // Send update notifications to participants (async)
    if (updatedEvent.participants.length > 0) {
      updatedEvent.participants.forEach(participantId => {
        const participant = userStore.findById(participantId);
        if (participant) {
          sendEventUpdateEmail(participant.email, participant.firstName, updatedEvent)
            .catch(error => {
              console.error('Failed to send event update email:', error);
            });
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: {
        event: updatedEvent.toJSON()
      }
    });
  } catch (error) {
    if (error.message === 'Event not found') {
      throw new AppError('Event not found', 404);
    }
    if (error.message.includes('Unauthorized')) {
      throw new AppError('Only the event organizer can update this event', 403);
    }
    throw error;
  }
});

// Delete event (organizer only)
const deleteEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    eventStore.delete(id, userId);

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    if (error.message === 'Event not found') {
      throw new AppError('Event not found', 404);
    }
    if (error.message.includes('Unauthorized')) {
      throw new AppError('Only the event organizer can delete this event', 403);
    }
    throw error;
  }
});

// Register for an event
const registerForEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const event = eventStore.registerParticipant(id, userId);
    const user = req.user;

    // Send registration confirmation email (async)
    sendEventRegistrationEmail(user.email, user.firstName, event)
      .catch(error => {
        console.error('Failed to send registration email:', error);
        // Don't fail the registration if email fails
      });

    res.status(200).json({
      success: true,
      message: 'Successfully registered for the event',
      data: {
        event: event.toJSONWithUsers(),
        registrationDate: new Date()
      }
    });
  } catch (error) {
    if (error.message === 'Event not found') {
      throw new AppError('Event not found', 404);
    }
    if (error.message === 'Event is full') {
      throw new AppError('Event is full', 409);
    }
    if (error.message === 'User is already registered for this event') {
      throw new AppError('You are already registered for this event', 409);
    }
    throw error;
  }
});

// Unregister from an event
const unregisterFromEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const event = eventStore.unregisterParticipant(id, userId);

    res.status(200).json({
      success: true,
      message: 'Successfully unregistered from the event',
      data: {
        event: event.toJSONWithUsers()
      }
    });
  } catch (error) {
    if (error.message === 'Event not found') {
      throw new AppError('Event not found', 404);
    }
    if (error.message === 'User is not registered for this event') {
      throw new AppError('You are not registered for this event', 409);
    }
    throw error;
  }
});

// Get events organized by current user
const getMyEvents = asyncHandler(async (req, res) => {
  if (req.user.role !== 'organizer') {
    throw new AppError('Only organizers can view their events', 403);
  }

  const organizerId = req.user.id;
  const events = eventStore.findByOrganizer(organizerId);

  res.status(200).json({
    success: true,
    message: 'Your events retrieved successfully',
    data: {
      events: events.map(event => event.toJSONWithParticipants()),
      total: events.length
    }
  });
});

// Get events user is registered for
const getMyRegistrations = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const events = eventStore.findByParticipant(userId);

  res.status(200).json({
    success: true,
    message: 'Your registrations retrieved successfully',
    data: {
      events: events.map(event => event.toJSONWithUsers()),
      total: events.length
    }
  });
});

// Get event participants (organizer only)
const getEventParticipants = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const event = eventStore.findById(id);

  if (!event) {
    throw new AppError('Event not found', 404);
  }

  // Check if user is the organizer
  if (req.user.id !== event.organizerId) {
    throw new AppError('Only the event organizer can view participants', 403);
  }

  // Get participant details
  const participants = event.participants.map(participantId => {
    const user = userStore.findById(participantId);
    return user ? {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      registeredAt: user.createdAt // This would be registration date in a real system
    } : null;
  }).filter(Boolean);

  res.status(200).json({
    success: true,
    message: 'Event participants retrieved successfully',
    data: {
      event: {
        id: event.id,
        title: event.title,
        date: event.date,
        participantCount: event.getParticipantCount(),
        maxParticipants: event.maxParticipants
      },
      participants,
      total: participants.length
    }
  });
});

// Get event statistics
const getEventStats = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const event = eventStore.findById(id);

  if (!event) {
    throw new AppError('Event not found', 404);
  }

  // Check if user is the organizer
  if (req.user.id !== event.organizerId) {
    throw new AppError('Only the event organizer can view event statistics', 403);
  }

  const stats = {
    eventId: event.id,
    title: event.title,
    totalRegistrations: event.getParticipantCount(),
    maxParticipants: event.maxParticipants,
    availableSpots: event.getAvailableSpots(),
    registrationRate: event.maxParticipants 
      ? ((event.getParticipantCount() / event.maxParticipants) * 100).toFixed(2) + '%'
      : 'Unlimited',
    status: event.status,
    daysUntilEvent: Math.ceil((event.date - new Date()) / (1000 * 60 * 60 * 24)),
    createdAt: event.createdAt,
    lastUpdated: event.updatedAt
  };

  res.status(200).json({
    success: true,
    message: 'Event statistics retrieved successfully',
    data: stats
  });
});

module.exports = {
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
};

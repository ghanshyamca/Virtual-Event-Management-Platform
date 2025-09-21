const request = require('supertest');
const app = require('../server');
const { userStore } = require('../models/User');
const { eventStore } = require('../models/Event');

describe('Event Endpoints', () => {
  let organizerToken, attendeeToken;
  let organizerId, attendeeId;

  beforeEach(async () => {
    // Clear stores before each test
    userStore.clear();
    eventStore.clear();

    // Create organizer user
    const organizerData = {
      email: 'organizer@example.com',
      password: 'Test123!@#',
      confirmPassword: 'Test123!@#',
      firstName: 'Event',
      lastName: 'Organizer',
      role: 'organizer'
    };

    const organizerResponse = await request(app)
      .post('/users/register')
      .send(organizerData);

    if (!organizerResponse.body.data) {
      console.error('Organizer registration failed:', organizerResponse.body);
      throw new Error('Failed to register organizer in test setup');
    }

    organizerId = organizerResponse.body.data.user.id;

    // Log in to get token
    const organizerLoginResponse = await request(app)
      .post('/users/login')
      .send({
        email: organizerData.email,
        password: organizerData.password
      });

    organizerToken = organizerLoginResponse.body.data.token;

    // Create attendee user
    const attendeeData = {
      email: 'attendee@example.com',
      password: 'Test123!@#',
      confirmPassword: 'Test123!@#',
      firstName: 'Event',
      lastName: 'Attendee',
      role: 'attendee'
    };

    const attendeeResponse = await request(app)
      .post('/users/register')
      .send(attendeeData);

    if (!attendeeResponse.body.data) {
      console.error('Attendee registration failed:', attendeeResponse.body);
      throw new Error('Failed to register attendee in test setup');
    }

    attendeeId = attendeeResponse.body.data.user.id;

    // Log in to get token
    const attendeeLoginResponse = await request(app)
      .post('/users/login')
      .send({
        email: attendeeData.email,
        password: attendeeData.password
      });

    attendeeToken = attendeeLoginResponse.body.data.token;
  });

  describe('POST /events', () => {
    const validEventData = {
      title: 'Test Event',
      description: 'This is a test event for our platform',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      time: '14:30',
      duration: 90,
      maxParticipants: 50,
      category: 'technology',
      isPublic: true,
      meetingLink: 'https://zoom.us/j/123456789'
    };

    it('should create event successfully as organizer', async () => {
      const response = await request(app)
        .post('/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send(validEventData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Event created successfully');
      expect(response.body.data.event).toHaveProperty('id');
      expect(response.body.data.event.title).toBe(validEventData.title);
      expect(response.body.data.event.organizerId).toBe(organizerId);
    });

    it('should fail to create event as attendee', async () => {
      const response = await request(app)
        .post('/events')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .send(validEventData)
        .expect(403);

      expect(response.body.error).toBe('Only organizers can create events');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/events')
        .send(validEventData)
        .expect(401);

      expect(response.body.error).toBe('Access denied');
    });

    it('should fail with invalid event data', async () => {
      const invalidData = { ...validEventData, title: 'A' }; // Too short title

      const response = await request(app)
        .post('/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should fail with past date', async () => {
      const invalidData = { 
        ...validEventData, 
        date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Yesterday
      };

      const response = await request(app)
        .post('/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('GET /events', () => {
    beforeEach(async () => {
      // Create some test events
      const eventData1 = {
        title: 'Public Tech Event',
        description: 'A public technology event',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        time: '14:30',
        category: 'technology',
        isPublic: true
      };

      const eventData2 = {
        title: 'Private Business Event',
        description: 'A private business event',
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        time: '10:00',
        category: 'business',
        isPublic: false
      };

      await request(app)
        .post('/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send(eventData1);

      await request(app)
        .post('/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send(eventData2);
    });

    it('should get all public events without authentication', async () => {
      const response = await request(app)
        .get('/events')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.events).toHaveLength(1); // Only public events
      expect(response.body.data.events[0].title).toBe('Public Tech Event');
    });

    it('should get all events as organizer', async () => {
      const response = await request(app)
        .get('/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.events).toHaveLength(2); // All events for organizer
    });

    it('should filter events by category', async () => {
      const response = await request(app)
        .get('/events?category=technology')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.events).toHaveLength(1);
      expect(response.body.data.events[0].category).toBe('technology');
    });

    it('should handle pagination', async () => {
      const response = await request(app)
        .get('/events?page=1&limit=1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.events).toHaveLength(1);
      expect(response.body.data.pagination.currentPage).toBe(1);
      expect(response.body.data.pagination.totalPages).toBe(1);
    });
  });

  describe('GET /events/:id', () => {
    let eventId;

    beforeEach(async () => {
      const eventData = {
        title: 'Test Event',
        description: 'This is a test event',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        time: '14:30',
        isPublic: true
      };

      const response = await request(app)
        .post('/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send(eventData);

      eventId = response.body.data.event.id;
    });

    it('should get event by ID', async () => {
      const response = await request(app)
        .get(`/events/${eventId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.event.id).toBe(eventId);
      expect(response.body.data.event.title).toBe('Test Event');
    });

    it('should return 404 for non-existent event', async () => {
      const response = await request(app)
        .get('/events/non-existent-id')
        .expect(404);

      expect(response.body.error).toBe('Event not found');
    });
  });

  describe('PUT /events/:id', () => {
    let eventId;

    beforeEach(async () => {
      const eventData = {
        title: 'Test Event',
        description: 'This is a test event',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        time: '14:30',
        isPublic: true
      };

      const response = await request(app)
        .post('/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send(eventData);

      eventId = response.body.data.event.id;
    });

    it('should update event as organizer', async () => {
      const updateData = {
        title: 'Updated Event Title',
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/events/${eventId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.event.title).toBe('Updated Event Title');
      expect(response.body.data.event.description).toBe('Updated description');
    });

    it('should fail to update event as non-organizer', async () => {
      const updateData = {
        title: 'Updated Event Title'
      };

      const response = await request(app)
        .put(`/events/${eventId}`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.error).toBe('Only the event organizer can update this event');
    });

    it('should fail with invalid update data', async () => {
      const updateData = {
        title: 'A' // Too short
      };

      const response = await request(app)
        .put(`/events/${eventId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('DELETE /events/:id', () => {
    let eventId;

    beforeEach(async () => {
      const eventData = {
        title: 'Test Event',
        description: 'This is a test event',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        time: '14:30',
        isPublic: true
      };

      const response = await request(app)
        .post('/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send(eventData);

      eventId = response.body.data.event.id;
    });

    it('should delete event as organizer', async () => {
      const response = await request(app)
        .delete(`/events/${eventId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Event deleted successfully');
    });

    it('should fail to delete event as non-organizer', async () => {
      const response = await request(app)
        .delete(`/events/${eventId}`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(403);

      expect(response.body.error).toBe('Only the event organizer can delete this event');
    });

    it('should return 404 for non-existent event', async () => {
      const response = await request(app)
        .delete('/events/non-existent-id')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(404);

      expect(response.body.error).toBe('Event not found');
    });
  });

  describe('POST /events/:id/register', () => {
    let eventId;

    beforeEach(async () => {
      const eventData = {
        title: 'Test Event',
        description: 'This is a test event',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        time: '14:30',
        maxParticipants: 2,
        isPublic: true
      };

      const response = await request(app)
        .post('/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send(eventData);

      eventId = response.body.data.event.id;
    });

    it('should register for event successfully', async () => {
      const response = await request(app)
        .post(`/events/${eventId}/register`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Successfully registered for the event');
      expect(response.body.data.event.participantCount).toBe(1);
    });

    it('should fail to register twice for same event', async () => {
      // First registration
      await request(app)
        .post(`/events/${eventId}/register`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(200);

      // Second registration attempt
      const response = await request(app)
        .post(`/events/${eventId}/register`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(409);

      expect(response.body.error).toBe('You are already registered for this event');
    });

    it('should fail when event is full', async () => {
      // Create another attendee
      const attendee2Data = {
        email: 'attendee2@example.com',
        password: 'Test123!@#',
        confirmPassword: 'Test123!@#',
        firstName: 'Second',
        lastName: 'Attendee',
        role: 'attendee'
      };

      const attendee2Response = await request(app)
        .post('/users/register')
        .send(attendee2Data);

      // Log in to get token
      const attendee2LoginResponse = await request(app)
        .post('/users/login')
        .send({
          email: attendee2Data.email,
          password: attendee2Data.password
        });

      const attendee2Token = attendee2LoginResponse.body.data.token;

      // Fill up the event (maxParticipants = 2)
      await request(app)
        .post(`/events/${eventId}/register`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(200);

      await request(app)
        .post(`/events/${eventId}/register`)
        .set('Authorization', `Bearer ${attendee2Token}`)
        .expect(200);

      // Create third attendee and try to register
      const attendee3Data = {
        email: 'attendee3@example.com',
        password: 'Test123!@#',
        confirmPassword: 'Test123!@#',
        firstName: 'Third',
        lastName: 'Attendee',
        role: 'attendee'
      };

      const attendee3Response = await request(app)
        .post('/users/register')
        .send(attendee3Data);

      // Log in to get token
      const attendee3LoginResponse = await request(app)
        .post('/users/login')
        .send({
          email: attendee3Data.email,
          password: attendee3Data.password
        });

      const attendee3Token = attendee3LoginResponse.body.data.token;

      const response = await request(app)
        .post(`/events/${eventId}/register`)
        .set('Authorization', `Bearer ${attendee3Token}`)
        .expect(409);

      expect(response.body.error).toBe('Event is full');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post(`/events/${eventId}/register`)
        .expect(401);

      expect(response.body.error).toBe('Access denied');
    });
  });

  describe('DELETE /events/:id/register', () => {
    let eventId;

    beforeEach(async () => {
      const eventData = {
        title: 'Test Event',
        description: 'This is a test event',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        time: '14:30',
        isPublic: true
      };

      const response = await request(app)
        .post('/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send(eventData);

      eventId = response.body.data.event.id;

      // Register for the event first
      await request(app)
        .post(`/events/${eventId}/register`)
        .set('Authorization', `Bearer ${attendeeToken}`);
    });

    it('should unregister from event successfully', async () => {
      const response = await request(app)
        .delete(`/events/${eventId}/register`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Successfully unregistered from the event');
      expect(response.body.data.event.participantCount).toBe(0);
    });

    it('should fail to unregister when not registered', async () => {
      // First unregister
      await request(app)
        .delete(`/events/${eventId}/register`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(200);

      // Try to unregister again
      const response = await request(app)
        .delete(`/events/${eventId}/register`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(409);

      expect(response.body.error).toBe('You are not registered for this event');
    });
  });

  describe('GET /events/my/organized', () => {
    beforeEach(async () => {
      const eventData = {
        title: 'My Organized Event',
        description: 'This is my organized event',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        time: '14:30',
        isPublic: true
      };

      await request(app)
        .post('/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send(eventData);
    });

    it('should get organized events as organizer', async () => {
      const response = await request(app)
        .get('/events/my/organized')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.events).toHaveLength(1);
      expect(response.body.data.events[0].title).toBe('My Organized Event');
    });

    it('should fail as attendee', async () => {
      const response = await request(app)
        .get('/events/my/organized')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(403);

      expect(response.body.error).toBe('Only organizers can view their events');
    });
  });

  describe('GET /events/my/registrations', () => {
    let eventId;

    beforeEach(async () => {
      const eventData = {
        title: 'Event I Registered For',
        description: 'This is an event I registered for',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        time: '14:30',
        isPublic: true
      };

      const response = await request(app)
        .post('/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send(eventData);

      eventId = response.body.data.event.id;

      // Register for the event
      await request(app)
        .post(`/events/${eventId}/register`)
        .set('Authorization', `Bearer ${attendeeToken}`);
    });

    it('should get registered events', async () => {
      const response = await request(app)
        .get('/events/my/registrations')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.events).toHaveLength(1);
      expect(response.body.data.events[0].title).toBe('Event I Registered For');
    });

    it('should return empty array when no registrations', async () => {
      // Create another attendee
      const newAttendeeData = {
        email: 'newattendee@example.com',
        password: 'Test123!@#',
        confirmPassword: 'Test123!@#',
        firstName: 'New',
        lastName: 'Attendee',
        role: 'attendee'
      };

      const newAttendeeResponse = await request(app)
        .post('/users/register')
        .send(newAttendeeData);

      // Log in to get token
      const newAttendeeLoginResponse = await request(app)
        .post('/users/login')
        .send({
          email: newAttendeeData.email,
          password: newAttendeeData.password
        });

      const newAttendeeToken = newAttendeeLoginResponse.body.data.token;

      const response = await request(app)
        .get('/events/my/registrations')
        .set('Authorization', `Bearer ${newAttendeeToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.events).toHaveLength(0);
    });
  });
});

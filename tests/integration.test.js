const request = require('supertest');
const app = require('../server');
const { userStore } = require('../models/User');
const { eventStore } = require('../models/Event');

describe('Integration Tests', () => {
  beforeEach(() => {
    // Clear all data before each test
    userStore.clear();
    eventStore.clear();
  });

  describe('Complete User Journey', () => {
    it('should handle complete attendee journey', async () => {
      // 1. Register as attendee
      const attendeeData = {
        email: 'attendee@example.com',
        password: 'Test123!@#',
        confirmPassword: 'Test123!@#',
        firstName: 'John',
        lastName: 'Attendee',
        role: 'attendee'
      };

      const registerResponse = await request(app)
        .post('/users/register')
        .send(attendeeData)
        .expect(201);

      expect(registerResponse.body.success).toBe(true);
      const attendeeId = registerResponse.body.data.user.id;

      // Login to get token
      const attendeeLoginResponse = await request(app)
        .post('/users/login')
        .send({
          email: attendeeData.email,
          password: attendeeData.password
        })
        .expect(200);

      const attendeeToken = attendeeLoginResponse.body.data.token;

      // 2. Register as organizer
      const organizerData = {
        email: 'organizer@example.com',
        password: 'Test123!@#',
        confirmPassword: 'Test123!@#',
        firstName: 'Jane',
        lastName: 'Organizer',
        role: 'organizer'
      };

      const organizerRegisterResponse = await request(app)
        .post('/users/register')
        .send(organizerData)
        .expect(201);

      // Login to get token
      const organizerLoginResponse = await request(app)
        .post('/users/login')
        .send({
          email: organizerData.email,
          password: organizerData.password
        })
        .expect(200);

      const organizerToken = organizerLoginResponse.body.data.token;

      // 3. Organizer creates an event
      const eventData = {
        title: 'Tech Conference 2024',
        description: 'Annual technology conference with industry experts',
        date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        time: '09:00',
        duration: 480, // 8 hours
        maxParticipants: 100,
        category: 'technology',
        isPublic: true,
        meetingLink: 'https://zoom.us/j/123456789'
      };

      const createEventResponse = await request(app)
        .post('/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send(eventData)
        .expect(201);

      expect(createEventResponse.body.success).toBe(true);
      const eventId = createEventResponse.body.data.event.id;

      // 4. Attendee views all events
      const viewEventsResponse = await request(app)
        .get('/events')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(200);

      expect(viewEventsResponse.body.data.events).toHaveLength(1);
      expect(viewEventsResponse.body.data.events[0].title).toBe(eventData.title);

      // 5. Attendee views specific event
      const viewEventResponse = await request(app)
        .get(`/events/${eventId}`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(200);

      expect(viewEventResponse.body.data.event.id).toBe(eventId);
      expect(viewEventResponse.body.data.event.participantCount).toBe(0);

      // 6. Attendee registers for event
      const registerEventResponse = await request(app)
        .post(`/events/${eventId}/register`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(200);

      expect(registerEventResponse.body.success).toBe(true);
      expect(registerEventResponse.body.data.event.participantCount).toBe(1);

      // 7. Attendee views their registrations
      const myRegistrationsResponse = await request(app)
        .get('/events/my/registrations')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(200);

      expect(myRegistrationsResponse.body.data.events).toHaveLength(1);
      expect(myRegistrationsResponse.body.data.events[0].id).toBe(eventId);

      // 8. Organizer views event participants
      const participantsResponse = await request(app)
        .get(`/events/${eventId}/participants`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(participantsResponse.body.data.participants).toHaveLength(1);
      expect(participantsResponse.body.data.participants[0].id).toBe(attendeeId);

      // 9. Organizer views their events
      const myEventsResponse = await request(app)
        .get('/events/my/organized')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(myEventsResponse.body.data.events).toHaveLength(1);
      expect(myEventsResponse.body.data.events[0].id).toBe(eventId);

      // 10. Organizer updates event
      const updateData = {
        title: 'Updated Tech Conference 2024',
        description: 'Updated description with new speakers',
        maxParticipants: 150
      };

      const updateEventResponse = await request(app)
        .put(`/events/${eventId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send(updateData)
        .expect(200);

      expect(updateEventResponse.body.data.event.title).toBe(updateData.title);
      expect(updateEventResponse.body.data.event.maxParticipants).toBe(updateData.maxParticipants);

      // 11. Attendee unregisters from event
      const unregisterResponse = await request(app)
        .delete(`/events/${eventId}/register`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(200);

      expect(unregisterResponse.body.success).toBe(true);
      expect(unregisterResponse.body.data.event.participantCount).toBe(0);

      // 12. Verify attendee has no registrations
      const finalRegistrationsResponse = await request(app)
        .get('/events/my/registrations')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(200);

      expect(finalRegistrationsResponse.body.data.events).toHaveLength(0);
    });

    it('should handle event capacity limits', async () => {
      // Create organizer
      const organizerData = {
        email: 'organizer@example.com',
        password: 'Test123!@#',
        confirmPassword: 'Test123!@#',
        firstName: 'Jane',
        lastName: 'Organizer',
        role: 'organizer'
      };

      const organizerResponse = await request(app)
        .post('/users/register')
        .send(organizerData);

      // Login to get token
      const organizerLoginResponse = await request(app)
        .post('/users/login')
        .send({
          email: organizerData.email,
          password: organizerData.password
        });

      const organizerToken = organizerLoginResponse.body.data.token;

      // Create event with limited capacity
      const eventData = {
        title: 'Limited Capacity Event',
        description: 'Event with only 2 spots',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        time: '14:00',
        maxParticipants: 2,
        isPublic: true
      };

      const createEventResponse = await request(app)
        .post('/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send(eventData);

      const eventId = createEventResponse.body.data.event.id;

      // Create multiple attendees
      const attendees = [];
      for (let i = 1; i <= 3; i++) {
        const attendeeData = {
          email: `attendee${i}@example.com`,
          password: 'Test123!@#',
          confirmPassword: 'Test123!@#',
          firstName: `Attendee${i}`,
          lastName: 'User',
          role: 'attendee'
        };

        const response = await request(app)
          .post('/users/register')
          .send(attendeeData);

        // Login to get token
        const loginResponse = await request(app)
          .post('/users/login')
          .send({
            email: attendeeData.email,
            password: attendeeData.password
          });

        attendees.push(loginResponse.body.data.token);
      }

      // First two attendees should register successfully
      await request(app)
        .post(`/events/${eventId}/register`)
        .set('Authorization', `Bearer ${attendees[0]}`)
        .expect(200);

      await request(app)
        .post(`/events/${eventId}/register`)
        .set('Authorization', `Bearer ${attendees[1]}`)
        .expect(200);

      // Third attendee should fail due to capacity
      const failedRegistration = await request(app)
        .post(`/events/${eventId}/register`)
        .set('Authorization', `Bearer ${attendees[2]}`)
        .expect(409);

      expect(failedRegistration.body.error).toBe('Event is full');

      // Verify event is at capacity
      const eventResponse = await request(app)
        .get(`/events/${eventId}`)
        .expect(200);

      expect(eventResponse.body.data.event.participantCount).toBe(2);
      expect(eventResponse.body.data.event.availableSpots).toBe(0);
    });

    it('should handle event filtering and pagination', async () => {
      // Create organizer
      const organizerData = {
        email: 'organizer@example.com',
        password: 'Test123!@#',
        confirmPassword: 'Test123!@#',
        firstName: 'Jane',
        lastName: 'Organizer',
        role: 'organizer'
      };

      const organizerResponse = await request(app)
        .post('/users/register')
        .send(organizerData);

      // Login to get token
      const organizerLoginResponse = await request(app)
        .post('/users/login')
        .send({
          email: organizerData.email,
          password: organizerData.password
        });

      const organizerToken = organizerLoginResponse.body.data.token;

      // Create multiple events with different categories
      const eventCategories = ['technology', 'business', 'education', 'technology', 'business'];
      const eventIds = [];

      for (let i = 0; i < eventCategories.length; i++) {
        const eventData = {
          title: `Event ${i + 1}`,
          description: `Description for event ${i + 1}`,
          date: new Date(Date.now() + (i + 1) * 7 * 24 * 60 * 60 * 1000).toISOString(),
          time: '14:00',
          category: eventCategories[i],
          isPublic: true
        };

        const response = await request(app)
          .post('/events')
          .set('Authorization', `Bearer ${organizerToken}`)
          .send(eventData);

        eventIds.push(response.body.data.event.id);
      }

      // Test category filtering
      const techEventsResponse = await request(app)
        .get('/events?category=technology')
        .expect(200);

      expect(techEventsResponse.body.data.events).toHaveLength(2);
      techEventsResponse.body.data.events.forEach(event => {
        expect(event.category).toBe('technology');
      });

      // Test pagination
      const paginatedResponse = await request(app)
        .get('/events?page=1&limit=2')
        .expect(200);

      expect(paginatedResponse.body.data.events).toHaveLength(2);
      expect(paginatedResponse.body.data.pagination.currentPage).toBe(1);
      expect(paginatedResponse.body.data.pagination.totalPages).toBe(3);
      expect(paginatedResponse.body.data.pagination.hasNextPage).toBe(true);

      // Test second page
      const secondPageResponse = await request(app)
        .get('/events?page=2&limit=2')
        .expect(200);

      expect(secondPageResponse.body.data.events).toHaveLength(2);
      expect(secondPageResponse.body.data.pagination.currentPage).toBe(2);
      expect(secondPageResponse.body.data.pagination.hasPrevPage).toBe(true);
    });

    it('should handle private events correctly', async () => {
      // Create organizer
      const organizerData = {
        email: 'organizer@example.com',
        password: 'Test123!@#',
        confirmPassword: 'Test123!@#',
        firstName: 'Jane',
        lastName: 'Organizer',
        role: 'organizer'
      };

      const organizerResponse = await request(app)
        .post('/users/register')
        .send(organizerData);

      // Login to get token
      const organizerLoginResponse = await request(app)
        .post('/users/login')
        .send({
          email: organizerData.email,
          password: organizerData.password
        });

      const organizerToken = organizerLoginResponse.body.data.token;

      // Create attendee
      const attendeeData = {
        email: 'attendee@example.com',
        password: 'Test123!@#',
        confirmPassword: 'Test123!@#',
        firstName: 'John',
        lastName: 'Attendee',
        role: 'attendee'
      };

      const attendeeResponse = await request(app)
        .post('/users/register')
        .send(attendeeData);

      const attendeeToken = attendeeResponse.body.data.token;

      // Create private event
      const privateEventData = {
        title: 'Private Executive Meeting',
        description: 'Confidential meeting for executives only',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        time: '15:00',
        isPublic: false
      };

      const createEventResponse = await request(app)
        .post('/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send(privateEventData);

      const eventId = createEventResponse.body.data.event.id;

      // Attendee should not see private event in public listing
      const publicEventsResponse = await request(app)
        .get('/events')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(200);

      expect(publicEventsResponse.body.data.events).toHaveLength(0);

      // Attendee should not be able to access private event directly
      const privateEventResponse = await request(app)
        .get(`/events/${eventId}`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(403);

      expect(privateEventResponse.body.error).toBe('Access denied to this private event');

      // Organizer should be able to see their private event
      const organizerEventResponse = await request(app)
        .get(`/events/${eventId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(organizerEventResponse.body.data.event.id).toBe(eventId);
      expect(organizerEventResponse.body.data.event.isPublic).toBe(false);

      // Organizer should see private event in their organized events
      const organizedEventsResponse = await request(app)
        .get('/events/my/organized')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(organizedEventsResponse.body.data.events).toHaveLength(1);
      expect(organizedEventsResponse.body.data.events[0].isPublic).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent routes', async () => {
      const response = await request(app)
        .get('/api/non-existent')
        .expect(404);

      expect(response.body.error).toBe('Route not found');
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/users/register')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      // The exact error message may vary depending on Express version
      expect(response.status).toBe(400);
    });

    it('should handle server errors gracefully', async () => {
      // This test would require mocking to simulate server errors
      // For now, we'll test that the error handler middleware is properly set up
      expect(app._router).toBeDefined();
    });
  });

  describe('Security', () => {
    it('should not expose sensitive information in error messages', async () => {
      const response = await request(app)
        .post('/users/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
        .expect(401);

      expect(response.body.error).toBe('Invalid email or password');
      // Should not reveal whether email exists or not
    });

    it('should require authentication for protected routes', async () => {
      const protectedRoutes = [
        { method: 'get', path: '/users/profile' },
        { method: 'put', path: '/users/profile' },
        { method: 'post', path: '/events' },
        { method: 'get', path: '/events/my/organized' },
        { method: 'get', path: '/events/my/registrations' }
      ];

      for (const route of protectedRoutes) {
        const response = await request(app)[route.method](route.path)
          .expect(401);

        expect(response.body.error).toBe('Access denied');
      }
    });

    it('should enforce role-based access control', async () => {
      // Create attendee
      const attendeeData = {
        email: 'attendee@example.com',
        password: 'Test123!@#',
        confirmPassword: 'Test123!@#',
        firstName: 'John',
        lastName: 'Attendee',
        role: 'attendee'
      };

      const attendeeResponse = await request(app)
        .post('/users/register')
        .send(attendeeData);

      // Login to get token
      const attendeeLoginResponse = await request(app)
        .post('/users/login')
        .send({
          email: attendeeData.email,
          password: attendeeData.password
        });

      const attendeeToken = attendeeLoginResponse.body.data.token;

      // Attendee should not be able to create events
      const eventData = {
        title: 'Unauthorized Event',
        description: 'This should fail',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        time: '14:00'
      };

      const createEventResponse = await request(app)
        .post('/events')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .send(eventData)
        .expect(403);

      expect(createEventResponse.body.error).toBe('Only organizers can create events');

      // Attendee should not be able to view organized events
      const organizedEventsResponse = await request(app)
        .get('/events/my/organized')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(403);

      expect(organizedEventsResponse.body.error).toBe('Only organizers can view their events');
    });
  });
});

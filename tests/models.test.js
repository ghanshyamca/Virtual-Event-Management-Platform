const { User, userStore } = require('../models/User');
const { Event, eventStore } = require('../models/Event');

describe('User Model', () => {
  beforeEach(() => {
    userStore.clear();
  });

  describe('User Class', () => {
    it('should create a user with default values', () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const user = new User(userData);

      expect(user.email).toBe(userData.email);
      expect(user.firstName).toBe(userData.firstName);
      expect(user.lastName).toBe(userData.lastName);
      expect(user.role).toBe('attendee'); // default role
      expect(user.isActive).toBe(true);
      expect(user.id).toBeDefined();
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a user with organizer role', () => {
      const userData = {
        email: 'organizer@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'organizer'
      };

      const user = new User(userData);
      expect(user.role).toBe('organizer');
    });

    it('should hash password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const user = new User(userData);
      const originalPassword = user.password;
      
      await user.hashPassword();
      
      expect(user.password).not.toBe(originalPassword);
      expect(user.password.length).toBeGreaterThan(50); // bcrypt hash length
    });

    it('should compare password correctly', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const user = new User(userData);
      await user.hashPassword();

      const isValid = await user.comparePassword('password123');
      const isInvalid = await user.comparePassword('wrongpassword');

      expect(isValid).toBe(true);
      expect(isInvalid).toBe(false);
    });

    it('should return user without password in toJSON', () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const user = new User(userData);
      const userJSON = user.toJSON();

      expect(userJSON).not.toHaveProperty('password');
      expect(userJSON.email).toBe(userData.email);
      expect(userJSON.firstName).toBe(userData.firstName);
    });

    it('should update user information', () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const user = new User(userData);
      const originalUpdatedAt = user.updatedAt;

      // Wait a bit to ensure different timestamp
      setTimeout(() => {
        user.update({
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com'
        });

        expect(user.firstName).toBe('Jane');
        expect(user.lastName).toBe('Smith');
        expect(user.email).toBe('jane@example.com');
        expect(user.updatedAt).not.toBe(originalUpdatedAt);
      }, 10);
    });
  });

  describe('UserStore', () => {
    it('should create a user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const user = await userStore.create(userData);

      expect(user).toBeInstanceOf(User);
      expect(user.email).toBe(userData.email.toLowerCase());
      expect(userStore.count()).toBe(1);
    });

    it('should throw error for duplicate email', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      await userStore.create(userData);

      await expect(userStore.create(userData)).rejects.toThrow('Email already exists');
    });

    it('should find user by ID', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const createdUser = await userStore.create(userData);
      const foundUser = userStore.findById(createdUser.id);

      expect(foundUser).toBe(createdUser);
    });

    it('should find user by email', async () => {
      const userData = {
        email: 'Test@Example.com', // Mixed case
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const createdUser = await userStore.create(userData);
      const foundUser = userStore.findByEmail('test@example.com'); // Lower case

      expect(foundUser).toBe(createdUser);
    });

    it('should update user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const user = await userStore.create(userData);
      const updatedUser = userStore.update(user.id, {
        firstName: 'Jane',
        email: 'jane@example.com'
      });

      expect(updatedUser.firstName).toBe('Jane');
      expect(updatedUser.email).toBe('jane@example.com');
    });

    it('should delete user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const user = await userStore.create(userData);
      const result = userStore.delete(user.id);

      expect(result).toBe(true);
      expect(userStore.findById(user.id)).toBeUndefined();
      expect(userStore.count()).toBe(0);
    });

    it('should find users by role', async () => {
      const attendeeData = {
        email: 'attendee@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Attendee',
        role: 'attendee'
      };

      const organizerData = {
        email: 'organizer@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Organizer',
        role: 'organizer'
      };

      await userStore.create(attendeeData);
      await userStore.create(organizerData);

      const attendees = userStore.findByRole('attendee');
      const organizers = userStore.findByRole('organizer');

      expect(attendees).toHaveLength(1);
      expect(organizers).toHaveLength(1);
      expect(attendees[0].role).toBe('attendee');
      expect(organizers[0].role).toBe('organizer');
    });
  });
});

describe('Event Model', () => {
  beforeEach(() => {
    eventStore.clear();
  });

  describe('Event Class', () => {
    const organizerId = 'organizer-123';
    const eventData = {
      title: 'Test Event',
      description: 'This is a test event',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      time: '14:30',
      duration: 90,
      maxParticipants: 50,
      category: 'technology',
      isPublic: true,
      meetingLink: 'https://zoom.us/j/123456789'
    };

    it('should create an event with provided data', () => {
      const event = new Event(eventData, organizerId);

      expect(event.title).toBe(eventData.title);
      expect(event.description).toBe(eventData.description);
      expect(event.organizerId).toBe(organizerId);
      expect(event.duration).toBe(eventData.duration);
      expect(event.maxParticipants).toBe(eventData.maxParticipants);
      expect(event.category).toBe(eventData.category);
      expect(event.isPublic).toBe(eventData.isPublic);
      expect(event.meetingLink).toBe(eventData.meetingLink);
      expect(event.status).toBe('scheduled');
      expect(event.participants).toBeInstanceOf(Array);
      expect(event.participants.length).toBe(0);
      expect(event.id).toBeDefined();
    });

    it('should create an event with default values', () => {
      const minimalData = {
        title: 'Minimal Event',
        description: 'Minimal description',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        time: '14:30'
      };

      const event = new Event(minimalData, organizerId);

      expect(event.duration).toBe(60); // default
      expect(event.maxParticipants).toBe(null); // default
      expect(event.category).toBe('general'); // default
      expect(event.isPublic).toBe(true); // default
      expect(event.status).toBe('scheduled'); // default
    });

    it('should add participant successfully', () => {
      const event = new Event(eventData, organizerId);
      const participantId = 'participant-123';

      const result = event.addParticipant(participantId);

      expect(result).toBe(true);
      expect(event.participants.includes(participantId)).toBe(true);
      expect(event.getParticipantCount()).toBe(1);
    });

    it('should not add duplicate participant', () => {
      const event = new Event(eventData, organizerId);
      const participantId = 'participant-123';

      event.addParticipant(participantId);

      expect(() => event.addParticipant(participantId))
        .toThrow('User is already registered for this event');
    });

    it('should not add participant when event is full', () => {
      const limitedEventData = { ...eventData, maxParticipants: 1 };
      const event = new Event(limitedEventData, organizerId);

      event.addParticipant('participant-1');

      expect(() => event.addParticipant('participant-2'))
        .toThrow('Event is full');
    });

    it('should remove participant successfully', () => {
      const event = new Event(eventData, organizerId);
      const participantId = 'participant-123';

      event.addParticipant(participantId);
      const result = event.removeParticipant(participantId);

      expect(result).toBe(true);
      expect(event.participants.includes(participantId)).toBe(false);
      expect(event.getParticipantCount()).toBe(0);
    });

    it('should not remove non-existent participant', () => {
      const event = new Event(eventData, organizerId);

      expect(() => event.removeParticipant('non-existent'))
        .toThrow('User is not registered for this event');
    });

    it('should check if user is registered', () => {
      const event = new Event(eventData, organizerId);
      const participantId = 'participant-123';

      expect(event.isUserRegistered(participantId)).toBe(false);

      event.addParticipant(participantId);
      expect(event.isUserRegistered(participantId)).toBe(true);
    });

    it('should calculate available spots correctly', () => {
      const limitedEventData = { ...eventData, maxParticipants: 3 };
      const event = new Event(limitedEventData, organizerId);

      expect(event.getAvailableSpots()).toBe(3);

      event.addParticipant('participant-1');
      expect(event.getAvailableSpots()).toBe(2);

      event.addParticipant('participant-2');
      expect(event.getAvailableSpots()).toBe(1);
    });

    it('should return null for unlimited events', () => {
      const unlimitedEventData = { ...eventData, maxParticipants: null };
      const event = new Event(unlimitedEventData, organizerId);

      expect(event.getAvailableSpots()).toBe(null);
    });

    it('should update event information', () => {
      const event = new Event(eventData, organizerId);
      const originalUpdatedAt = event.updatedAt;

      setTimeout(() => {
        event.update({
          title: 'Updated Title',
          description: 'Updated description',
          status: 'ongoing'
        });

        expect(event.title).toBe('Updated Title');
        expect(event.description).toBe('Updated description');
        expect(event.status).toBe('ongoing');
        expect(event.updatedAt).not.toBe(originalUpdatedAt);
      }, 10);
    });

    it('should check if event is past', () => {
      const pastEventData = {
        ...eventData,
        date: new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
      };
      const pastEvent = new Event(pastEventData, organizerId);

      const futureEvent = new Event(eventData, organizerId);

      expect(pastEvent.isPast()).toBe(true);
      expect(futureEvent.isPast()).toBe(false);
    });

    it('should check if event is upcoming', () => {
      const pastEventData = {
        ...eventData,
        date: new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
      };
      const pastEvent = new Event(pastEventData, organizerId);

      const futureEvent = new Event(eventData, organizerId);

      expect(pastEvent.isUpcoming()).toBe(false);
      expect(futureEvent.isUpcoming()).toBe(true);
    });
  });

  describe('EventStore', () => {
    const organizerId = 'organizer-123';
    const eventData = {
      title: 'Test Event',
      description: 'This is a test event',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      time: '14:30',
      category: 'technology',
      isPublic: true
    };

    it('should create an event successfully', () => {
      const event = eventStore.create(eventData, organizerId);

      expect(event).toBeInstanceOf(Event);
      expect(event.organizerId).toBe(organizerId);
      expect(eventStore.count()).toBe(1);
    });

    it('should find event by ID', () => {
      const event = eventStore.create(eventData, organizerId);
      const foundEvent = eventStore.findById(event.id);

      expect(foundEvent).toBe(event);
    });

    it('should find events by organizer', () => {
      const event1 = eventStore.create(eventData, organizerId);
      const event2 = eventStore.create({ ...eventData, title: 'Event 2' }, organizerId);
      const event3 = eventStore.create(eventData, 'other-organizer');

      const organizerEvents = eventStore.findByOrganizer(organizerId);

      expect(organizerEvents).toHaveLength(2);
      expect(organizerEvents).toContain(event1);
      expect(organizerEvents).toContain(event2);
      expect(organizerEvents).not.toContain(event3);
    });

    it('should find events by category', () => {
      const techEvent = eventStore.create({ ...eventData, category: 'technology' }, organizerId);
      const businessEvent = eventStore.create({ ...eventData, category: 'business' }, organizerId);

      const techEvents = eventStore.findByCategory('technology');
      const businessEvents = eventStore.findByCategory('business');

      expect(techEvents).toHaveLength(1);
      expect(techEvents).toContain(techEvent);
      expect(businessEvents).toHaveLength(1);
      expect(businessEvents).toContain(businessEvent);
    });

    it('should find all public events', () => {
      const publicEvent = eventStore.create({ ...eventData, isPublic: true }, organizerId);
      const privateEvent = eventStore.create({ ...eventData, isPublic: false }, organizerId);

      const publicEvents = eventStore.findAllPublic();

      expect(publicEvents).toHaveLength(1);
      expect(publicEvents).toContain(publicEvent);
      expect(publicEvents).not.toContain(privateEvent);
    });

    it('should update event successfully', () => {
      const event = eventStore.create(eventData, organizerId);
      const updatedEvent = eventStore.update(event.id, {
        title: 'Updated Title',
        category: 'business'
      }, organizerId);

      expect(updatedEvent.title).toBe('Updated Title');
      expect(updatedEvent.category).toBe('business');
    });

    it('should not allow non-organizer to update event', () => {
      const event = eventStore.create(eventData, organizerId);

      expect(() => eventStore.update(event.id, { title: 'Hacked' }, 'other-user'))
        .toThrow('Unauthorized: Only the event organizer can update this event');
    });

    it('should delete event successfully', () => {
      const event = eventStore.create(eventData, organizerId);
      const result = eventStore.delete(event.id, organizerId);

      expect(result).toBe(true);
      expect(eventStore.findById(event.id)).toBeUndefined();
      expect(eventStore.count()).toBe(0);
    });

    it('should not allow non-organizer to delete event', () => {
      const event = eventStore.create(eventData, organizerId);

      expect(() => eventStore.delete(event.id, 'other-user'))
        .toThrow('Unauthorized: Only the event organizer can delete this event');
    });

    it('should register participant successfully', () => {
      const event = eventStore.create(eventData, organizerId);
      const participantId = 'participant-123';

      const updatedEvent = eventStore.registerParticipant(event.id, participantId);

      expect(updatedEvent.isUserRegistered(participantId)).toBe(true);
      expect(updatedEvent.getParticipantCount()).toBe(1);
    });

    it('should unregister participant successfully', () => {
      const event = eventStore.create(eventData, organizerId);
      const participantId = 'participant-123';

      eventStore.registerParticipant(event.id, participantId);
      const updatedEvent = eventStore.unregisterParticipant(event.id, participantId);

      expect(updatedEvent.isUserRegistered(participantId)).toBe(false);
      expect(updatedEvent.getParticipantCount()).toBe(0);
    });

    it('should find events by participant', () => {
      const event1 = eventStore.create(eventData, organizerId);
      const event2 = eventStore.create({ ...eventData, title: 'Event 2' }, organizerId);
      const participantId = 'participant-123';

      eventStore.registerParticipant(event1.id, participantId);
      eventStore.registerParticipant(event2.id, participantId);

      const participantEvents = eventStore.findByParticipant(participantId);

      expect(participantEvents).toHaveLength(2);
      expect(participantEvents).toContain(event1);
      expect(participantEvents).toContain(event2);
    });

    it('should filter events with multiple criteria', () => {
      const event1 = eventStore.create({
        ...eventData,
        category: 'technology',
        status: 'scheduled',
        isPublic: true
      }, organizerId);

      const event2 = eventStore.create({
        ...eventData,
        title: 'Business Event',
        category: 'business',
        status: 'completed',
        isPublic: false
      }, organizerId);

      const filters = {
        category: 'technology',
        status: 'scheduled',
        isPublic: true
      };

      const filteredEvents = eventStore.findWithFilters(filters);

      expect(filteredEvents).toHaveLength(1);
      expect(filteredEvents).toContain(event1);
      expect(filteredEvents).not.toContain(event2);
    });
  });
});

const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const { STORAGE } = require('../config/constants');

class Event {
  constructor(eventData, organizerId) {
    this.id = uuidv4();
    this.title = eventData.title;
    this.description = eventData.description;
    this.date = new Date(eventData.date);
    this.time = eventData.time;
    this.duration = eventData.duration || 60; // Duration in minutes
    this.maxParticipants = eventData.maxParticipants || null;
    this.organizerId = organizerId;
    this.participants = []; // Array of user IDs
    this.status = eventData.status || 'scheduled'; // 'scheduled', 'ongoing', 'completed', 'cancelled'
    this.category = eventData.category || 'general';
    this.isPublic = eventData.isPublic !== undefined ? eventData.isPublic : true;
    this.meetingLink = eventData.meetingLink || null;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  // Add participant to event
  addParticipant(userId) {
    if (this.maxParticipants && this.participants.length >= this.maxParticipants) {
      throw new Error('Event is full');
    }
    
    if (this.participants.includes(userId)) {
      throw new Error('User is already registered for this event');
    }

    this.participants.push(userId);
    this.updatedAt = new Date();
    return true;
  }

  // Remove participant from event
  removeParticipant(userId) {
    const index = this.participants.indexOf(userId);
    if (index === -1) {
      throw new Error('User is not registered for this event');
    }

    this.participants.splice(index, 1);
    this.updatedAt = new Date();
    return true;
  }

  // Check if user is registered
  isUserRegistered(userId) {
    return this.participants.includes(userId);
  }

  // Get participant count
  getParticipantCount() {
    return this.participants.length;
  }

  // Get available spots
  getAvailableSpots() {
    if (!this.maxParticipants) return null;
    return this.maxParticipants - this.participants.length;
  }

  // Update event information
  update(updateData) {
    const allowedUpdates = [
      'title', 'description', 'date', 'time', 'duration', 
      'maxParticipants', 'status', 'category', 'isPublic', 'meetingLink'
    ];
    
    allowedUpdates.forEach(field => {
      if (updateData[field] !== undefined) {
        if (field === 'date') {
          this[field] = new Date(updateData[field]);
        } else {
          this[field] = updateData[field];
        }
      }
    });
    
    this.updatedAt = new Date();
  }

  // Check if event is in the past
  isPast() {
    return new Date() > this.date;
  }

  // Check if event is upcoming
  isUpcoming() {
    return new Date() < this.date;
  }

  // Get event with participant list (for organizers)
  toJSONWithParticipants() {
    return {
      ...this.toJSON(),
      participants: [...this.participants] // Copy the participants array
    };
  }

  toJSONWithUsers() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      date: this.date,
      time: this.time,
      duration: this.duration,
      maxParticipants: this.maxParticipants,
      participantCount: this.getParticipantCount(),
      availableSpots: this.getAvailableSpots(),
      status: this.status,
      category: this.category,
      isPublic: this.isPublic,
      meetingLink: this.meetingLink,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Get event without sensitive information
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      date: this.date,
      time: this.time,
      duration: this.duration,
      maxParticipants: this.maxParticipants,
      organizerId: this.organizerId,
      participants: this.participants, // Include participants array for persistence
      participantCount: this.getParticipantCount(),
      availableSpots: this.getAvailableSpots(),
      status: this.status,
      category: this.category,
      isPublic: this.isPublic,
      meetingLink: this.meetingLink,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

// In-memory storage for events using simple arrays with JSON persistence
class EventStore {
  constructor() {
    this.events = []; // Simple array to store events
    this.dataFile = path.join(__dirname, `../${STORAGE.DATA_DIR}/${STORAGE.EVENTS_FILE}`);
    this.ensureDataDirectory();
    this.loadFromFile();
  }

  // Ensure data directory exists
  ensureDataDirectory() {
    const dataDir = path.dirname(this.dataFile);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  // Load events from JSON file
  loadFromFile() {
    try {
      if (fs.existsSync(this.dataFile)) {
        const data = fs.readFileSync(this.dataFile, 'utf8');
        const eventsData = JSON.parse(data);
        
        // Recreate Event instances from JSON data
        this.events = eventsData.map(eventData => {
          const event = Object.create(Event.prototype);
          Object.assign(event, eventData);
          // Convert date string back to Date object
          event.date = new Date(event.date);
          event.createdAt = new Date(event.createdAt);
          event.updatedAt = new Date(event.updatedAt);
          // Ensure participants is an array
          event.participants = event.participants || [];
          return event;
        });
        
        if (process.env.NODE_ENV !== 'test') {
          console.log(`📁 Loaded ${this.events.length} events from ${this.dataFile}`);
        }
      }
    } catch (error) {
      console.error('❌ Error loading events from file:', error.message);
      this.events = []; // Start with empty array if file is corrupted
    }
  }

  // Save events to JSON file
  saveToFile() {
    try {
      const data = JSON.stringify(this.events, null, 2);
      fs.writeFileSync(this.dataFile, data, 'utf8');
      if (process.env.NODE_ENV !== 'test') {
        console.log(`💾 Saved ${this.events.length} events to ${this.dataFile}`);
      }
    } catch (error) {
      console.error('❌ Error saving events to file:', error.message);
    }
  }

  // Create a new event
  create(eventData, organizerId) {
    const event = new Event(eventData, organizerId);
    this.events.push(event);
    this.saveToFile(); // Save to JSON file
    return event;
  }

  // Find event by ID
  findById(id) {
    return this.events.find(event => event.id === id);
  }

  // Find events by organizer
  findByOrganizer(organizerId) {
    return this.events.filter(event => event.organizerId === organizerId);
  }

  // Find events by participant
  findByParticipant(participantId) {
    return this.events.filter(event => event.participants.includes(participantId));
  }

  // Find events by category
  findByCategory(category) {
    return this.events.filter(event => event.category === category);
  }

  // Get all public events
  findAllPublic() {
    return this.events.filter(event => event.isPublic);
  }

  // Get all events (admin function)
  findAll() {
    return [...this.events]; // Return a copy of the array
  }

  // Update event
  update(id, updateData, userId) {
    const event = this.events.find(event => event.id === id);
    if (!event) {
      throw new Error('Event not found');
    }

    // Check if user is the organizer
    if (event.organizerId !== userId) {
      throw new Error('Unauthorized: Only the event organizer can update this event');
    }

    event.update(updateData);
    this.saveToFile(); // Save to JSON file
    return event;
  }

  // Delete event
  delete(id, userId) {
    const eventIndex = this.events.findIndex(event => event.id === id);
    if (eventIndex === -1) {
      throw new Error('Event not found');
    }

    const event = this.events[eventIndex];

    // Check if user is the organizer
    if (event.organizerId !== userId) {
      throw new Error('Unauthorized: Only the event organizer can delete this event');
    }

    this.events.splice(eventIndex, 1);
    this.saveToFile(); // Save to JSON file
    return true;
  }

  // Register user for event
  registerParticipant(eventId, userId) {
    const event = this.events.find(event => event.id === eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    event.addParticipant(userId);
    this.saveToFile(); // Save to JSON file
    return event;
  }

  // Unregister user from event
  unregisterParticipant(eventId, userId) {
    const event = this.events.find(event => event.id === eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    event.removeParticipant(userId);
    this.saveToFile(); // Save to JSON file
    return event;
  }

  // Get event count
  count() {
    return this.events.length;
  }

  // Clear all events (for testing)
  clear() {
    this.events.length = 0; // Clear the array
    this.saveToFile(); // Save empty array to file
  }

  // Get events with filters
  findWithFilters(filters = {}) {
    let events = [...this.events]; // Copy the events array

    // Filter by public/private
    if (filters.isPublic !== undefined) {
      events = events.filter(event => event.isPublic === filters.isPublic);
    }

    // Filter by status
    if (filters.status) {
      events = events.filter(event => event.status === filters.status);
    }

    // Filter by category
    if (filters.category) {
      events = events.filter(event => event.category === filters.category);
    }

    // Filter by date range
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      events = events.filter(event => event.date >= startDate);
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      events = events.filter(event => event.date <= endDate);
    }

    // Sort by date
    events.sort((a, b) => a.date - b.date);

    return events;
  }
}

// Export singleton instance
const eventStore = new EventStore();

module.exports = {
  Event,
  EventStore,
  eventStore
};

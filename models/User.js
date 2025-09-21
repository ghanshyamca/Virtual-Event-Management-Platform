const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const { SECURITY, STORAGE } = require('../config/constants');

class User {
  constructor(userData) {
    this.id = uuidv4();
    this.email = userData.email;
    this.password = userData.password; // Will be hashed
    this.firstName = userData.firstName;
    this.lastName = userData.lastName;
    this.role = userData.role || 'attendee'; // 'organizer' or 'attendee'
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.isActive = true;
  }

  // Hash password before saving
  async hashPassword() {
    this.password = await bcrypt.hash(this.password, SECURITY.BCRYPT_SALT_ROUNDS);
  }

  // Compare password for login
  async comparePassword(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  }

  // Get user without password
  toJSON() {
    const { password, ...userWithoutPassword } = this;
    return userWithoutPassword;
  }

  // Update user information
  update(updateData) {
    const allowedUpdates = ['firstName', 'lastName', 'email'];
    allowedUpdates.forEach(field => {
      if (updateData[field] !== undefined) {
        this[field] = updateData[field];
      }
    });
    this.updatedAt = new Date();
  }
}

// In-memory storage for users using simple arrays with JSON persistence
class UserStore {
  constructor() {
    this.users = []; // Simple array to store users
    this.dataFile = path.join(__dirname, `../${STORAGE.DATA_DIR}/${STORAGE.USERS_FILE}`);
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

  // Load users from JSON file
  loadFromFile() {
    try {
      if (fs.existsSync(this.dataFile)) {
        const data = fs.readFileSync(this.dataFile, 'utf8');
        const usersData = JSON.parse(data);
        
        // Recreate User instances from JSON data
        this.users = usersData.map(userData => {
          const user = Object.create(User.prototype);
          Object.assign(user, userData);
          return user;
        });
        
        console.log(`📁 Loaded ${this.users.length} users from ${this.dataFile}`);
      }
    } catch (error) {
      console.error('❌ Error loading users from file:', error.message);
      this.users = []; // Start with empty array if file is corrupted
    }
  }

  // Save users to JSON file
  saveToFile() {
    try {
      const data = JSON.stringify(this.users, null, 2);
      console.log("data",data);
      fs.writeFileSync(this.dataFile, data, 'utf8');
      console.log(`💾 Saved ${this.users.length} users to ${this.dataFile}`);
    } catch (error) {
      console.error('❌ Error saving users to file:', error.message);
    }
  }

  // Create a new user
  async create(userData) {
    // Check if email already exists
    const existingUser = this.users.find(user => user.email.toLowerCase() === userData.email.toLowerCase());
    if (existingUser) {
      throw new Error('Email already exists');
    }

    const user = new User(userData);
    await user.hashPassword();
    console.log('user',user);
    this.users.push(user);
    this.saveToFile(); // Save to JSON file
    
    return user;
  }

  // Find user by ID
  findById(id) {
    return this.users.find(user => user.id === id);
  }

  // Find user by email
  findByEmail(email) {
    return this.users.find(user => user.email.toLowerCase() === email.toLowerCase());
  }

  // Update user
  update(id, updateData) {
    const user = this.users.find(user => user.id === id);
    if (!user) {
      throw new Error('User not found');
    }

    // If email is being updated, check for duplicates
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = this.users.find(u => u.email.toLowerCase() === updateData.email.toLowerCase());
      if (existingUser) {
        throw new Error('Email already exists');
      }
    }

    user.update(updateData);
    this.saveToFile(); // Save to JSON file
    return user;
  }

  // Delete user
  delete(id) {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    this.users.splice(userIndex, 1);
    this.saveToFile(); // Save to JSON file
    return true;
  }

  // Get all users (admin function)
  findAll() {
    return [...this.users]; // Return a copy of the array
  }

  // Get users by role
  findByRole(role) {
    return this.users.filter(user => user.role === role);
  }

  // Get user count
  count() {
    return this.users.length;
  }

  // Clear all users (for testing)
  clear() {
    this.users.length = 0; // Clear the array
    this.saveToFile(); // Save empty array to file
  }
}

// Export singleton instance
const userStore = new UserStore();

module.exports = {
  User,
  UserStore,
  userStore
};

const request = require('supertest');
const app = require('../server');
const { userStore } = require('../models/User');

describe('Authentication Endpoints', () => {
  beforeEach(() => {
    // Clear user store before each test
    userStore.clear();
  });

  describe('POST /users/register', () => {
    const validUserData = {
      email: 'test@example.com',
      password: 'Test123!@#',
      confirmPassword: 'Test123!@#',
      firstName: 'John',
      lastName: 'Doe',
      role: 'attendee'
    };

    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/users/register')
        .send(validUserData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user.email).toBe(validUserData.email.toLowerCase());
      expect(response.body.data.user.firstName).toBe(validUserData.firstName);
      expect(response.body.data.user.lastName).toBe(validUserData.lastName);
      expect(response.body.data.user.role).toBe(validUserData.role);
      expect(response.body.data.user).not.toHaveProperty('password');
      expect(response.body.data).not.toHaveProperty('token');
    });

    it('should register an organizer successfully', async () => {
      const organizerData = { ...validUserData, role: 'organizer' };
      
      const response = await request(app)
        .post('/users/register')
        .send(organizerData)
        .expect(201);

      expect(response.body.data.user.role).toBe('organizer');
    });

    it('should fail with invalid email', async () => {
      const invalidData = { ...validUserData, email: 'invalid-email' };
      
      const response = await request(app)
        .post('/users/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should fail with weak password', async () => {
      const invalidData = { ...validUserData, password: '123', confirmPassword: '123' };
      
      const response = await request(app)
        .post('/users/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should fail with password confirmation mismatch', async () => {
      const invalidData = { ...validUserData, confirmPassword: 'DifferentPass123!' };
      
      const response = await request(app)
        .post('/users/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should fail with missing required fields', async () => {
      const invalidData = { email: 'test@example.com' };
      
      const response = await request(app)
        .post('/users/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should fail with duplicate email', async () => {
      // Register first user
      await request(app)
        .post('/users/register')
        .send(validUserData)
        .expect(201);

      // Try to register with same email
      const response = await request(app)
        .post('/users/register')
        .send(validUserData)
        .expect(409);

      expect(response.body.error).toBe('Email already exists');
    });
  });

  describe('POST /users/login', () => {
    const userData = {
      email: 'test@example.com',
      password: 'Test123!@#',
      confirmPassword: 'Test123!@#',
      firstName: 'John',
      lastName: 'Doe',
      role: 'attendee'
    };

    beforeEach(async () => {
      // Register a user before each login test
      await request(app)
        .post('/users/register')
        .send(userData);
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/users/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data.user.email).toBe(userData.email.toLowerCase());
      expect(response.body.data).toHaveProperty('token');
    });

    it('should fail with invalid email', async () => {
      const response = await request(app)
        .post('/users/login')
        .send({
          email: 'wrong@example.com',
          password: userData.password
        })
        .expect(401);

      expect(response.body.error).toBe('Invalid email or password');
    });

    it('should fail with invalid password', async () => {
      const response = await request(app)
        .post('/users/login')
        .send({
          email: userData.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.error).toBe('Invalid email or password');
    });

    it('should fail with missing credentials', async () => {
      const response = await request(app)
        .post('/users/login')
        .send({
          email: userData.email
        })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('GET /users/profile', () => {
    let authToken;
    let userId;

    beforeEach(async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Test123!@#',
        confirmPassword: 'Test123!@#',
        firstName: 'John',
        lastName: 'Doe',
        role: 'attendee'
      };

      // Register the user first
      const registerResponse = await request(app)
        .post('/users/register')
        .send(userData);

      userId = registerResponse.body.data.user.id;

      // Then log them in to get the token
      const loginResponse = await request(app)
        .post('/users/login')
        .send({
          email: userData.email,
          password: userData.password
        });

      authToken = loginResponse.body.data.token;
    });

    it('should get user profile successfully', async () => {
      const response = await request(app)
        .get('/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(userId);
      expect(response.body.data.user.email).toBe('test@example.com');
    });

    it('should fail without authentication token', async () => {
      const response = await request(app)
        .get('/users/profile')
        .expect(401);

      expect(response.body.error).toBe('Access denied');
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/users/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error).toBe('Access denied');
    });
  });

  describe('PUT /users/profile', () => {
    let authToken;

    beforeEach(async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Test123!@#',
        confirmPassword: 'Test123!@#',
        firstName: 'John',
        lastName: 'Doe',
        role: 'attendee'
      };

      // Register the user first
      await request(app)
        .post('/users/register')
        .send(userData);

      // Then log them in to get the token
      const loginResponse = await request(app)
        .post('/users/login')
        .send({
          email: userData.email,
          password: userData.password
        });

      authToken = loginResponse.body.data.token;
    });

    it('should update profile successfully', async () => {
      const updateData = {
        firstName: 'Jane',
        lastName: 'Smith'
      };

      const response = await request(app)
        .put('/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.firstName).toBe('Jane');
      expect(response.body.data.user.lastName).toBe('Smith');
    });

    it('should fail with invalid email format', async () => {
      const updateData = {
        email: 'invalid-email'
      };

      const response = await request(app)
        .put('/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should fail without authentication', async () => {
      const updateData = {
        firstName: 'Jane'
      };

      const response = await request(app)
        .put('/users/profile')
        .send(updateData)
        .expect(401);

      expect(response.body.error).toBe('Access denied');
    });
  });

  describe('POST /users/logout', () => {
    let authToken;

    beforeEach(async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Test123!@#',
        confirmPassword: 'Test123!@#',
        firstName: 'John',
        lastName: 'Doe',
        role: 'attendee'
      };

      // Register the user first
      await request(app)
        .post('/users/register')
        .send(userData);

      // Then log them in to get the token
      const loginResponse = await request(app)
        .post('/users/login')
        .send({
          email: userData.email,
          password: userData.password
        });

      authToken = loginResponse.body.data.token;
    });

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/users/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Logout successful');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/users/logout')
        .expect(401);

      expect(response.body.error).toBe('Access denied');
    });
  });
});

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

  describe('PUT /users/change-password', () => {
    let authToken;
    let userData;

    beforeEach(async () => {
      userData = {
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

    it('should change password successfully', async () => {
      const passwordData = {
        currentPassword: 'Test123!@#',
        newPassword: 'NewPass123!@#',
        confirmNewPassword: 'NewPass123!@#'
      };

      const response = await request(app)
        .put('/users/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Password changed successfully');

      // Verify old password no longer works
      await request(app)
        .post('/users/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(401);

      // Verify new password works
      await request(app)
        .post('/users/login')
        .send({
          email: userData.email,
          password: passwordData.newPassword
        })
        .expect(200);
    });

    it('should fail with missing fields', async () => {
      const passwordData = {
        currentPassword: 'Test123!@#',
        newPassword: 'NewPass123!@#'
        // Missing confirmNewPassword
      };

      const response = await request(app)
        .put('/users/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should fail with password confirmation mismatch', async () => {
      const passwordData = {
        currentPassword: 'Test123!@#',
        newPassword: 'NewPass123!@#',
        confirmNewPassword: 'DifferentPass123!@#'
      };

      const response = await request(app)
        .put('/users/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should fail with weak new password', async () => {
      const passwordData = {
        currentPassword: 'Test123!@#',
        newPassword: '123',
        confirmNewPassword: '123'
      };

      const response = await request(app)
        .put('/users/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should fail with incorrect current password', async () => {
      const passwordData = {
        currentPassword: 'WrongPassword123!',
        newPassword: 'NewPass123!@#',
        confirmNewPassword: 'NewPass123!@#'
      };

      const response = await request(app)
        .put('/users/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(401);

      expect(response.body.error).toBe('Current password is incorrect');
    });

    it('should fail without authentication', async () => {
      const passwordData = {
        currentPassword: 'Test123!@#',
        newPassword: 'NewPass123!@#',
        confirmNewPassword: 'NewPass123!@#'
      };

      const response = await request(app)
        .put('/users/change-password')
        .send(passwordData)
        .expect(401);

      expect(response.body.error).toBe('Access denied');
    });
  });

  describe('PUT /users/profile - Edge Cases', () => {
    let authToken;
    let secondUserToken;

    beforeEach(async () => {
      const userData1 = {
        email: 'test1@example.com',
        password: 'Test123!@#',
        confirmPassword: 'Test123!@#',
        firstName: 'John',
        lastName: 'Doe',
        role: 'attendee'
      };

      const userData2 = {
        email: 'test2@example.com',
        password: 'Test123!@#',
        confirmPassword: 'Test123!@#',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'attendee'
      };

      // Register both users
      await request(app).post('/users/register').send(userData1);
      await request(app).post('/users/register').send(userData2);

      // Get tokens for both users
      const loginResponse1 = await request(app)
        .post('/users/login')
        .send({ email: userData1.email, password: userData1.password });
      authToken = loginResponse1.body.data.token;

      const loginResponse2 = await request(app)
        .post('/users/login')
        .send({ email: userData2.email, password: userData2.password });
      secondUserToken = loginResponse2.body.data.token;
    });

    it('should fail when updating email to existing email', async () => {
      const updateData = {
        email: 'test2@example.com' // Already exists
      };

      const response = await request(app)
        .put('/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(409);

      expect(response.body.error).toBe('Email already exists');
    });

    it('should update email to new unique email', async () => {
      const updateData = {
        email: 'newemail@example.com'
      };

      const response = await request(app)
        .put('/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('newemail@example.com');
    });

    it('should handle partial profile updates', async () => {
      const updateData = {
        firstName: 'UpdatedJohn'
      };

      const response = await request(app)
        .put('/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.firstName).toBe('UpdatedJohn');
      expect(response.body.data.user.lastName).toBe('Doe'); // Should remain unchanged
    });
  });

  describe('POST /users/login - Edge Cases', () => {
    let userData;

    beforeEach(async () => {
      userData = {
        email: 'test@example.com',
        password: 'Test123!@#',
        confirmPassword: 'Test123!@#',
        firstName: 'John',
        lastName: 'Doe',
        role: 'attendee'
      };

      // Register a user
      await request(app)
        .post('/users/register')
        .send(userData);
    });

    it('should fail when user account is deactivated', async () => {
      // First login to get a token
      const loginResponse = await request(app)
        .post('/users/login')
        .send({
          email: userData.email,
          password: userData.password
        });

      const authToken = loginResponse.body.data.token;

      // Deactivate the account
      await request(app)
        .delete('/users/deactivate')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Try to login with deactivated account
      const response = await request(app)
        .post('/users/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(401);

      expect(response.body.error).toBe('Account is deactivated');
    });

    // Note: Email trimming is handled by Joi validation middleware before reaching controller
  });

  describe('POST /users/register - Additional Edge Cases', () => {
    it('should handle registration with missing fields (controller-level validation)', async () => {
      // This bypasses Joi validation to test controller-level validation
      const invalidData = {
        email: 'test@example.com',
        password: 'Test123!@#'
        // Missing confirmPassword, firstName, lastName
      };

      const response = await request(app)
        .post('/users/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle password length validation (controller-level)', async () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'short',
        confirmPassword: 'short',
        firstName: 'John',
        lastName: 'Doe'
      };

      const response = await request(app)
        .post('/users/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle password confirmation mismatch (controller-level)', async () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'Test123!@#',
        confirmPassword: 'Different123!@#',
        firstName: 'John',
        lastName: 'Doe'
      };

      const response = await request(app)
        .post('/users/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    // Note: Email/name trimming is handled by Joi validation middleware before reaching controller
  });

  describe('DELETE /users/deactivate', () => {
    let authToken;
    let userData;

    beforeEach(async () => {
      userData = {
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

    it('should deactivate account successfully', async () => {
      const response = await request(app)
        .delete('/users/deactivate')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Account deactivated successfully');

      // Verify user cannot login after deactivation
      await request(app)
        .post('/users/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(401);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .delete('/users/deactivate')
        .expect(401);

      expect(response.body.error).toBe('Access denied');
    });
  });

  describe('GET /users/stats', () => {
    let authToken;
    let userId;

    beforeEach(async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Test123!@#',
        confirmPassword: 'Test123!@#',
        firstName: 'John',
        lastName: 'Doe',
        role: 'organizer'
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

    it('should get user stats successfully', async () => {
      const response = await request(app)
        .get('/users/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User statistics retrieved successfully');
      expect(response.body.data.userId).toBe(userId);
      expect(response.body.data.role).toBe('organizer');
      expect(response.body.data.isActive).toBe(true);
      expect(response.body.data).toHaveProperty('memberSince');
      expect(response.body.data).toHaveProperty('lastUpdated');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/users/stats')
        .expect(401);

      expect(response.body.error).toBe('Access denied');
    });
  });

  describe('GET /users/all', () => {
    let organizerToken;
    let attendeeToken;

    beforeEach(async () => {
      const organizerData = {
        email: 'organizer@example.com',
        password: 'Test123!@#',
        confirmPassword: 'Test123!@#',
        firstName: 'John',
        lastName: 'Organizer',
        role: 'organizer'
      };

      const attendeeData = {
        email: 'attendee@example.com',
        password: 'Test123!@#',
        confirmPassword: 'Test123!@#',
        firstName: 'Jane',
        lastName: 'Attendee',
        role: 'attendee'
      };

      // Register both users
      await request(app).post('/users/register').send(organizerData);
      await request(app).post('/users/register').send(attendeeData);

      // Get tokens
      const organizerLogin = await request(app)
        .post('/users/login')
        .send({ email: organizerData.email, password: organizerData.password });
      organizerToken = organizerLogin.body.data.token;

      const attendeeLogin = await request(app)
        .post('/users/login')
        .send({ email: attendeeData.email, password: attendeeData.password });
      attendeeToken = attendeeLogin.body.data.token;
    });

    it('should get all users as organizer', async () => {
      const response = await request(app)
        .get('/users/all')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Users retrieved successfully');
      expect(response.body.data.users).toHaveLength(2);
      expect(response.body.data.total).toBe(2);
      expect(response.body.data.users[0]).toHaveProperty('id');
      expect(response.body.data.users[0]).toHaveProperty('email');
      expect(response.body.data.users[0]).not.toHaveProperty('password');
    });

    it('should fail as attendee', async () => {
      const response = await request(app)
        .get('/users/all')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(403);

      expect(response.body.error).toBe('Access denied');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/users/all')
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

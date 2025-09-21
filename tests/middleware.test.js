const request = require('supertest');
const express = require('express');
const { authenticateToken, generateToken } = require('../middleware/auth');
const { validate, registerSchema } = require('../middleware/validation');
const { userStore } = require('../models/User');

describe('Middleware Tests', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    userStore.clear();
  });

  describe('Authentication Middleware', () => {
    let testUser;
    let validToken;

    beforeEach(async () => {
      // Create a test user
      testUser = await userStore.create({
        email: 'test@example.com',
        password: 'Test123!@#',
        firstName: 'Test',
        lastName: 'User',
        role: 'attendee'
      });

      validToken = generateToken(testUser);
    });

    it('should authenticate valid token', (done) => {
      app.get('/protected', authenticateToken, (req, res) => {
        res.json({ user: req.user.toJSON() });
      });

      request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.user.id).toBe(testUser.id);
          expect(res.body.user.email).toBe(testUser.email);
          done();
        });
    });

    it('should reject request without token', (done) => {
      app.get('/protected', authenticateToken, (req, res) => {
        res.json({ success: true });
      });

      request(app)
        .get('/protected')
        .expect(401)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.error).toBe('Access denied');
          expect(res.body.message).toBe('No token provided');
          done();
        });
    });

    it('should reject invalid token', (done) => {
      app.get('/protected', authenticateToken, (req, res) => {
        res.json({ success: true });
      });

      request(app)
        .get('/protected')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.error).toBe('Access denied');
          expect(res.body.message).toBe('Invalid token');
          done();
        });
    });

    it('should reject token for non-existent user', (done) => {
      // Delete the user but keep the token
      userStore.delete(testUser.id);

      app.get('/protected', authenticateToken, (req, res) => {
        res.json({ success: true });
      });

      request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(401)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.error).toBe('Access denied');
          expect(res.body.message).toBe('Invalid token');
          done();
        });
    });

    it('should reject token for inactive user', (done) => {
      // Deactivate the user
      testUser.isActive = false;

      app.get('/protected', authenticateToken, (req, res) => {
        res.json({ success: true });
      });

      request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(401)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.error).toBe('Access denied');
          expect(res.body.message).toBe('Invalid token');
          done();
        });
    });

    it('should handle malformed authorization header', (done) => {
      app.get('/protected', authenticateToken, (req, res) => {
        res.json({ success: true });
      });

      request(app)
        .get('/protected')
        .set('Authorization', 'InvalidFormat')
        .expect(401)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.error).toBe('Access denied');
          expect(res.body.message).toBe('No token provided');
          done();
        });
    });
  });

  describe('Validation Middleware', () => {
    it('should pass validation with valid data', (done) => {
      app.post('/users/register', validate(registerSchema), (req, res) => {
        res.json({ success: true });
      });

      const validData = {
        email: 'test@example.com',
        password: 'Test123!@#',
        confirmPassword: 'Test123!@#',
        firstName: 'John',
        lastName: 'Doe',
        role: 'attendee'
      };

      request(app)
        .post('/users/register')
        .send(validData)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.success).toBe(true);
          done();
        });
    });

    it('should fail validation with invalid email', (done) => {
      app.post('/users/register', validate(registerSchema), (req, res) => {
        res.json({ success: true });
      });

      const invalidData = {
        email: 'invalid-email',
        password: 'Test123!@#',
        firstName: 'John',
        lastName: 'Doe'
      };

      request(app)
        .post('/users/register')
        .send(invalidData)
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.error).toBe('Validation failed');
          expect(res.body.details).toBeInstanceOf(Array);
          expect(res.body.details.some(detail => detail.field === 'email')).toBe(true);
          done();
        });
    });

    it('should fail validation with weak password', (done) => {
      app.post('/users/register', validate(registerSchema), (req, res) => {
        res.json({ success: true });
      });

      const invalidData = {
        email: 'test@example.com',
        password: '123', // Too weak
        firstName: 'John',
        lastName: 'Doe'
      };

      request(app)
        .post('/users/register')
        .send(invalidData)
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.error).toBe('Validation failed');
          expect(res.body.details.some(detail => detail.field === 'password')).toBe(true);
          done();
        });
    });

    it('should fail validation with missing required fields', (done) => {
      app.post('/users/register', validate(registerSchema), (req, res) => {
        res.json({ success: true });
      });

      const invalidData = {
        email: 'test@example.com'
        // Missing password, firstName, lastName
      };

      request(app)
        .post('/users/register')
        .send(invalidData)
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.error).toBe('Validation failed');
          expect(res.body.details).toBeInstanceOf(Array);
          expect(res.body.details.length).toBeGreaterThan(1);
          done();
        });
    });

    it('should fail validation with invalid role', (done) => {
      app.post('/users/register', validate(registerSchema), (req, res) => {
        res.json({ success: true });
      });

      const invalidData = {
        email: 'test@example.com',
        password: 'Test123!@#',
        firstName: 'John',
        lastName: 'Doe',
        role: 'invalid-role'
      };

      request(app)
        .post('/users/register')
        .send(invalidData)
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.error).toBe('Validation failed');
          expect(res.body.details.some(detail => detail.field === 'role')).toBe(true);
          done();
        });
    });

    it('should set default role when not provided', (done) => {
      app.post('/users/register', validate(registerSchema), (req, res) => {
        res.json({ data: req.body });
      });

      const dataWithoutRole = {
        email: 'test@example.com',
        password: 'Test123!@#',
        confirmPassword: 'Test123!@#',
        firstName: 'John',
        lastName: 'Doe'
      };

      request(app)
        .post('/users/register')
        .send(dataWithoutRole)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.data.role).toBe('attendee');
          done();
        });
    });

    it('should validate string length constraints', (done) => {
      app.post('/users/register', validate(registerSchema), (req, res) => {
        res.json({ success: true });
      });

      const invalidData = {
        email: 'test@example.com',
        password: 'Test123!@#',
        firstName: 'A', // Too short
        lastName: 'B' // Too short
      };

      request(app)
        .post('/users/register')
        .send(invalidData)
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.error).toBe('Validation failed');
          expect(res.body.details.some(detail => detail.field === 'firstName')).toBe(true);
          expect(res.body.details.some(detail => detail.field === 'lastName')).toBe(true);
          done();
        });
    });

    it('should validate maximum string length', (done) => {
      app.post('/users/register', validate(registerSchema), (req, res) => {
        res.json({ success: true });
      });

      const invalidData = {
        email: 'test@example.com',
        password: 'Test123!@#',
        firstName: 'A'.repeat(51), // Too long
        lastName: 'B'.repeat(51) // Too long
      };

      request(app)
        .post('/users/register')
        .send(invalidData)
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.error).toBe('Validation failed');
          expect(res.body.details.some(detail => detail.field === 'firstName')).toBe(true);
          expect(res.body.details.some(detail => detail.field === 'lastName')).toBe(true);
          done();
        });
    });
  });

  describe('Token Generation and Verification', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await userStore.create({
        email: 'test@example.com',
        password: 'Test123!@#',
        firstName: 'Test',
        lastName: 'User',
        role: 'attendee'
      });
    });

    it('should generate valid JWT token', () => {
      const token = generateToken(testUser);
      
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts
    });

    it('should include user information in token payload', (done) => {
      const token = generateToken(testUser);
      
      app.get('/verify', authenticateToken, (req, res) => {
        res.json({ 
          userId: req.user.id,
          email: req.user.email,
          role: req.user.role
        });
      });

      request(app)
        .get('/verify')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.userId).toBe(testUser.id);
          expect(res.body.email).toBe(testUser.email);
          expect(res.body.role).toBe(testUser.role);
          done();
        });
    });

    it('should generate different tokens for different users', async () => {
      const user2 = await userStore.create({
        email: 'user2@example.com',
        password: 'Test123!@#',
        firstName: 'User',
        lastName: 'Two',
        role: 'organizer'
      });

      const token1 = generateToken(testUser);
      const token2 = generateToken(user2);

      expect(token1).not.toBe(token2);
    });
  });
});

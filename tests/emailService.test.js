// Unmock the email service for these tests to test actual functionality
jest.unmock('../utils/emailService');

const emailService = require('../utils/emailService');

describe('Email Service', () => {
  describe('Available Functions', () => {
    it('should send welcome email successfully', async () => {
      const result = await emailService.sendWelcomeEmail('test@example.com', 'John');
      
      expect(result).toHaveProperty('messageId');
      expect(typeof result.messageId).toBe('string');
      // In test mode, the service returns 'dev-' + timestamp format
      expect(result.messageId).toMatch(/^dev-\d+$/);
    });

    it('should send event registration email successfully', async () => {
      const eventDetails = {
        title: 'Test Event',
        date: new Date(),
        time: '14:30',
        description: 'Test event description'
      };
      
      const result = await emailService.sendEventRegistrationEmail('test@example.com', 'John', eventDetails);
      
      expect(result).toHaveProperty('messageId');
      expect(typeof result.messageId).toBe('string');
      expect(result.messageId).toMatch(/^dev-\d+$/);
    });

    it('should send event update email successfully', async () => {
      const eventDetails = {
        title: 'Updated Event',
        date: new Date(),
        time: '15:30',
        description: 'Updated event description'
      };
      
      const result = await emailService.sendEventUpdateEmail('test@example.com', 'John', eventDetails);
      
      expect(result).toHaveProperty('messageId');
      expect(typeof result.messageId).toBe('string');
      expect(result.messageId).toMatch(/^dev-\d+$/);
    });

    it('should test email configuration', async () => {
      const result = await emailService.testEmailConfig();
      
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('mode');
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.mode).toBe('string');
      expect(result.mode).toBe('development'); // In test mode, it should report development
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty first name', async () => {
      const result = await emailService.sendWelcomeEmail('test@example.com', '');
      expect(result).toHaveProperty('messageId');
      expect(result.messageId).toMatch(/^dev-\d+$/);
    });

    it('should handle undefined first name', async () => {
      const result = await emailService.sendWelcomeEmail('test@example.com', undefined);
      expect(result).toHaveProperty('messageId');
      expect(result.messageId).toMatch(/^dev-\d+$/);
    });

    it('should handle null first name', async () => {
      const result = await emailService.sendWelcomeEmail('test@example.com', null);
      expect(result).toHaveProperty('messageId');
      expect(result.messageId).toMatch(/^dev-\d+$/);
    });

    it('should handle empty event details', async () => {
      const result = await emailService.sendEventRegistrationEmail('test@example.com', 'John', {});
      expect(result).toHaveProperty('messageId');
      expect(result.messageId).toMatch(/^dev-\d+$/);
    });

    it('should handle missing event title', async () => {
      const eventDetails = {
        date: new Date(),
        time: '14:30'
      };
      const result = await emailService.sendEventRegistrationEmail('test@example.com', 'John', eventDetails);
      expect(result).toHaveProperty('messageId');
      expect(result.messageId).toMatch(/^dev-\d+$/);
    });

    it('should handle special characters in names', async () => {
      const result = await emailService.sendWelcomeEmail('test@example.com', 'José García-López');
      expect(result).toHaveProperty('messageId');
      expect(result.messageId).toMatch(/^dev-\d+$/);
    });

    it('should handle very long event titles', async () => {
      const eventDetails = {
        title: 'A'.repeat(200),
        date: new Date(),
        time: '14:30'
      };
      const result = await emailService.sendEventRegistrationEmail('test@example.com', 'John', eventDetails);
      expect(result).toHaveProperty('messageId');
      expect(result.messageId).toMatch(/^dev-\d+$/);
    });

    it('should handle different email formats', async () => {
      const emails = [
        'test@example.com',
        'user+tag@domain.co.uk',
        'very.long.email.address@sub.domain.example.org'
      ];
      
      for (const email of emails) {
        const result = await emailService.sendWelcomeEmail(email, 'Test User');
        expect(result).toHaveProperty('messageId');
        expect(result.messageId).toMatch(/^dev-\d+$/);
      }
    });
  });

  describe('Production Mode Error Handling', () => {
    beforeEach(() => {
      jest.resetModules();
      // Mock environment to force production mode
      process.env.NODE_ENV = 'production';
      process.env.EMAIL_HOST = 'smtp.test.com';
      process.env.EMAIL_USER = 'test@test.com';
      process.env.EMAIL_PASS = 'testpass';
    });

    afterEach(() => {
      process.env.NODE_ENV = 'test';
    });

    it('should handle transport creation and email errors', async () => {
      // Mock nodemailer to throw an error
      const nodemailer = require('nodemailer');
      nodemailer.createTransport = jest.fn(() => ({
        sendMail: jest.fn().mockRejectedValue(new Error('Transport error'))
      }));

      // Re-require the email service to get the new mocked version
      const emailServiceProd = require('../utils/emailService');

      await expect(emailServiceProd.sendWelcomeEmail('test@example.com', 'John'))
        .rejects.toThrow('Transport error');
    });

    it('should handle event registration email errors', async () => {
      const nodemailer = require('nodemailer');
      nodemailer.createTransport = jest.fn(() => ({
        sendMail: jest.fn().mockRejectedValue(new Error('SMTP error'))
      }));

      const emailServiceProd = require('../utils/emailService');

      await expect(emailServiceProd.sendEventRegistrationEmail('test@example.com', 'John', {
        title: 'Test Event',
        date: new Date(),
        time: '14:30'
      })).rejects.toThrow('SMTP error');
    });

    it('should handle event update email errors', async () => {
      const nodemailer = require('nodemailer');
      nodemailer.createTransport = jest.fn(() => ({
        sendMail: jest.fn().mockRejectedValue(new Error('Network error'))
      }));

      const emailServiceProd = require('../utils/emailService');

      await expect(emailServiceProd.sendEventUpdateEmail('test@example.com', 'John', {
        title: 'Updated Event',
        date: new Date(),
        time: '15:30'
      })).rejects.toThrow('Network error');
    });

    it('should test email config with production transporter', async () => {
      const nodemailer = require('nodemailer');
      nodemailer.createTransport = jest.fn(() => ({
        sendMail: jest.fn().mockResolvedValue({ messageId: 'prod-id' }),
        verify: jest.fn().mockResolvedValue(true)
      }));

      const emailServiceProd = require('../utils/emailService');
      const result = await emailServiceProd.testEmailConfig();
      
      expect(result.success).toBe(true);
      expect(result.mode).toBe('production');
    });

    it('should handle email config verification errors', async () => {
      const nodemailer = require('nodemailer');
      nodemailer.createTransport = jest.fn(() => ({
        sendMail: jest.fn().mockResolvedValue({ messageId: 'prod-id' }),
        verify: jest.fn().mockRejectedValue(new Error('Connection failed'))
      }));

      const emailServiceProd = require('../utils/emailService');
      const result = await emailServiceProd.testEmailConfig();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Connection failed');
    });
  });
});

// Test setup file
// This file runs before each test file

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.JWT_EXPIRES_IN = '1h';

// Suppress console.log during tests (optional)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };

// Global test timeout
jest.setTimeout(10000);

// Mock email service for tests
jest.mock('../utils/emailService', () => ({
  sendWelcomeEmail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  sendEventRegistrationEmail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  sendEventUpdateEmail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  testEmailConfig: jest.fn().mockResolvedValue({ success: true, mode: 'test' })
}));

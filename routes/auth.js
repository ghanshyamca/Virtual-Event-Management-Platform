const express = require('express');
const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  logout,
  getUserStats,
  deactivateAccount,
  getAllUsers
} = require('../controllers/authController');
const {
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validateChangePassword
} = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);

// Protected routes (require authentication)
router.use(authenticateToken); // All routes below require authentication

router.get('/profile', getProfile);
router.put('/profile', validateUpdateProfile, updateProfile);
router.put('/change-password', validateChangePassword, changePassword);
router.post('/logout', logout);
router.get('/stats', getUserStats);
router.delete('/deactivate', deactivateAccount);

// Admin/Organizer routes
router.get('/users', getAllUsers);

module.exports = router;

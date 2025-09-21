const { userStore } = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { sendWelcomeEmail } = require('../utils/emailService');
const { MESSAGES, HTTP_STATUS } = require('../config/constants');

// Register a new user
const register = asyncHandler(async (req, res) => {
  const { email, password, confirmPassword, firstName, lastName, role } = req.body;

  try {
    // Validate input data
    if (!email || !password || !confirmPassword || !firstName || !lastName) {
      throw new AppError('All fields are required', HTTP_STATUS.BAD_REQUEST);
    }

    // Check password confirmation (additional validation beyond Joi)
    if (password !== confirmPassword) {
      throw new AppError('Password confirmation does not match password', HTTP_STATUS.BAD_REQUEST);
    }

    // Check password strength (additional validation beyond Joi)
    if (password.length < 8) {
      throw new AppError('Password must be at least 8 characters long', HTTP_STATUS.BAD_REQUEST);
    }

    // Create new user
    const user = await userStore.create({
      email: email.toLowerCase().trim(),
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role: role || 'attendee'
    });

    // Send welcome email asynchronously
    sendWelcomeEmail(user.email, user.firstName)
      .catch(error => {
        console.error('Failed to send welcome email:', error);
        // Don't fail the registration if email fails
      });

    // Return success response without token
    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: MESSAGES.SUCCESS.USER_REGISTERED,
      data: {
        user: user.toJSON()
      }
    });
  } catch (error) {
    if (error.message === 'Email already exists') {
      throw new AppError(MESSAGES.ERROR.EMAIL_EXISTS, HTTP_STATUS.CONFLICT);
    }
    throw error;
  }
});

// Login user
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user by email
  const user = userStore.findByEmail(email.toLowerCase().trim());
  if (!user) {
    throw new AppError(MESSAGES.ERROR.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);
  }

  // Check if user is active
  if (!user.isActive) {
    throw new AppError('Account is deactivated', HTTP_STATUS.UNAUTHORIZED);
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new AppError(MESSAGES.ERROR.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);
  }

  // Generate JWT token
  const token = generateToken(user);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: MESSAGES.SUCCESS.LOGIN_SUCCESSFUL,
    data: {
      user: user.toJSON(),
      token
    }
  });
});

// Get current user profile
const getProfile = asyncHandler(async (req, res) => {
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Profile retrieved successfully',
    data: {
      user: req.user.toJSON()
    }
  });
});

// Update user profile
const updateProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName, email } = req.body;
  const userId = req.user.id;

  try {
    const updatedUser = userStore.update(userId, {
      ...(firstName && { firstName: firstName.trim() }),
      ...(lastName && { lastName: lastName.trim() }),
      ...(email && { email: email.toLowerCase().trim() })
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: MESSAGES.SUCCESS.PROFILE_UPDATED,
      data: {
        user: updatedUser.toJSON()
      }
    });
  } catch (error) {
    if (error.message === 'Email already exists') {
      throw new AppError(MESSAGES.ERROR.EMAIL_EXISTS, HTTP_STATUS.CONFLICT);
    }
    if (error.message === 'User not found') {
      throw new AppError(MESSAGES.ERROR.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }
    throw error;
  }
});

// Change user password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;
  const userId = req.user.id;

  try {
    // Validate input
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      throw new AppError('Current password, new password, and password confirmation are required', HTTP_STATUS.BAD_REQUEST);
    }

    // Check password confirmation
    if (newPassword !== confirmNewPassword) {
      throw new AppError('New password confirmation does not match new password', HTTP_STATUS.BAD_REQUEST);
    }

    // Check new password strength
    if (newPassword.length < 8) {
      throw new AppError('New password must be at least 8 characters long', HTTP_STATUS.BAD_REQUEST);
    }

    // Get user
    const user = userStore.findById(userId);
    if (!user) {
      throw new AppError(MESSAGES.ERROR.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      throw new AppError('Current password is incorrect', HTTP_STATUS.UNAUTHORIZED);
    }

    // Update password
    user.password = newPassword;
    await user.hashPassword();
    user.updatedAt = new Date();

    // Save user changes
    userStore.saveToFile();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    throw error;
  }
});

// Logout user (client-side token removal)
const logout = asyncHandler(async (req, res) => {
  // In a stateless JWT system, logout is handled client-side
  // by removing the token from storage
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: MESSAGES.SUCCESS.LOGOUT_SUCCESSFUL
  });
});

// Get user statistics (for organizers)
const getUserStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  // This would typically involve querying events
  // For now, return basic user info
  const user = userStore.findById(userId);
  if (!user) {
    throw new AppError(MESSAGES.ERROR.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  const stats = {
    userId: user.id,
    role: user.role,
    memberSince: user.createdAt,
    lastUpdated: user.updatedAt,
    isActive: user.isActive
  };

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'User statistics retrieved successfully',
    data: stats
  });
});

// Deactivate user account
const deactivateAccount = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  try {
    const user = userStore.findById(userId);
    if (!user) {
      throw new AppError(MESSAGES.ERROR.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    // Update user status
    user.isActive = false;
    user.updatedAt = new Date();

    // Save user changes to file
    userStore.saveToFile();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Account deactivated successfully'
    });
  } catch (error) {
    throw error;
  }
});

// Admin: Get all users
const getAllUsers = asyncHandler(async (req, res) => {
  // This would typically be restricted to admin users
  // For now, allow organizers to see basic user list
  if (req.user.role !== 'organizer') {
    throw new AppError(MESSAGES.ERROR.ACCESS_DENIED, HTTP_STATUS.FORBIDDEN);
  }

  const users = userStore.findAll();
  const userList = users.map(user => ({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt
  }));

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Users retrieved successfully',
    data: {
      users: userList,
      total: userList.length
    }
  });
});

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  logout,
  getUserStats,
  deactivateAccount,
  getAllUsers
};

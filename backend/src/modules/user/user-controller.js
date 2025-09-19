// controllers/user.controller.js
import * as userService from '../user/user-service.js'; // Import all functions from user.service.js

// --- Function to fetch all users ---
export const getAllUsers = async (req, res) => {
  try {
    // Call the service layer for business logic
    const users = await userService.getAllUsers();
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error fetching users.', error: error.message });
  }
};

// --- Function to fetch the profile of the logged-in user ---
export const getMe = async (req, res) => {
  try {
    // req.user is populated by authenticateToken middleware (from auth.controller)
    // Pass user ID to service
    const user = await userService.getMe(req.user.id);
    res.status(200).json({
      message: 'User data retrieved successfully.',
      user: user, // User data from service
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(404).json({ message: error.message }); // Send specific error message from service
  }
};

// --- Function to update the profile of the logged-in user ---
export const updateMe = async (req, res) => {
  try {
    // req.user is populated by authenticateToken middleware
    const userId = req.user.id;
    const updates = {};
    const file = req.file;
    const currentProfilePicture = req.user.profilePicture; // Assuming profilePicture is in req.user from token

    // Destructure allowed fields from req.body
    const allowedFields = [
      'name', 'weight', 'height', 'gender', 'birthdate',
      'exerciseRoutine', 'exerciseFrequency', 'fitnessGoal', 'bodyGoal'
    ];
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Call the service layer for business logic
    const updatedUser = await userService.updateMe(userId, updates, file, currentProfilePicture);

    res.status(200).json({
      message: 'Profile updated successfully.',
      user: updatedUser, // Updated user data from service
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    // Specific error handling for Multer file filter error
    if (error.message === 'Only image files are allowed!') {
        return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error updating user profile.', error: error.message });
  }
};


// --- Function to get user's nutrition goals ---
export const getUserNutritionGoals = async (req, res) => {
  try {
    const userId = req.user.id; // Get user ID from authenticated token
    const nutritionGoals = await userService.calculateUserNutritionGoals(userId);
    res.status(200).json({
      message: 'User nutrition goals calculated successfully.',
      data: nutritionGoals
    });
  } catch (error) {
    console.error('Error in getUserNutritionGoals controller:', error);
    res.status(400).json({ message: error.message || 'Failed to calculate user nutrition goals.' });
  }
};
// services/user.service.js
import db from '../../models/index.js'; // Import db object (contains User model)
import path from 'path';
import fs from 'fs/promises'; // Use fs/promises for async file operations
import { differenceInYears } from 'date-fns';
const User = db.User;


/**
 * Fetches all users from the database.
 * @returns {Promise<Array<object>>} An array of user objects.
 */
export const getAllUsers = async () => {
  const users = await User.findAll({
    attributes: { exclude: ['password', 'verificationToken', 'passwordResetToken', 'passwordResetExpires'] }
  });
  return users;
};

/**
 * Fetches a single user's profile by ID.
 * @param {string} userId - The ID of the user to fetch.
 * @returns {Promise<object>} The user object.
 * @throws {Error} If user is not found.
 */
export const getMe = async (userId) => {
  const user = await User.findByPk(userId, {
    attributes: { exclude: ['password', 'verificationToken', 'passwordResetToken', 'passwordResetExpires'] }
  });
  if (!user) {
    throw new Error('User not found.');
  }
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    weight: user.weight,
    height: user.height,
    gender: user.gender,
    birthdate: user.birthdate,
    exerciseRoutine: user.exerciseRoutine,
    exerciseFrequency: user.exerciseFrequency,
    fitnessGoal: user.fitnessGoal,
    bodyGoal: user.bodyGoal,
    profilePicture: user.profilePicture,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

/**
 * Updates a user's profile.
 * @param {string} userId - The ID of the user to update.
 * @param {object} updates - An object containing fields to update.
 * @param {object} file - The uploaded file object from Multer (if any).
 * @param {string} currentProfilePicture - The current profile picture filename.
 * @returns {Promise<object>} The updated user object.
 * @throws {Error} If user not found, no valid fields provided, or file type is invalid.
 */
export const updateMe = async (userId, updates, file, currentProfilePicture) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('User not found for update.');
  }

  // --- Profile picture file handling ---
  if (file) {
    // Delete old profile picture if it exists and is not 'default.jpg'
    if (currentProfilePicture && currentProfilePicture !== 'default.jpg') {
      const oldProfilePath = path.join(process.cwd(), 'public', 'uploads', currentProfilePicture);
      try {
        await fs.access(oldProfilePath); // Check if file exists
        await fs.unlink(oldProfilePath); // Delete old file
        console.log(`Deleted old profile picture: ${oldProfilePath}`);
      } catch (err) {
        if (err.code === 'ENOENT') {
          console.warn(`Old profile picture not found, skipping deletion: ${oldProfilePath}`);
        } else {
          console.error(`Error deleting old profile picture: ${oldProfilePath}`, err);
        }
      }
    }
    updates.profilePicture = file.filename; // Save new filename from Multer
  }

  // Check if there's anything to update
  if (Object.keys(updates).length === 0 && !file) {
    throw new Error('No valid fields or file provided for update.');
  }

  await user.update(updates);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    weight: user.weight,
    height: user.height,
    gender: user.gender,
    birthdate: user.birthdate,
    exerciseRoutine: user.exerciseRoutine,
    exerciseFrequency: user.exerciseFrequency,
    fitnessGoal: user.fitnessGoal,
    bodyGoal: user.bodyGoal,
    profilePicture: user.profilePicture,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

export const calculateUserNutritionGoals = async (userId) => {
  const user = await User.findByPk(userId, {
    attributes: ['weight', 'height', 'gender', 'birthdate', 'exerciseFrequency', 'bodyGoal']
  });

  if (!user) {
    throw new Error('User not found.');
  }

  const { weight, height, gender, birthdate, exerciseFrequency, bodyGoal } = user;

  // Ensure all necessary data is available
  if (weight === null || height === null || gender === null || birthdate === null || exerciseFrequency === null) {
    throw new Error('Missing essential user data for nutrition goal calculation (weight, height, gender, birthdate, or activity level).');
  }

  // 1. Calculate Age
  const age = differenceInYears(new Date(), new Date(birthdate));

  // 2. Calculate BMR (Basal Metabolic Rate)
  let bmr;
  if (gender === 'male') {
    bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
  } else if (gender === 'female') {
    bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
  } else {
    throw new Error('Invalid gender for BMR calculation.');
  }

  // 3. Calculate TDEE (Total Daily Energy Expenditure)
  let activityMultiplier;
  switch (exerciseFrequency) {
    case 'no_exercise':
      activityMultiplier = 1.2;
      break;
    case 'light_activity':
      activityMultiplier = 1.375;
      break;
    case 'moderate_activity':
      activityMultiplier = 1.55;
      break;
    case 'active':
      activityMultiplier = 1.725;
      break;
    case 'very_active':
      activityMultiplier = 1.9;
      break;
    default:
      activityMultiplier = 1.2; // Default to sedentary if unknown
  }

  const tdee = bmr * activityMultiplier;

  // 4. Set Daily Calorie Goal
  let dailyCalorieGoal;
  const adjustment = 300; // Common adjustment for weight loss/gain
  if (bodyGoal === 'lose_weight') {
    dailyCalorieGoal = tdee - adjustment;
  } else if (bodyGoal === 'gain_weight') {
    dailyCalorieGoal = tdee + adjustment;
  } else { // maintain_weight
    dailyCalorieGoal = tdee;
  }

  // Ensure calorie goal is not too low (e.g., minimum 1200 for women, 1500 for men)
  if (dailyCalorieGoal < 1200 && gender === 'female') dailyCalorieGoal = 1200;
  if (dailyCalorieGoal < 1500 && gender === 'male') dailyCalorieGoal = 1500;

  // 5. Calculate Macronutrient Ratios (example: 40% Carb / 30% Protein / 30% Fat)
  // These percentages can be configurable or fixed. Using example percentages.
  const carbPercentage = 0.45; // 45%
  const proteinPercentage = 0.30; // 30%
  const fatPercentage = 0.25;   // 25% (adjust to sum to 1.0)

  const carbKcal = dailyCalorieGoal * carbPercentage;
  const proteinKcal = dailyCalorieGoal * proteinPercentage;
  const fatKcal = dailyCalorieGoal * fatPercentage;

  const carbsInGrams = carbKcal / 4; // 4 kcal/g for carbs
  const proteinInGrams = proteinKcal / 4; // 4 kcal/g for protein
  const fatInGrams = fatKcal / 9;     // 9 kcal/g for fat

  return {
    bmr: parseFloat(bmr.toFixed(2)),
    tdee: parseFloat(tdee.toFixed(2)),
    dailyCalorieGoal: parseFloat(dailyCalorieGoal.toFixed(2)),
    macronutrients: {
      carbs: parseFloat(carbsInGrams.toFixed(2)),
      protein: parseFloat(proteinInGrams.toFixed(2)),
      fat: parseFloat(fatInGrams.toFixed(2)),
    },
    // You can also return the percentages if needed for display
    macronutrientPercentages: {
      carbs: carbPercentage * 100,
      protein: proteinPercentage * 100,
      fat: fatPercentage * 100,
    }
  };
};
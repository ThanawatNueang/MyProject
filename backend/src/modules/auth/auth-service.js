// services/auth.service.js
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { generateToken, verifyToken } from '../../utils/jwt.js'; // Import generateToken
import db from '../../models/index.js'; // Import db object (contains User model)

const User = db.User;
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key';

/**
 * Handles the user login business logic.
 * @param {string} email - User's email.
 * @param {string} password - User's password.
 * @returns {Promise<{user: object, token: string}>} User object and JWT token.
 * @throws {Error} If credentials are invalid or user not found.
 */
export const login = async (email, password) => {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new Error('Invalid credentials. User not found.');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Invalid credentials. Incorrect password.');
  }

  const token = generateToken({ id: user.id, email: user.email, name: user.name }); // Include name in token payload
  
  // Return user object (excluding sensitive data like password) and the token
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      isVerified: user.isVerified,
    },
    token
  };
};

/**
 * Handles the user registration business logic.
 * @param {object} userData - User data for registration.
 * @returns {Promise<object>} The newly created user object.
 * @throws {Error} If email already exists or other registration error.
 */
export const register = async (userData) => {
  const { name, email, password, weight, height, gender, birthdate, exerciseRoutine, exerciseFrequency, fitnessGoal, bodyGoal } = userData;

  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw new Error('Email already exists.');
  }

  // Password Hashing is assumed to be handled in Model Hooks (e.g., beforeCreate hook in models/user.js)
  // Ensure your User model's `beforeCreate` hook hashes the password before saving.
  const newUser = await User.create({
    name,
    email,
    password, // Pass raw password for Model Hook to hash
    weight,
    height,
    gender,
    birthdate,
    exerciseRoutine,
    exerciseFrequency,
    fitnessGoal,
    bodyGoal,
    isVerified: false,
    profilePicture: 'default.jpg' // Ensure a default is set if not provided
  });

  // Return the created user object (excluding sensitive data like password)
  return {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    isVerified: newUser.isVerified,
    weight: newUser.weight,
    height: newUser.height,
    gender: newUser.gender,
    birthdate: newUser.birthdate,
    exerciseRoutine: newUser.exerciseRoutine,
    exerciseFrequency: newUser.exerciseFrequency,
    fitnessGoal: newUser.fitnessGoal,
    bodyGoal: newUser.bodyGoal,
    profilePicture: newUser.profilePicture,
  };
};
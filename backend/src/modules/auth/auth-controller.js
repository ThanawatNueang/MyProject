// controllers/auth.controller.js
import jwt from 'jsonwebtoken'; // Still needed for jwt.decode
import * as authService from '../auth/auth-service.js'; // Import all functions from auth.service.js

const NODE_ENV = process.env.NODE_ENV || 'development';
// JWT_SECRET is now primarily used within auth.service.js, but might be needed here for clearCookie options if secure/sameSite depend on NODE_ENV.

// --- Function for user login ---
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Call the service layer for business logic
    const { user, token } = await authService.login(email, password);

    const decodedToken = jwt.decode(token);
    const expiresAt = new Date(decodedToken.exp * 1000);

    const cookieOptions = {
      expires: expiresAt,
      token,
      httpOnly: true,
      secure: NODE_ENV === 'production',
      sameSite: NODE_ENV === 'production' ? 'None' : 'None',
    };

    res.cookie('jwtToken', token, cookieOptions);

    res.status(200).json({
      message: 'Login successful!',
      token: token,
      user: user // User data from service
    });

  } catch (error) {
    console.error('Error during user login:', error);
    res.status(400).json({ message: error.message }); // Send specific error message from service
  }
};

// --- Function for user registration ---
export const registerUser = async (req, res) => {
  const userData = req.body;
  const { email, password } = userData;

  try {
    const newUser = await authService.register(userData);

    const { user, token } = await authService.login(email, password);

    const decodedToken = jwt.decode(token);
    const expiresAt = new Date(decodedToken.exp * 1000);

    const cookieOptions = {
      expires: expiresAt,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', 

      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    };

    res.cookie('jwtToken', token, cookieOptions);

    res.status(201).json({
      message: 'User registered and logged in successfully!',
      user: user,
      token: token
    });

  } catch (error) {
    console.error('Error during user registration and auto-login:', error);
    res.status(400).json({ message: error.message || 'Registration failed.' });
  }
};

// --- Middleware for JWT Token authentication ---
export const authenticateToken = async (req, res, next) => {
  const token = req.cookies.jwtToken;

  if (!token) {
    return res.status(401).json({ message: 'No token provided. Unauthorized.' });
  }

  try {
    // Call the service layer to verify token
    const user = await authService.verifyToken(token);
    req.user = user; // Store decoded user info in req
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    // Clear the old cookie for cleanliness if token is invalid/expired
    res.clearCookie('jwtToken', {
      httpOnly: true,
      sameSite: NODE_ENV === 'production' ? 'None' : 'None',
      secure: NODE_ENV === 'production'
    });
    return res.status(403).json({ message: error.message }); // Send specific error message from service
  }
};

// --- Endpoint for checking login status ---
export const checkAuthStatus = (req, res) => {
  // This function is called after authenticateToken middleware
  // So, req.user will already contain user data decoded from token
  res.status(200).json({
    isAuthenticated: true,
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name, // Assuming 'name' is in token payload
    }
  });
};

// --- Endpoint for user logout ---
export const logoutUser = (req, res) => {
  // Clear the jwtToken cookie from the browser
  res.clearCookie('jwtToken', {
    httpOnly: true,
    sameSite: NODE_ENV === 'production' ? 'None' : 'None',
    secure: NODE_ENV === 'production'
  });
  res.status(200).json({ message: 'Logged out successfully.' });
};

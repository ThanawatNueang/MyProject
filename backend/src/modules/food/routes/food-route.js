// routes/food.routes.js
import express from 'express';
import * as foodController from '../controllers/food-controller.js'; // Import all functions from food.controller.js
// import { authenticateToken } from '../controllers/auth.controller.js'; // Optional: If you want to protect these routes

const router = express.Router();

// Route to get all food items
router.get('/', foodController.getAllFoods); // Add authenticateToken if needed: router.get('/', authenticateToken, foodController.getAllFoods);

// Route to get a single food item by ID
router.get('/:foodId', foodController.getFoodById); // Add authenticateToken if needed

// Route to create a new food item
router.post('/', foodController.createFood); // Add authenticateToken if needed

// Route to update an existing food item
router.patch('/:foodId', foodController.updateFood); // Use PATCH for partial updates. Add authenticateToken if needed

// Route to delete a food item
router.delete('/:foodId', foodController.deleteFood); // Add authenticateToken if needed

export default router;

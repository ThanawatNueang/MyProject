// routes/food.routes.js
import express from 'express';
import * as foodController from '../controllers/food-controller.js'; // Import all functions from food.controller.js
import upload from '../../../config/multerConfig.js';
// import { authenticateToken } from '../controllers/auth.controller.js'; // Optional: If you want to protect these routes

const router = express.Router();

// Route to get all food items
router.get('/', foodController.getAllFoods); // Add authenticateToken if needed: router.get('/', authenticateToken, foodController.getAllFoods);

router.get('/suggest', foodController.getFoodSuggest);

// Route to get a single food item by ID
router.get('/name/:name', foodController.getFoodName); // Add authenticateToken if needed

router.post('/name', upload.single('Image'), foodController.recognizeFoodFromImage);

router.get('/:foodId(\\d+)', foodController.getFoodById); // Add authenticateToken if needed

export default router;

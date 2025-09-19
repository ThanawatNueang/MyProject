// routes/ingredient.routes.js
import express from 'express';
import * as ingredientController from '../controllers/ingredient-controller.js'; // Import all functions from ingredient.controller.js
// import { authenticateToken } from '../controllers/auth.controller.js'; // Optional: If you want to protect these routes

const router = express.Router();

// Route to get all ingredients
router.get('/', ingredientController.getAllIngredients); // Add authenticateToken if needed: router.get('/', authenticateToken, ingredientController.getAllIngredients);

router.get('/suggest', ingredientController.getIngredientSuggest);

// Route to create a new ingredient
router.post('/', ingredientController.createIngredient); // Add authenticateToken if needed

// Route to get a single ingredient by ID
router.get('/:ingredientId', ingredientController.getIngredientById); // Add authenticateToken if needed

// Route to update an existing ingredient
router.patch('/:ingredientId', ingredientController.updateIngredient); // Use PATCH for partial updates. Add authenticateToken if needed

// Route to delete an ingredient
router.delete('/:ingredientId', ingredientController.deleteIngredient); // Add authenticateToken if needed


export default router;

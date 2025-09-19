// controllers/ingredient.controller.js
import * as ingredientService from '../services/ingredient-service.js'; // Import all functions from ingredient.service.js

/**
 * Controller to handle fetching all ingredients.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
export const getAllIngredients = async (req, res) => {
  try {
    const ingredients = await ingredientService.getAllIngredients();
    res.status(200).json({
      message: 'Ingredients retrieved successfully.',
      data: ingredients
    });
  } catch (error) {
    console.error('Error in getAllIngredients controller:', error);
    res.status(500).json({ message: error.message || 'Failed to retrieve ingredients.' });
  }
};

/**
 * Controller to handle fetching a single ingredient by ID.
 * @param {object} req - Express request object (contains ingredientId in params).
 * @param {object} res - Express response object.
 */
export const getIngredientById = async (req, res) => {
  try {
    const ingredient = await ingredientService.getIngredientById(req.params.ingredientId);
    res.status(200).json({
      message: 'Ingredient retrieved successfully.',
      data: ingredient
    });
  } catch (error) {
    console.error(`Error in getIngredientById controller for ID ${req.params.ingredientId}:`, error);
    res.status(404).json({ message: error.message || 'Ingredient not found.' });
  }
};

/**
 * Controller to handle creating a new ingredient.
 * @param {object} req - Express request object (contains ingredientData in body).
 * @param {object} res - Express response object.
 */
export const createIngredient = async (req, res) => {
  try {
    const newIngredient = await ingredientService.createIngredient(req.body);
    res.status(201).json({
      message: 'Ingredient created successfully.',
      data: newIngredient
    });
  } catch (error) {
    console.error('Error in createIngredient controller:', error);
    res.status(400).json({ message: error.message || 'Failed to create ingredient.' });
  }
};

/**
 * Controller to handle updating an existing ingredient.
 * @param {object} req - Express request object (contains ingredientId in params, updateData in body).
 * @param {object} res - Express response object.
 */
export const updateIngredient = async (req, res) => {
  const { ingredientId } = req.params;
  const updateData = req.body;
  try {
    const updatedIngredient = await ingredientService.updateIngredient(ingredientId, updateData);
    res.status(200).json({
      message: 'Ingredient updated successfully.',
      data: updatedIngredient
    });
  } catch (error) {
    console.error(`Error in updateIngredient controller for ID ${ingredientId}:`, error);
    res.status(400).json({ message: error.message || 'Failed to update ingredient.' });
  }
};

/**
 * Controller to handle deleting an ingredient.
 * @param {object} req - Express request object (contains ingredientId in params).
 * @param {object} res - Express response object.
 */
export const deleteIngredient = async (req, res) => {
  try {
    await ingredientService.deleteIngredient(req.params.ingredientId);
    res.status(200).json({ message: 'Ingredient deleted successfully.' });
  } catch (error) {
    console.error(`Error in deleteIngredient controller for ID ${req.params.ingredientId}:`, error);
    res.status(404).json({ message: error.message || 'Failed to delete ingredient.' });
  }
};



// ingredients.controller.js (และ foods.controller.js)
export const getIngredientSuggest = async (req, res) => {
  try {
    const raw = req.query.q;
    const q = Array.isArray(raw) ? raw[0] : (raw ?? '');
    const limit = Math.min(parseInt(req.query.limit || '10', 10), 20);

    const data = await ingredientService.suggestIngredients(q, limit);
    return res.status(200).json(data);
  } catch (err) {
    console.error('[getIngredientSuggest] error:', err);
    return res.status(500).json({ message: 'Failed to get ingredient suggestions.' });
  }
};

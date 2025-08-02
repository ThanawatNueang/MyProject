// controllers/food.controller.js
import * as foodService from '../services/food-service.js'; // Import all functions from food.service.js

/**
 * Controller to handle fetching all food items.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
export const getAllFoods = async (req, res) => {
  try {
    const foods = await foodService.getAllFoods();
    res.status(200).json({
      message: 'Foods retrieved successfully.',
      data: foods
    });
  } catch (error) {
    console.error('Error in getAllFoods controller:', error);
    res.status(500).json({ message: error.message || 'Failed to retrieve food items.' });
  }
};

/**
 * Controller to handle fetching a single food item by ID.
 * @param {object} req - Express request object (contains foodId in params).
 * @param {object} res - Express response object.
 */
export const getFoodById = async (req, res) => {
  try {
    const food = await foodService.getFoodById(req.params.foodId);
    res.status(200).json({
      message: 'Food retrieved successfully.',
      data: food
    });
  } catch (error) {
    console.error(`Error in getFoodById controller for ID ${req.params.foodId}:`, error);
    res.status(404).json({ message: error.message || 'Food item not found.' });
  }
};

/**
 * Controller to handle creating a new food item.
 * @param {object} req - Express request object (contains foodData and ingredientsData in body).
 * @param {object} res - Express response object.
 */
export const createFood = async (req, res) => {
  const { foodData, ingredientsData } = req.body; // Expecting foodData and ingredientsData in the request body
  try {
    const newFood = await foodService.createFood(foodData, ingredientsData);
    res.status(201).json({
      message: 'Food created successfully.',
      data: newFood
    });
  } catch (error) {
    console.error('Error in createFood controller:', error);
    res.status(400).json({ message: error.message || 'Failed to create food item.' });
  }
};

/**
 * Controller to handle updating an existing food item.
 * @param {object} req - Express request object (contains foodId in params, foodData and ingredientsData in body).
 * @param {object} res - Express response object.
 */
export const updateFood = async (req, res) => {
  const { foodId } = req.params;
  const { foodData, ingredientsData } = req.body; // Expecting foodData and ingredientsData in the request body
  try {
    const updatedFood = await foodService.updateFood(foodId, foodData, ingredientsData);
    res.status(200).json({
      message: 'Food updated successfully.',
      data: updatedFood
    });
  } catch (error) {
    console.error(`Error in updateFood controller for ID ${foodId}:`, error);
    res.status(400).json({ message: error.message || 'Failed to update food item.' });
  }
};

/**
 * Controller to handle deleting a food item.
 * @param {object} req - Express request object (contains foodId in params).
 * @param {object} res - Express response object.
 */
export const deleteFood = async (req, res) => {
  try {
    await foodService.deleteFood(req.params.foodId);
    res.status(200).json({ message: 'Food deleted successfully.' });
  } catch (error) {
    console.error(`Error in deleteFood controller for ID ${req.params.foodId}:`, error);
    res.status(404).json({ message: error.message || 'Failed to delete food item.' });
  }
};

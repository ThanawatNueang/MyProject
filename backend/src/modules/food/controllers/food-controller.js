// controllers/food.controller.js
import * as foodService from '../services/food-service.js'; // Import all functions from food.service.js
import FormData from 'form-data';
import fetch from 'node-fetch';
import https from 'https';
import fs from 'fs';
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

export const getFoodName = async (req, res) => {
  try {
    console.log(req.params.name)
    const food = await foodService.getFoodByName(req.params.name);
    res.status(200).json({
      message: 'Food retrieved successfully.',
      data: food
    });
  } catch (error) {
    console.error(`Error in getFoodById controller for ID ${req.params.name}:`, error);
    res.status(404).json({ message: error.message || 'Food item not found.' });
  }
};



export const recognizeFoodFromImage = async (req, res, next) => {
  try {

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'image is required' });
    }
     const form = new FormData();
    form.append('Image', fs.createReadStream(req.file.path));
    
  const agent = new https.Agent({
  rejectUnauthorized: false
});

const dotnetResp = await fetch('https://localhost:7014/Detect/detect', {
  method: 'POST',
  body: form,
  headers: form.getHeaders(),
  agent
});
    if (!dotnetResp.ok) {
      throw new Error(`.NET API error: ${dotnetResp.status} ${dotnetResp.statusText}`);
    }

    const dotnetData = await dotnetResp.json();

    // 2) ดึง className จากผล detect
    const { results = [] } = dotnetData || {};
    const names = [...new Set(results.map(r => r.className))];
    const components = [...new Set(results.map(r => r.components))];
    

    // 3) ค้นข้อมูลอาหารจาก service
    const enriched = [];
    for (const name of names) {
      try {
        const foodData = await foodService.getFoodByName(name,components);
        enriched.push({ className: name, food: foodData || null });
      } catch (err) {
        // enriched.push({ className: name, food: null });
      }
    }

    // 4) ส่งผลลัพธ์กลับ
    res.status(200).json({
      success: true,
      results: enriched
    });
  } catch (error) {
    next(error);
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


export const getFoodSuggest = async (req, res) => {
  try {
    const q = (req.query.q ?? '').toString();
    const limit = Math.min(parseInt(req.query.limit || '10', 10), 20);
    const data = await foodService.suggestFoods(q, limit);
    return res.status(200).json(data);
  } catch (err) {
    console.error('[getFoodSuggest] error:', err);
    return res.status(500).json({ message: 'Failed to get food suggestions.' });
  }
};
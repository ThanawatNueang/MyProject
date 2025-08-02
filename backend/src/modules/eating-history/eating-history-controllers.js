// src/modules/eating-history/controllers/eating-history.controller.js
import * as eatingHistoryService from '../eating-history/eating-history-services.js';

/**
 * Controller to handle logging a new meal entry.
 * @param {object} req - Express request object (contains user_id from auth, mealData in body).
 * @param {object} res - Express response object.
 */
export const createEatingHistoryEntry = async (req, res) => {
  try {
    // Assuming req.user.id is populated by an authentication middleware
    const userId = req.user.id; 
    const mealData = req.body; // foodId, customIngredients, notes, consumedAt

    const newEntry = await eatingHistoryService.logMeal(userId, mealData);
    res.status(201).json({
      message: 'Meal logged successfully.',
      data: newEntry
    });
  } catch (error) {
    console.error('Error in createEatingHistoryEntry controller:', error);
    res.status(400).json({ message: error.message || 'Failed to log meal.' });
  }
};

/**
 * Controller to handle fetching eating history for the authenticated user.
 * This endpoint provides the detailed list of meals for the dashboard.
 * @param {object} req - Express request object (contains user_id from auth, startDate, endDate from query).
 * @param {object} res - Express response object.
 */
export const getUserEatingHistory = async (req, res) => {
  try {
    // Assuming req.user.id is populated by an authentication middleware
    const userId = req.user.id; 
    const { startDate, endDate } = req.query; // Get date range from query parameters

    if (!startDate || !endDate) {
      return res.status(400).json({ message: `Start date = ${startDate} and end date = ${endDate} are required user_id = ${userId}.` });
    }

    const history = await eatingHistoryService.getEatingHistoryByUserId(userId, startDate, endDate);
    res.status(200).json({
      message: 'Eating history retrieved successfully.',
      data: history
    });
  } catch (error) {
    console.error('Error in getUserEatingHistory controller:', error);
    res.status(500).json({ message: error.message || 'Failed to retrieve eating history.' });
  }
};

/**
 * Controller to handle fetching nutrition summary for the authenticated user.
 * This endpoint provides the total summary for the dashboard's top cards.
 * @param {object} req - Express request object (contains user_id from auth, startDate, endDate from query).
 * @param {object} res - Express response object.
 */
export const getUserEatingHistorySummary = async (req, res) => {
  try {
    // Assuming req.user.id is populated by an authentication middleware
    const userId = req.user.id; 
    const { startDate, endDate } = req.query; // Get date range from query parameters

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required.' });
    }

    const summary = await eatingHistoryService.getEatingHistorySummary(userId, startDate, endDate);
    res.status(200).json({
      message: 'Eating history summary retrieved successfully.',
      data: summary
    });
  } catch (error) {
    console.error('Error in getUserEatingHistorySummary controller:', error);
    res.status(500).json({ message: error.message || 'Failed to retrieve eating history summary.' });
  }
};

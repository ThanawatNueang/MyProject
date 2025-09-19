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
    console.log(mealData)
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

export const updateEatingHistoryEntry = async (req, res) => {
  try {
    const userId = req.user.id;
    const entryId = req.body.id; // สมมติ route: PATCH /eating-history/:id
    const mealData = req.body;
    console.log(userId, entryId, mealData)
    const updated = await eatingHistoryService.updateMeal(userId, entryId, mealData);
    res.status(200).json({ message: "Meal updated successfully.", data: updated });
  } catch (error) {
    console.error("Error in updateEatingHistoryEntry controller:", error);
    const status = error.statusCode || (error.message?.includes("not found") ? 404 : 400);
    res.status(status).json({ message: error.message || "Failed to update meal." });
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


export const deleteEatingHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const id = req.params.id;
    console.log(`user = ${userId}, id = ${id}`)
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Entry ID is required."
      });
    }
    
    const destroy = await eatingHistoryService.deleteEatingHistory(userId,id)
    res.status(200).json({
      message: 'Eating history destroy successfully.',
      data: destroy
    });
  } catch (err) {
    console.error("Delete error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to delete"
    });
  }
};
// src/modules/eating-history/services/eating-history.service.js
import db from '../../models/index.js'; // Import db object

const EatingHistory = db.EatingHistory;
const Food = db.Food;
const Ingredient = db.Ingredient; // Needed if you want to re-calculate nutrition in backend

/**
 * Logs a new meal entry for a user.
 * This function is called when a user saves a meal from the FoodImageRecognition component.
 * @param {string} userId - The ID of the user logging the meal.
 * @param {object} mealData - Object containing meal details (foodId, customIngredients, notes, etc.).
 * @returns {Promise<object>} The newly created eating history entry.
 */
export const logMeal = async (userId, mealData) => {
  try {
    const { foodId, customIngredients, notes, consumedAt } = mealData;

    // Re-calculate nutrition values in the backend for security and accuracy
    // This ensures that even if frontend calculations are flawed, backend has correct data.
    let calculatedCalories = 0;
    let calculatedFat = 0;
    let calculatedProtein = 0;
    let calculatedCarbohydrates = 0;

    if (customIngredients && Array.isArray(customIngredients)) {
      for (const item of customIngredients) {
        // Fetch full ingredient details from DB to get nutrition_per_unit
        const ingredient = await Ingredient.findByPk(item.id, {
          attributes: ['calories_per_unit', 'fat_per_unit', 'protein_per_unit', 'carbohydrates_per_unit']
        });

        if (ingredient) {
          calculatedCalories += (ingredient.calories_per_unit || 0) * item.quantity;
          calculatedFat += (ingredient.fat_per_unit || 0) * item.quantity;
          calculatedProtein += (ingredient.protein_per_unit || 0) * item.quantity;
          calculatedCarbohydrates += (ingredient.carbohydrates_per_unit || 0) * item.quantity;
        }
      }
    }

    const newEntry = await EatingHistory.create({
      user_id: userId,
      food_id: foodId || null, // Can be null if it's a completely custom meal
      consumed_at: consumedAt || new Date(),
      custom_ingredients: customIngredients, // Model will JSON.stringify this via getter/setter
      calculated_calories: parseFloat(calculatedCalories.toFixed(2)),
      calculated_fat: parseFloat(calculatedFat.toFixed(2)),
      calculated_protein: parseFloat(calculatedProtein.toFixed(2)),
      calculated_carbohydrates: parseFloat(calculatedCarbohydrates.toFixed(2)),
      notes: notes || null,
    });

    // To return a clean object with parsed custom_ingredients and food_name for frontend
    const foodDetails = newEntry.food_id ? await Food.findByPk(newEntry.food_id, { attributes: ['name'] }) : null;

    return {
      id: newEntry.id,
      food_id: newEntry.food_id,
      food_name: foodDetails ? foodDetails.name : 'อาหารที่กำหนดเอง',
      consumed_at: newEntry.consumed_at,
      custom_ingredients: newEntry.custom_ingredients, // This will be parsed by getter
      calculated_calories: newEntry.calculated_calories,
      calculated_fat: newEntry.calculated_fat,
      calculated_protein: newEntry.calculated_protein,
      calculated_carbohydrates: newEntry.calculated_carbohydrates,
      notes: newEntry.notes,
      createdAt: newEntry.createdAt,
      updatedAt: newEntry.updatedAt,
    };
  } catch (error) {
    console.error('Error in logMeal service:', error);
    throw error;
  }
};

/**
 * Retrieves eating history for a specific user within a date range.
 * This function provides the detailed list of meals for the dashboard.
 * @param {string} userId - The ID of the user.
 * @param {string} startDate - Start date (YYYY-MM-DD).
 * @param {string} endDate - End date (YYYY-MM-DD).
 * @returns {Promise<Array<object>>} An array of eating history entries.
 */
export const getEatingHistoryByUserId = async (userId, startDate, endDate) => {
  try {
    const history = await EatingHistory.findAll({
      where: {
        user_id: userId,
        consumed_at: {
          [db.Sequelize.Op.between]: [`${startDate} 00:00:00`, `${endDate} 23:59:59`]
        }
      },
      include: [{
        model: Food,
        as: 'food',
        attributes: ['name', 'serving_size'] // Include food name if available
      }],
      order: [['consumed_at', 'DESC']], // Order by most recent meal first
      attributes: { exclude: ['createdAt', 'updatedAt', 'user_id'] }
    });

    // Map and parse custom_ingredients, and add food_name
    return history.map(entry => ({
      id: entry.id,
      food_id: entry.food_id,
      food_name: entry.food ? entry.food.name : 'อาหารที่กำหนดเอง', // Display food name or custom
      consumed_at: entry.consumed_at,
      custom_ingredients: entry.custom_ingredients, // Getter will parse this
      calculated_calories: entry.calculated_calories,
      calculated_fat: entry.calculated_fat,
      calculated_protein: entry.calculated_protein,
      calculated_carbohydrates: entry.calculated_carbohydrates,
      notes: entry.notes,
    }));
  } catch (error) {
    console.error(`Error in getEatingHistoryByUserId service for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Calculates the summary of nutrition for a specific user within a date range.
 * This function provides the total summary for the dashboard's top cards.
 * @param {string} userId - The ID of the user.
 * @param {string} startDate - Start date (YYYY-MM-DD).
 * @param {string} endDate - End date (YYYY-MM-DD).
 * @returns {Promise<object>} An object containing total calories, fat, protein, carbohydrates.
 */
export const getEatingHistorySummary = async (userId, startDate, endDate) => {
  try {
    const summary = await EatingHistory.findAll({
      where: {
        user_id: userId,
        consumed_at: {
          [db.Sequelize.Op.between]: [`${startDate} 00:00:00`, `${endDate} 23:59:59`]
        }
      },
      attributes: [
        [db.Sequelize.fn('SUM', db.Sequelize.col('calculated_calories')), 'totalCalories'],
        [db.Sequelize.fn('SUM', db.Sequelize.col('calculated_fat')), 'totalFat'],
        [db.Sequelize.fn('SUM', db.Sequelize.col('calculated_protein')), 'totalProtein'],
        [db.Sequelize.fn('SUM', db.Sequelize.col('calculated_carbohydrates')), 'totalCarbohydrates'],
      ],
      raw: true, // Return raw data, not Sequelize instances
    });

    // Ensure sums are numbers, default to 0 if null (no data)
    return {
      calories: parseFloat((summary[0].totalCalories || 0).toFixed(2)),
      fat: parseFloat((summary[0].totalFat || 0).toFixed(2)),
      protein: parseFloat((summary[0].totalProtein || 0).toFixed(2)),
      carbohydrates: parseFloat((summary[0].totalCarbohydrates || 0).toFixed(2)),
    };
  } catch (error) {
    console.error(`Error in getEatingHistorySummary service for user ${userId}:`, error);
    throw error;
  }
};

// src/modules/eating-history/services/eating-history.service.js

import db from '../../models/index.js'; // Import db object
import { computeServingSize } from '../../utils/serving.js'

const { sequelize } = db;
const EatingHistory = db.EatingHistory;
const Food = db.Food;
const Ingredient = db.Ingredient; // Needed if you want to re-calculate nutrition in backend

const round2 = (n) => parseFloat((Number(n) || 0).toFixed(2));
const toNum = (v) => (v == null ? 0 : Number(v));

// คำนวณโภชนาการจาก customIngredients = [{ id, quantity }, ...]
async function computeTotals(customIngredients = []) {
  const result = { calculated_calories: 0, calculated_fat: 0, calculated_protein: 0, calculated_carbohydrates: 0 };
  if (!Array.isArray(customIngredients) || customIngredients.length === 0) return result;

  const ids = customIngredients.map(i => i.id);
  const rows = await Ingredient.findAll({
    where: { id: ids },
    attributes: ['id', 'calories_per_unit', 'fat_per_unit', 'protein_per_unit', 'carbohydrates_per_unit']
  });
  const map = new Map(rows.map(r => [String(r.id), r]));

  for (const item of customIngredients) {
    console.log(item)
    const row = map.get(String(item.id));
    console.log(row)
    if (!row) {
      // เข้มงวด: โยน error
      throw new Error(`Ingredient not found: ${item.id}`);
      // ถ้าอยากข้ามให้ใช้: if (!row) continue;
    }
    const qty = toNum(item.quantity);
    result.calculated_calories += toNum(row.calories_per_unit) * qty;
    result.calculated_fat += toNum(row.fat_per_unit) * qty;
    result.calculated_protein += toNum(row.protein_per_unit) * qty;
    result.calculated_carbohydrates += toNum(row.carbohydrates_per_unit) * qty;
  }

  return {
    calculated_calories: round2(result.calculated_calories),
    calculated_fat: round2(result.calculated_fat),
    calculated_protein: round2(result.calculated_protein),
    calculated_carbohydrates: round2(result.calculated_carbohydrates),
  };
}

/**
 * Logs a new meal entry for a user.
 * This function is called when a user saves a meal from the FoodImageRecognition component.
 * @param {string} userId - The ID of the user logging the meal.
 * @param {object} mealData - Object containing meal details (foodId, customIngredients, notes, etc.).
 * @returns {Promise<object>} The newly created eating history entry.
 */
export const logMeal = async (userId, mealData) => {
  try {
    const { foodId, customIngredients, notes, consumedAt,custom_food_name} = mealData;

    // Re-calculate nutrition values in the backend for security and accuracy
    // This ensures that even if frontend calculations are flawed, backend has correct data.
    let calculatedCalories = 0;
    let calculatedFat = 0;
    let calculatedProtein = 0;
    let calculatedCarbohydrates = 0;

    if (customIngredients && Array.isArray(customIngredients)) {
      for (const item of customIngredients) {
        console.log(item.id)
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
      custom_food_name: custom_food_name,
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
      food_name: custom_food_name || foodDetails.name ,
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

export const updateMeal = async (userId, entryId, mealData) => {
  return await sequelize.transaction(async (t) => {
    // หา entry และเช็คสิทธิ์
    const entry = await EatingHistory.findByPk(entryId, { transaction: t });
    if (!entry) throw new Error("Eating history entry not found.");
    if (String(entry.user_id) !== String(userId)) {
      const err = new Error("Forbidden: you do not own this entry.");
      err.statusCode = 403;
      throw err;
    }

    const {
      foodId,                // อาจเป็น null เพื่อลบการลิงก์กับเมนู
      customIngredients,     // หากส่งมา จะคำนวณใหม่ให้เสมอ (แม้จะเป็น [])
      notes,
      consumedAt,
      custom_food_name
    } = mealData || {};

    // เตรียมข้อมูลอัปเดตแบบ partial
    const payload = {};
    if (typeof foodId !== "undefined") payload.food_id = foodId || null;
    if (typeof custom_food_name !== "undefined") payload.custom_food_name = custom_food_name || payload.food_name;
    if (typeof notes !== "undefined") payload.notes = notes ?? null;
    if (typeof consumedAt !== "undefined") payload.consumed_at = consumedAt || new Date();
    console.log(customIngredients)
    // หากผู้ใช้ส่ง customIngredients มา (อาจเป็น [] เพื่อเคลียร์)
    if (typeof customIngredients !== "undefined") {
      // คำนวณใหม่ทั้งหมด
      const totals = await computeTotals(customIngredients);
      payload.custom_ingredients = customIngredients; // Model จะจัดการ JSON getter/setter
      payload.calculated_calories = totals.calculated_calories;
      payload.calculated_fat = totals.calculated_fat;
      payload.calculated_protein = totals.calculated_protein;
      payload.calculated_carbohydrates = totals.calculated_carbohydrates;
    }

    // อัปเดต
    await entry.update(payload, { transaction: t });

    // เตรียม response ให้เหมือนของ create
    const foodDetails = entry.food_id
      ? await Food.findByPk(entry.food_id, { attributes: ["name"], transaction: t })
      : null;

    return {
      id: entry.id,
      food_id: entry.food_id,
      food_name: custom_food_name || foodDetails.name ,
      consumed_at: entry.consumed_at,
      custom_ingredients: entry.custom_ingredients,
      calculated_calories: entry.calculated_calories,
      calculated_fat: entry.calculated_fat,
      calculated_protein: entry.calculated_protein,
      calculated_carbohydrates: entry.calculated_carbohydrates,
      notes: entry.notes,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    };
  });
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
        attributes: ['name'] // Include food name if available
      }],
      order: [['consumed_at', 'DESC']], // Order by most recent meal first
      attributes: { exclude: ['createdAt', 'updatedAt', 'user_id'] }
    });
    const servingSizeFromQty = computeServingSize(history.ingredients, { decimals: 2 });
    // Map and parse custom_ingredients, and add food_name
    return history.map(entry => ({
      id: entry.id,
      food_id: entry.food_id,
      food_name: entry.custom_food_name || entry.food.name, // Display food name or custom
      serving_size: servingSizeFromQty,
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


export const deleteEatingHistory = async (userId, id) => {
  console.log(id)
  return await sequelize.transaction(async (t) => {
    try {
      const entry = await EatingHistory.findByPk(id, { transaction: t });
      if (!entry) throw new Error("Eating history entry not found.");

      if (String(entry.user_id) !== String(userId)) {
        const err = new Error("Forbidden: you do not own this entry.");
        err.statusCode = 403;
        throw err;
      }

      await entry.destroy({ transaction: t });

      return { success: true, message: "Eating history deleted successfully." };
    } catch (error) {
      console.error("Error deleting entry:", error);

      if (error.statusCode) {
        throw error;
      }

      const err = new Error("Failed to delete eating history.");
      err.statusCode = 500;
      throw err;
    }
  });
};
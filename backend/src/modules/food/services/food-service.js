// services/food.service.js
import db from '../../../models/index.js'; // Import db object which contains all models

const Food = db.Food;
const Ingredient = db.Ingredient;
const FoodIngredient = db.Food_Ingredient;

/**
 * Retrieves all food items from the database.
 * Includes associated ingredients and their quantities.
 * @returns {Promise<Array<object>>} An array of food objects with their ingredients.
 */
export const getAllFoods = async () => {
  try {
    const foods = await Food.findAll({
      include: [{
        model: Ingredient,
        as: 'ingredients', // Use the alias defined in models/index.js
        through: {
          attributes: ['quantity'] // Only retrieve the quantity from the junction table
        },
        attributes: { exclude: ['createdAt', 'updatedAt'] } // Exclude timestamps from ingredient details
      }]
    });

    // Manually calculate total nutrition for each food item
    const foodsWithNutrition = foods.map(food => {
      let totalCalories = 0;
      let totalFat = 0;
      let totalProtein = 0;
      let totalCarbohydrates = 0;

      // Iterate through each ingredient associated with the food
      food.ingredients.forEach(ingredient => {
        const quantity = ingredient.FoodIngredient.quantity; // Access quantity from the junction model

        totalCalories += ingredient.calories_per_unit * quantity;
        totalFat += ingredient.fat_per_unit * quantity;
        totalProtein += ingredient.protein_per_unit * quantity;
        totalCarbohydrates += ingredient.carbohydrates_per_unit * quantity;
      });

      // Return food data including calculated nutrition
      return {
        id: food.id,
        name: food.name,
        serving_size: food.serving_size,
        serving_suggestions: food.serving_suggestions,
        createdAt: food.createdAt,
        updatedAt: food.updatedAt,
        ingredients: food.ingredients.map(ing => ({ // Return ingredients in a cleaner format
          id: ing.id,
          name: ing.name,
          unit: ing.unit,
          quantity: ing.FoodIngredient.quantity, // Quantity for this specific food item
          calories_per_unit: ing.calories_per_unit,
          fat_per_unit: ing.fat_per_unit,
          protein_per_unit: ing.protein_per_unit,
          carbohydrates_per_unit: ing.carbohydrates_per_unit,
        })),
        calculated_nutrition: {
          calories: parseFloat(totalCalories.toFixed(2)),
          fat: parseFloat(totalFat.toFixed(2)),
          protein: parseFloat(totalProtein.toFixed(2)),
          carbohydrates: parseFloat(totalCarbohydrates.toFixed(2)),
        }
      };
    });

    return foodsWithNutrition;

  } catch (error) {
    console.error('Error in getAllFoods service:', error);
    throw new Error('Failed to retrieve food items.');
  }
};

/**
 * Retrieves a single food item by its ID.
 * Includes associated ingredients and their quantities.
 * @param {string} foodId - The ID of the food item.
 * @returns {Promise<object>} The food object with its ingredients and calculated nutrition.
 * @throws {Error} If food item is not found.
 */
export const getFoodById = async (foodId) => {
  try {
    const food = await Food.findByPk(foodId, {
      include: [{
        model: Ingredient,
        as: 'ingredients',
        through: {
          attributes: ['quantity']
        },
        attributes: { exclude: ['createdAt', 'updatedAt'] }
      }]
    });

    if (!food) {
      throw new Error('Food item not found.');
    }

    let totalCalories = 0;
    let totalFat = 0;
    let totalProtein = 0;
    let totalCarbohydrates = 0;

    food.ingredients.forEach(ingredient => {
      const quantity = ingredient.FoodIngredient.quantity;

      totalCalories += ingredient.calories_per_unit * quantity;
      totalFat += ingredient.fat_per_unit * quantity;
      totalProtein += ingredient.protein_per_unit * quantity;
      totalCarbohydrates += ingredient.carbohydrates_per_unit * quantity;
    });

    return {
      id: food.id,
      name: food.name,
      serving_size: food.serving_size,
      serving_suggestions: food.serving_suggestions,
      createdAt: food.createdAt,
      updatedAt: food.updatedAt,
      ingredients: food.ingredients.map(ing => ({
        id: ing.id,
        name: ing.name,
        unit: ing.unit,
        quantity: ing.FoodIngredient.quantity,
        calories_per_unit: ing.calories_per_unit,
        fat_per_unit: ing.fat_per_unit,
        protein_per_unit: ing.protein_per_unit,
        carbohydrates_per_unit: ing.carbohydrates_per_unit,
      })),
      calculated_nutrition: {
        calories: parseFloat(totalCalories.toFixed(2)),
        fat: parseFloat(totalFat.toFixed(2)),
        protein: parseFloat(totalProtein.toFixed(2)),
        carbohydrates: parseFloat(totalCarbohydrates.toFixed(2)),
      }
    };

  } catch (error) {
    console.error(`Error in getFoodById service for foodId ${foodId}:`, error);
    throw error; // Re-throw the error for the controller to handle
  }
};

/**
 * Creates a new food item and associates it with ingredients.
 * @param {object} foodData - Object containing food details (name, serving_size, serving_suggestions).
 * @param {Array<object>} ingredientsData - Array of objects [{ ingredient_id: string, quantity: number }].
 * @returns {Promise<object>} The newly created food object with its ingredients and nutrition.
 * @throws {Error} If food name already exists or ingredient IDs are invalid.
 */
export const createFood = async (foodData, ingredientsData) => {
  const transaction = await db.sequelize.transaction();
  try {
    // Check if food name already exists
    const existingFood = await Food.findOne({ where: { name: foodData.name } });
    if (existingFood) {
      throw new Error('Food with this name already exists.');
    }

    // Create the food item
    const newFood = await Food.create(foodData, { transaction });

    // Prepare ingredient associations
    const foodIngredients = [];
    for (const item of ingredientsData) {
      const ingredient = await Ingredient.findByPk(item.ingredient_id);
      if (!ingredient) {
        throw new Error(`Ingredient with ID ${item.ingredient_id} not found.`);
      }
      foodIngredients.push({
        food_id: newFood.id,
        ingredient_id: item.ingredient_id,
        quantity: item.quantity,
      });
    }

    // Bulk create entries in the FoodIngredient junction table
    await FoodIngredient.bulkCreate(foodIngredients, { transaction });

    await transaction.commit();

    // Fetch the newly created food with its ingredients and calculated nutrition
    // This re-uses the getFoodById logic for consistency
    return await getFoodById(newFood.id);

  } catch (error) {
    await transaction.rollback();
    console.error('Error in createFood service:', error);
    throw error;
  }
};

/**
 * Updates an existing food item and its associated ingredients.
 * @param {string} foodId - The ID of the food item to update.
 * @param {object} foodData - Object containing updated food details.
 * @param {Array<object>} ingredientsData - Array of objects [{ ingredient_id: string, quantity: number }].
 * @returns {Promise<object>} The updated food object with its ingredients and nutrition.
 * @throws {Error} If food item not found or ingredient IDs are invalid.
 */
export const updateFood = async (foodId, foodData, ingredientsData) => {
  const transaction = await db.sequelize.transaction();
  try {
    const food = await Food.findByPk(foodId, { transaction });
    if (!food) {
      throw new Error('Food item not found.');
    }

    // Update food details
    await food.update(foodData, { transaction });

    // --- Update associated ingredients ---
    // 1. Delete all existing associations for this food
    await FoodIngredient.destroy({ where: { food_id: foodId }, transaction });

    // 2. Create new associations
    const newFoodIngredients = [];
    for (const item of ingredientsData) {
      const ingredient = await Ingredient.findByPk(item.ingredient_id);
      if (!ingredient) {
        throw new Error(`Ingredient with ID ${item.ingredient_id} not found.`);
      }
      newFoodIngredients.push({
        food_id: foodId,
        ingredient_id: item.ingredient_id,
        quantity: item.quantity,
      });
    }

    await FoodIngredient.bulkCreate(newFoodIngredients, { transaction });

    await transaction.commit();

    // Fetch the updated food with its ingredients and calculated nutrition
    return await getFoodById(foodId);

  } catch (error) {
    await transaction.rollback();
    console.error(`Error in updateFood service for foodId ${foodId}:`, error);
    throw error;
  }
};

/**
 * Deletes a food item by its ID.
 * Associated entries in FoodIngredient table will be deleted due to CASCADE.
 * @param {string} foodId - The ID of the food item to delete.
 * @returns {Promise<void>}
 * @throws {Error} If food item not found.
 */
export const deleteFood = async (foodId) => {
  try {
    const food = await Food.findByPk(foodId);
    if (!food) {
      throw new Error('Food item not found.');
    }
    await food.destroy();
  } catch (error) {
    console.error(`Error in deleteFood service for foodId ${foodId}:`, error);
    throw error;
  }
};

// services/ingredient.service.js
import db from '../../../models/index.js'; // Import db object which contains all models

const Ingredient = db.Ingredient;

/**
 * Retrieves all ingredients from the database.
 * @returns {Promise<Array<object>>} An array of ingredient objects.
 */
export const getAllIngredients = async () => {
  try {
    const ingredients = await Ingredient.findAll({
      attributes: { exclude: ['createdAt', 'updatedAt'] } // Exclude timestamps
    });
    return ingredients;
  } catch (error) {
    console.error('Error in getAllIngredients service:', error);
    throw new Error('Failed to retrieve ingredients.');
  }
};

/**
 * Retrieves a single ingredient by its ID.
 * @param {string} ingredientId - The ID of the ingredient.
 * @returns {Promise<object>} The ingredient object.
 * @throws {Error} If ingredient is not found.
 */
export const getIngredientById = async (ingredientId) => {
  try {
    const ingredient = await Ingredient.findByPk(ingredientId, {
      attributes: { exclude: ['createdAt', 'updatedAt'] }
    });
    if (!ingredient) {
      throw new Error('Ingredient not found.');
    }
    return ingredient;
  } catch (error) {
    console.error(`Error in getIngredientById service for ingredientId ${ingredientId}:`, error);
    throw error;
  }
};

/**
 * Creates a new ingredient.
 * @param {object} ingredientData - Object containing ingredient details.
 * @returns {Promise<object>} The newly created ingredient object.
 * @throws {Error} If ingredient name already exists.
 */
export const createIngredient = async (ingredientData) => {
  try {
    const existingIngredient = await Ingredient.findOne({ where: { name: ingredientData.name } });
    if (existingIngredient) {
      throw new Error('Ingredient with this name already exists.');
    }
    const newIngredient = await Ingredient.create(ingredientData);
    return newIngredient;
  } catch (error) {
    console.error('Error in createIngredient service:', error);
    throw error;
  }
};

/**
 * Updates an existing ingredient.
 * @param {string} ingredientId - The ID of the ingredient to update.
 * @param {object} updateData - Object containing updated ingredient details.
 * @returns {Promise<object>} The updated ingredient object.
 * @throws {Error} If ingredient not found or name already exists.
 */
export const updateIngredient = async (ingredientId, updateData) => {
  try {
    const ingredient = await Ingredient.findByPk(ingredientId);
    if (!ingredient) {
      throw new Error('Ingredient not found.');
    }

    // Check if new name conflicts with existing ingredient (if name is being updated)
    if (updateData.name && updateData.name !== ingredient.name) {
      const existingIngredientWithName = await Ingredient.findOne({ where: { name: updateData.name } });
      if (existingIngredientWithName) {
        throw new Error('Another ingredient with this name already exists.');
      }
    }

    await ingredient.update(updateData);
    return ingredient;
  } catch (error) {
    console.error(`Error in updateIngredient service for ingredientId ${ingredientId}:`, error);
    throw error;
  }
};

/**
 * Deletes an ingredient by its ID.
 * Associated entries in FoodIngredient table will be deleted due to CASCADE.
 * @param {string} ingredientId - The ID of the ingredient to delete.
 * @returns {Promise<void>}
 * @throws {Error} If ingredient not found.
 */
export const deleteIngredient = async (ingredientId) => {
  try {
    const ingredient = await Ingredient.findByPk(ingredientId);
    if (!ingredient) {
      throw new Error('Ingredient not found.');
    }
    await ingredient.destroy();
  } catch (error) {
    console.error(`Error in deleteIngredient service for ingredientId ${ingredientId}:`, error);
    throw error;
  }
};

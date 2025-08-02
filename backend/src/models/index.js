// src/models/index.js
import { sequelize } from '../config/db.js';
import { Sequelize } from 'sequelize';

import UserModel from './user-model.js';
import FoodModel from './food-model.js';
import IngredientModel from './ingredient-model.js';
import FoodIngredientModel from './foodingredient-model.js';
import EatingHistoryModel from './eating-history-model.js';

const db = {};

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// กำหนด Model (Model จะถูกเรียกใช้โดยส่ง sequelize instance เข้าไป)
db.User = UserModel(sequelize);
db.Food = FoodModel(sequelize);
db.Ingredient = IngredientModel(sequelize);
db.FoodIngredient = FoodIngredientModel(sequelize);
db.EatingHistory = EatingHistoryModel(sequelize);

// กำหนด Associations (ความสัมพันธ์ระหว่างตาราง) ที่นี่
// นี่คือส่วนสำคัญที่ทำให้ Sequelize เข้าใจความสัมพันธ์ระหว่าง Models
db.Food.belongsToMany(db.Ingredient, {
  through: db.FoodIngredient, // ระบุตารางเชื่อมโยง
  foreignKey: 'food_id',     // Foreign Key ใน FoodIngredient ที่อ้างอิง Food
  otherKey: 'ingredient_id', // Foreign Key ใน FoodIngredient ที่อ้างอิง Ingredient
  as: 'ingredients'          // Alias สำหรับการดึงวัตถุดิบของอาหาร (food.ingredients)
});

db.Ingredient.belongsToMany(db.Food, {
  through: db.FoodIngredient, // ระบุตารางเชื่อมโยง
  foreignKey: 'ingredient_id', // Foreign Key ใน FoodIngredient ที่อ้างอิง Ingredient
  otherKey: 'food_id',       // Foreign Key ใน FoodIngredient ที่อ้างอิง Food
  as: 'foods'                // Alias สำหรับการดึงอาหารที่ใช้วัตถุดิบนี้ (ingredient.foods)
});

// <--- กำหนด Associations สำหรับ EatingHistory ที่นี่
db.EatingHistory.belongsTo(db.User, { foreignKey: 'user_id', as: 'user' });
db.EatingHistory.belongsTo(db.Food, { foreignKey: 'food_id', as: 'food' });

db.FoodIngredient.belongsTo(db.Food, { foreignKey: 'food_id' });
db.FoodIngredient.belongsTo(db.Ingredient, { foreignKey: 'ingredient_id' });


export default db;
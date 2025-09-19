// models/foodingredient.js
import { DataTypes } from 'sequelize';

/**
 * Sequelize model สำหรับตาราง FoodIngredients (ตารางเชื่อมโยง).
 * ตารางนี้เชื่อมโยงรายการอาหาร (Food) กับวัตถุดิบ (Ingredient) และระบุปริมาณของวัตถุดิบนั้นๆ.
 * @param {import('sequelize').Sequelize} sequelize - The Sequelize instance.
 */
const FoodIngredient = (sequelize) => {
  // แก้ไขตรงนี้! เปลี่ยนชื่อ Model จาก 'Food_Ingredients' เป็น 'FoodIngredient'
  const foodIngredientModel = sequelize.define('FoodIngredient', {
    food_id: {
      type: DataTypes.CHAR(36), // ใช้ CHAR(36) แทน UUID โดยตรงสำหรับ MySQL
      allowNull: false,
      primaryKey: true, // เป็นส่วนหนึ่งของ Primary Key แบบ Composite
      comment: 'Foreign key อ้างอิงถึง Food ID',
      binary: true // <--- เพิ่ม binary: true ตรงนี้
    },
    ingredient_id: {
      type: DataTypes.CHAR(36), // ใช้ CHAR(36) แทน UUID โดยตรงสำหรับ MySQL
      allowNull: false,
      primaryKey: true, // เป็นส่วนหนึ่งของ Primary Key แบบ Composite
      comment: 'Foreign key อ้างอิงถึง Ingredient ID',
      binary: true // <--- เพิ่ม binary: true ตรงนี้
    },
    quantity: {
      type: DataTypes.FLOAT,
      allowNull: false,
      comment: 'ปริมาณของวัตถุดิบที่ใช้ในอาหาร (ในหน่วยมาตรฐานของวัตถุดิบนั้นๆ)',
    },
  }, {
    tableName: 'foodingredients', // กำหนดชื่อตารางในฐานข้อมูลอย่างชัดเจน
    timestamps: true, // เปิดใช้งานคอลัมน์ createdAt และ updatedAt
    comment: 'ตารางเชื่อมโยงระหว่างรายการอาหารและวัตถุดิบ',
  });

  return foodIngredientModel;
};

export default FoodIngredient;

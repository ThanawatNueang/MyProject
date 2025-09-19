// models/ingredient.js
import { DataTypes } from 'sequelize';

/**
 * Sequelize model สำหรับตาราง Ingredients.
 * Model นี้กำหนดโครงสร้างและประเภทข้อมูลสำหรับการจัดเก็บข้อมูลวัตถุดิบ
 * รวมถึงค่าโภชนาการต่อ 1 หน่วยของวัตถุดิบนั้นๆ (เช่น ต่อ 1 กรัม).
 * @param {import('sequelize').Sequelize} sequelize - The Sequelize instance.
 */
const Ingredient = (sequelize) => {
  const ingredientModel = sequelize.define('Ingredient', {
    id: {
      type: DataTypes.CHAR(36), // ใช้ CHAR(36) แทน UUID โดยตรงสำหรับ MySQL
      defaultValue: DataTypes.UUIDV4, // สร้าง UUID V4 โดยอัตโนมัติ
      allowNull: false,
      primaryKey: true,
      comment: 'รหัสประจำตัวของวัตถุดิบ (UUID)',
      binary: true // สำคัญมากสำหรับ MySQL UUID Foreign Key Compatibility
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true, // ชื่อวัตถุดิบต้องไม่ซ้ำกัน
      comment: 'ชื่อวัตถุดิบ (เช่น "หมูสับ", "วุ้นเส้น")',
    },
    unit: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'หน่วยมาตรฐานของวัตถุดิบ (เช่น "กรัม", "มิลลิลิตร", "ชิ้น")',
    },
    calories_per_unit: {
      type: DataTypes.FLOAT,
      allowNull: false,
      comment: 'แคลอรี่ต่อ 1 หน่วยของวัตถุดิบ (เช่น kcal/กรัม)',
    },
    fat_per_unit: {
      type: DataTypes.FLOAT,
      allowNull: false,
      comment: 'ปริมาณไขมันต่อ 1 หน่วยของวัตถุดิบ (กรัม/กรัม)',
    },
    protein_per_unit: {
      type: DataTypes.FLOAT,
      allowNull: false,
      comment: 'ปริมาณโปรตีนต่อ 1 หน่วยของวัตถุดิบ (กรัม/กรัม)',
    },
    carbohydrates_per_unit: {
      type: DataTypes.FLOAT,
      allowNull: false,
      comment: 'ปริมาณคาร์โบไฮเดรตต่อ 1 หน่วยของวัตถุดิบ (กรัม/กรัม)',
    },
  }, {
    tableName: 'ingredients', // กำหนดชื่อตารางในฐานข้อมูลอย่างชัดเจน
    timestamps: true, // เปิดใช้งานคอลัมน์ createdAt และ updatedAt
    comment: 'ตารางสำหรับจัดเก็บวัตถุดิบแต่ละชนิดและค่าโภชนาการ',
  });

  return ingredientModel;
};

export default Ingredient;

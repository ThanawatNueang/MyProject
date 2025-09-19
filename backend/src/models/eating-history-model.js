// models/eating-history-model.js
import { DataTypes } from 'sequelize';

/**
 * Sequelize model for the EatingHistory table.
 * This table stores a user's logged meals, including custom ingredients and calculated nutrition.
 * @param {import('sequelize').Sequelize} sequelize - The Sequelize instance.
 */
const EatingHistory = (sequelize) => {
  const eatingHistoryModel = sequelize.define('EatingHistory', {
    id: {
      type: DataTypes.CHAR(36), // Using CHAR(36) for UUIDs in MySQL
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
      comment: 'รหัสประจำตัวของประวัติการกิน (UUID)',
      binary: true // Important for MySQL UUID Foreign Key Compatibility
    },
    user_id: {
      type: DataTypes.CHAR(36), // Foreign Key to User
      allowNull: false,
      comment: 'รหัสประจำตัวของผู้ใช้ที่บันทึกประวัติการกิน',
      binary: true
    },
    food_id: {
      type: DataTypes.CHAR(36), // Foreign Key to Food (can be null if it's a custom meal not based on a standard food)
      allowNull: true, // Allow null if the meal is entirely custom and not based on a predefined food
      comment: 'รหัสประจำตัวของอาหารหลักที่อ้างอิง (ถ้ามี)',
      binary: true
    },
    consumed_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'วันที่และเวลาที่บริโภคอาหาร',
    },
    // Store custom ingredients as JSON string or JSON type (if DB supports it)
    // This allows flexible storage of user-modified ingredient lists
    custom_ingredients: {
      type: DataTypes.TEXT, // Use TEXT for long JSON strings
      allowNull: true,
      comment: 'วัตถุดิบที่ผู้ใช้ปรับแต่งเอง (JSON string)',
      get() {
        const rawValue = this.getDataValue('custom_ingredients');
        return rawValue ? JSON.parse(rawValue) : null;
      },
      set(value) {
        this.setDataValue('custom_ingredients', JSON.stringify(value));
      }
    },
    calculated_calories: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
      comment: 'แคลอรี่รวมที่คำนวณได้สำหรับมื้อนี้',
    },
    calculated_fat: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
      comment: 'ปริมาณไขมันรวมที่คำนวณได้สำหรับมื้อนี้',
    },
    calculated_protein: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
      comment: 'ปริมาณโปรตีนรวมที่คำนวณได้สำหรับมื้อนี้',
    },
    calculated_carbohydrates: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
      comment: 'ปริมาณคาร์โบไฮเดรตที่คำนวณได้สำหรับมื้อนี้',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'บันทึกเพิ่มเติมเกี่ยวกับมื้ออาหาร',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    custom_food_name: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: null,
    comment: 'ชื่อเมนูที่ผู้ใช้แก้ไขเอง ถ้ามี',
  },
  //   serving_size: {
  //   type: DataTypes.DECIMAL(10,0),
  //   allowNull: true,
  //   defaultValue: null,
  // },

  }, {
    tableName: 'eating_history', // กำหนดชื่อตารางในฐานข้อมูล
    timestamps: true,
    comment: 'ตารางสำหรับจัดเก็บประวัติการกินของผู้ใช้',
  });

  // Define associations
  eatingHistoryModel.associate = (models) => {
    eatingHistoryModel.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    eatingHistoryModel.belongsTo(models.Food, { foreignKey: 'food_id', as: 'food' });
  };

  return eatingHistoryModel;
};

export default EatingHistory;

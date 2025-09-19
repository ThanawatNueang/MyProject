'use strict';

/** @type {import('sequelize-cli').Migration} */
// ใช้ export default สำหรับ ES Module compatibility
export default {
  /**
   * Defines the changes to be applied to the database (e.g., create table, add columns).
   * This migration creates the 'eating_histories' table.
   * @param {import('sequelize').QueryInterface} queryInterface - Query interface.
   * @param {import('sequelize').Sequelize} Sequelize - Instance of Sequelize.
   */
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('eating_histories', {
      id: {
        type: Sequelize.DataTypes.CHAR(36),
        defaultValue: Sequelize.literal('(UUID())'),
        allowNull: false,
        primaryKey: true,
        comment: 'รหัสประจำตัวของประวัติการกิน (UUID)',
        binary: true
      },
      user_id: {
        type: Sequelize.DataTypes.CHAR(36),
        allowNull: false,
        references: {
          model: 'users', // Assumes your User table is named 'users'
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Foreign key to User ID',
        binary: true
      },
      food_id: {
        type: Sequelize.DataTypes.CHAR(36),
        allowNull: true, // Allow null if it's a custom meal not based on a standard food
        references: {
          model: 'foods', // Assumes your Food table is named 'foods'
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL', // If a food is deleted, set food_id to NULL in history
        comment: 'Foreign key to Food ID (optional)',
        binary: true
      },
      consumed_at: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'วันที่และเวลาที่บริโภคอาหาร',
      },
      custom_ingredients: {
        type: Sequelize.DataTypes.TEXT, // Store as TEXT for JSON string
        allowNull: true,
        comment: 'วัตถุดิบที่ผู้ใช้ปรับแต่งเอง (JSON string)',
      },
      calculated_calories: {
        type: Sequelize.DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
        comment: 'แคลอรี่รวมที่คำนวณได้สำหรับมื้อนี้',
      },
      calculated_fat: {
        type: Sequelize.DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
        comment: 'ปริมาณไขมันรวมที่คำนวณได้สำหรับมื้อนี้',
      },
      calculated_protein: {
        type: Sequelize.DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
        comment: 'ปริมาณโปรตีนรวมที่คำนวณได้สำหรับมื้อนี้',
      },
      calculated_carbohydrates: {
        type: Sequelize.DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
        comment: 'ปริมาณคาร์โบไฮเดรตที่คำนวณได้สำหรับมื้อนี้',
      },
      notes: {
        type: Sequelize.DataTypes.TEXT,
        allowNull: true,
        comment: 'บันทึกเพิ่มเติมเกี่ยวกับมื้ออาหาร',
      },
      createdAt: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'Timestamp of creation',
      },
      updatedAt: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'Timestamp of last update',
      },
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_0900_ai_ci',
    });
  },

  /**
   * Defines the changes to revert from the database (e.g., drop table, remove columns).
   * This migration drops the 'eating_histories' table.
   * @param {import('sequelize').QueryInterface} queryInterface - Query interface.
   * @param {import('sequelize').Sequelize} Sequelize - Instance of Sequelize.
   */
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('eating_histories');
  }
};

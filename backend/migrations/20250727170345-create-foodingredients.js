'use strict';

/** @type {import('sequelize-cli').Migration} */
// ใช้ export default สำหรับ ES Module compatibility
export default {
  /**
   * กำหนดการเปลี่ยนแปลงที่จะนำไปใช้กับฐานข้อมูล (เช่น สร้างตาราง, เพิ่มคอลัมน์).
   * Migration นี้จะสร้างตาราง 'foodingredient' ซึ่งเป็นตารางเชื่อมโยง.
   * @param {import('sequelize').QueryInterface} queryInterface - Query interface.
   * @param {import('sequelize').Sequelize} Sequelize - Instance ของ Sequelize.
   */
  async up(queryInterface, Sequelize) {
    // ชื่อตารางใน up method ถูกต้องแล้ว: 'foodingredients'
    await queryInterface.createTable('foodingredients', {
      food_id: {
        type: Sequelize.DataTypes.CHAR(36),
        allowNull: false,
        primaryKey: true, // เป็นส่วนหนึ่งของ Primary Key แบบ Composite
        references: {
          model: 'foods', // อ้างอิงถึงตาราง 'foods'
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Foreign key อ้างอิงถึง Food ID',
        binary: true
      },
      ingredient_id: {
        type: Sequelize.DataTypes.CHAR(36),
        allowNull: false,
        primaryKey: true, // เป็นส่วนหนึ่งของ Primary Key แบบ Composite
        references: {
          model: 'ingredients', // อ้างอิงถึงตาราง 'ingredients'
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Foreign key อ้างอิงถึง Ingredient ID',
        binary: true
      },
      quantity: {
        type: Sequelize.DataTypes.FLOAT,
        allowNull: false,
        comment: 'ปริมาณของวัตถุดิบที่ใช้ในอาหาร (ในหน่วยมาตรฐานของวัตถุดิบนั้นๆ)',
      },
      createdAt: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'Timestamp ของการสร้าง',
      },
      updatedAt: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'Timestamp ของการอัปเดตล่าสุด',
      },
    }, {
      // เพิ่มการตั้งค่า charset และ collate ที่นี่
      charset: 'utf8mb4',
      collate: 'utf8mb4_0900_ai_ci',
    });
  },

  /**
   * กำหนดการเปลี่ยนแปลงที่จะย้อนกลับจากฐานข้อมูล (เช่น ลบตาราง, ลบคอลัมน์).
   * Migration นี้จะลบตาราง 'foodingredient'.
   * @param {import('sequelize').QueryInterface} queryInterface - Query interface.
   * @param {import('sequelize').Sequelize} Sequelize - Instance ของ Sequelize.
   */
  async down(queryInterface, Sequelize) {
    // แก้ไขตรงนี้! เปลี่ยนชื่อตารางจาก 'food_ingredients' เป็น 'foodingredients'
    await queryInterface.dropTable('foodingredients');
  }
};

'use strict';

/** @type {import('sequelize-cli').Migration} */
// ใช้ export default สำหรับ ES Module compatibility
export default {
  /**
   * กำหนดการเปลี่ยนแปลงที่จะนำไปใช้กับฐานข้อมูล (เช่น สร้างตาราง, เพิ่มคอลัมน์).
   * Migration นี้จะสร้างตาราง 'foods'.
   * @param {import('sequelize').QueryInterface} queryInterface - Query interface.
   * @param {import('sequelize').Sequelize} Sequelize - Instance ของ Sequelize.
   */
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('foods', {
      id: {
        type: Sequelize.DataTypes.UUID,
        defaultValue: Sequelize.DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      name: {
        type: Sequelize.DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      serving_suggestions: {
        type: Sequelize.DataTypes.TEXT,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    }, {
      // เพิ่มการตั้งค่า charset และ collate ที่นี่
      charset: 'utf8mb4',
      collate: 'utf8mb4_0900_ai_ci',
    });
  },

  /**
   * กำหนดการเปลี่ยนแปลงที่จะย้อนกลับจากฐานข้อมูล (เช่น ลบตาราง, ลบคอลัมน์).
   * Migration นี้จะลบตาราง 'foods'.
   * @param {import('sequelize').QueryInterface} queryInterface - Query interface.
   * @param {import('sequelize').Sequelize} Sequelize - Instance ของ Sequelize.
   */
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('foods');
  }
};

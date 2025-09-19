'use strict';

/** @type {import('sequelize-cli').Migration} */
// Changed from module.exports to export default for ES Module compatibility
export default { // Changed from module.exports
  /**
   * Defines the changes to apply to the database (e.g., create tables, add columns).
   * @param {import('sequelize').QueryInterface} queryInterface - The query interface.
   * @param {import('sequelize').Sequelize} Sequelize - The Sequelize instance.
   */
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ingredients', {
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
      unit: {
        type: Sequelize.DataTypes.STRING(50),
        allowNull: false,
      },
      calories_per_unit: {
        type: Sequelize.DataTypes.FLOAT,
        allowNull: false,
      },
      fat_per_unit: {
        type: Sequelize.DataTypes.FLOAT,
        allowNull: false,
      },
      protein_per_unit: {
        type: Sequelize.DataTypes.FLOAT,
        allowNull: false,
      },
      carbohydrates_per_unit: {
        type: Sequelize.DataTypes.FLOAT,
        allowNull: false,
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
   * Defines the changes to revert from the database (e.g., drop tables, remove columns).
   * @param {import('sequelize').QueryInterface} queryInterface - The query interface.
   * @param {import('sequelize').Sequelize} Sequelize - The Sequelize instance.
   */
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ingredients');
  }
};

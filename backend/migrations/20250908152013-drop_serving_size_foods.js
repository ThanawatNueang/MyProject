'use strict';

export default {
  async up(queryInterface, Sequelize) {
    // เปลี่ยนชื่อ table ให้ตรงโปรเจกต์คุณ (Foods vs foods)
    await queryInterface.removeColumn('foods', 'serving_size');
  },

  async down(queryInterface, Sequelize) {
    // เผื่อ roll back
    await queryInterface.addColumn('foods', 'serving_size', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: null,
      comment: 'Deprecated: now computed from ingredients.'
    });
  }
};

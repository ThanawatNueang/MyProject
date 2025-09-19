"use strict";

export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("eating_histories", "custom_food_name", {
      type: Sequelize.STRING(255),
      allowNull: true,
      defaultValue: null,
      comment: "ชื่อเมนูที่ผู้ใช้แก้ไขเอง ถ้ามี",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("eating_histories", "custom_food_name");
  },
};

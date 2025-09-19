"use strict";

export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("eating_histories", "serving_size", {
      type: Sequelize.DECIMAL(10),
      allowNull: true,
      defaultValue: null,
      comment: "ปริมาณที่ได้จากวัตถุดิบ",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("eating_histories", "serving_size");
  },
};

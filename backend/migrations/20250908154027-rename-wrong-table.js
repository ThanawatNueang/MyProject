'use strict';
export default {
  async up(queryInterface) {
    await queryInterface.renameTable('eating_histories', 'eating_history'); // แก้ตามที่ผิด/ถูกจริง
  },
  async down(queryInterface) {
    await queryInterface.renameTable('eating_histories', 'eating_history');
  }
};

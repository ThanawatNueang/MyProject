// models/food.js
import { DataTypes } from 'sequelize';

/**
 * Sequelize model สำหรับตาราง Foods.
 * Model นี้กำหนดโครงสร้างและประเภทข้อมูลสำหรับการจัดเก็บรายการอาหารหลัก.
 * @param {import('sequelize').Sequelize} sequelize - The Sequelize instance.
 */
const Food = (sequelize) => {
  const foodModel = sequelize.define('Food', {
    id: {
      type: DataTypes.CHAR(36), // ใช้ CHAR(36) แทน UUID โดยตรงสำหรับ MySQL
      defaultValue: DataTypes.UUIDV4, // สร้าง UUID V4 โดยอัตโนมัติ
      allowNull: false,
      primaryKey: true,
      comment: 'รหัสประจำตัวของรายการอาหาร (UUID)',
      binary: true // สำคัญมากสำหรับ MySQL UUID Foreign Key Compatibility
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true, // ชื่ออาหารต้องไม่ซ้ำกัน
      comment: 'ชื่ออาหาร (เช่น "ข้าวผัดกะเพราไก่", "อกไก่ย่าง")',
    },
    serving_size: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'ขนาดการบริโภคต่อหนึ่งหน่วย (เช่น "1 จาน", "100 กรัม")',
    },
    serving_suggestions: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'คำแนะนำเพิ่มเติมเกี่ยวกับการรับประทาน',
    },
  }, {
    tableName: 'foods', // กำหนดชื่อตารางในฐานข้อมูลอย่างชัดเจน
    timestamps: true, // เปิดใช้งานคอลัมน์ createdAt และ updatedAt
    comment: 'ตารางสำหรับจัดเก็บรายการอาหารหลัก',
  });

  return foodModel;
};

export default Food;

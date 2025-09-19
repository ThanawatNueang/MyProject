// src/utils/jwt.js
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config()

// ต้องมี JWT_SECRET ใน .env file
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN; // ค่าเริ่มต้น 1 ชั่วโมง

// ฟังก์ชันสำหรับสร้าง JWT Token
export const generateToken = (payload) => {
  if (!JWT_SECRET) {
    console.error('JWT_SECRET is not defined in environment variables.');
    // ใน Production ควรจะจัดการ Error ตรงนี้ให้ดีกว่านี้
    throw new Error('JWT_SECRET is not configured.');
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// ฟังก์ชันสำหรับยืนยัน JWT Token (จะใช้ในขั้นตอน Authentication Middleware)
export const verifyToken = (token) => {
  if (!JWT_SECRET) {
    console.error('JWT_SECRET is not defined in environment variables.');
    throw new Error('JWT_SECRET is not configured.');
  }
  return jwt.verify(token, JWT_SECRET);
};
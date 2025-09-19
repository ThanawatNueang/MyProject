// src/middleware/authMiddleware.js
import { verifyToken } from '../../utils/jwt.js'; // นำเข้าฟังก์ชัน verifyToken
import db from '../../models/index.js'; // นำเข้า db instance เพื่อเข้าถึง User Model

const User = db.User;

export const protect = async (req, res, next) => {
  let token;

  // 1. ตรวจสอบว่ามี Token ใน Authorization Header หรือไม่ (สำหรับ Frontend ที่เก็บใน localStorage หรือการทดสอบด้วย Header)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]; // ดึง Token ออกมา (ตัด 'Bearer ' ออก)
  }
  // 2. ถ้าไม่มีใน Header ให้ตรวจสอบใน Cookie (สำหรับ HttpOnly Cookie ที่ Browser ส่งอัตโนมัติ)
  else if (req.cookies && req.cookies.jwtToken) {
    token = req.cookies.jwtToken;
  }

  // ถ้าไม่มี Token เลย ไม่ว่าจะจาก Header หรือ Cookie
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided.' });
  }

  try {
    // 3. ตรวจสอบ Token
    const decoded = verifyToken(token); // decoded จะมี payload { id, email, iat, exp }

    // 4. ค้นหาผู้ใช้จาก ID ใน Token
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'User belonging to this token no longer exists.' });
    }

    // 5. เก็บข้อมูลผู้ใช้ไว้ใน req object เพื่อให้ Controller อื่นๆ เข้าถึงได้
    req.user = user;
    next(); // ไปยัง Middleware หรือ Controller ถัดไป

  } catch (error) {
    console.error('Error in authentication middleware:', error);
    // ตรวจสอบชนิดของ Error เพื่อให้ Response ที่แม่นยำขึ้น
    if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token has expired. Please log in again.' });
    }
    if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid token. Please log in again.' });
    }
    res.status(500).json({ message: 'Not authorized, token failed.', error: error.message });
  }
};

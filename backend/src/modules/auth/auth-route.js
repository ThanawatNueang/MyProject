// routes/auth.routes.js
import express from 'express';
import { registerUser, loginUser, authenticateToken, checkAuthStatus, logoutUser } from '../auth/auth-controller.js'; // <--- Import จาก Auth Controller
import { validateRegistration, validateLogin } from '../../middlewares/auth-validation.js'; // <--- Validation
import upload from '../../config/multerConfig.js'; // สำหรับ multer (ถ้ายังใช้)

const router = express.Router();

router.post('/register', upload.none(), validateRegistration, registerUser);
router.post('/login', upload.none(), validateLogin, loginUser);
router.get('/check-auth', authenticateToken, checkAuthStatus); // ต้องผ่าน authenticateToken ก่อน
router.post('/logout', logoutUser);

export default router; // ใช้ export default ถ้าคุณ import ด้วยชื่ออื่นใน app.js
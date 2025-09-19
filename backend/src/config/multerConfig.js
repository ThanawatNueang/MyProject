// src/config/multerConfig.js
import multer from 'multer';
import path from 'path'; // ใช้ path สำหรับจัดการพาธไฟล์

// กำหนด Storage สำหรับ Multer
const storage = multer.diskStorage({
  // กำหนดปลายทางที่จะเก็บไฟล์ที่อัปโหลด
  destination: (req, file, cb) => {
    // พาธที่ถูกต้องควรจะเป็น BACKEND/public/uploads
    // __dirname จะอ้างอิงถึงโฟลเดอร์ src/config
    // ดังนั้นต้องย้อนกลับ 2 ระดับ (../..) แล้วไปที่ public/uploads
    cb(null, path.join(process.cwd(), 'public', 'uploads'));
  },
  // กำหนดชื่อไฟล์ที่จะจัดเก็บ
  filename: (req, file, cb) => {
    // สร้างชื่อไฟล์ที่ไม่ซ้ำกัน โดยใช้ timestamp และนามสกุลไฟล์เดิม
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

// กำหนด Filter สำหรับประเภทไฟล์ (อนุญาตเฉพาะรูปภาพ)
const fileFilter = (req, file, cb) => {
  // ตรวจสอบประเภทไฟล์
  if (file.mimetype.startsWith('image/')) {
    cb(null, true); // อนุญาต
  } else {
    cb(new Error('Only image files are allowed!'), false); // ไม่อนุญาต
  }
};

// สร้าง Multer instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // จำกัดขนาดไฟล์ไม่เกิน 5 MB
  },
});

export default upload;
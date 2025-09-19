import express from 'express';

const app = express();

// route ง่าย ๆ
app.get('/', (req, res) => {
  res.send('Hello from Azure App Service ✅');
});

// ใช้พอร์ตที่ Azure กำหนด (PORT env) หรือ 3000 ถ้าทดสอบ local
const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});

import app from './src/app.js';
import dotenv from 'dotenv';
import { connectDB } from './src/config/db.js';

dotenv.config();

process.on('uncaughtException', err => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});

const port = process.env.PORT || 3000;
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`App running on port ${port} in ${process.env.NODE_ENV} mode...`);
});

// เชื่อม DB แบบ async หลังจาก server start แล้ว
connectDB()
  .then(() => console.log('DB connected'))
  .catch(err => console.error('DB connect failed:', err.message));

process.on('unhandledRejection', err => {
  console.error('UNHANDLED REJECTION! Shutting down...');
  console.error(err.name, err.message, err.stack);
  server.close(() => {
    process.exit(1);
  });
});

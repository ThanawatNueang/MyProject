// server.js หรือ index.js
import dotenv from 'dotenv';
dotenv.config();

import app from './src/app.js';
import { connectDB, pingDB } from './src/config/db.js';

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err);
  process.exit(1);
});

// 1) start server ก่อน เพื่อให้ Azure probe ผ่าน
const port = process.env.PORT || 3000;
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`App running on port ${port} in ${process.env.NODE_ENV || 'production'} mode...`);
});

// 2) health endpoints
app.get('/healthz', (_req, res) => res.status(200).send('ok'));
app.get('/db-health', async (_req, res) => {
  try {
    await pingDB();
    res.status(200).send('db:ok');
  } catch (e) {
    res.status(503).send('db:down');
  }
});

// 3) connect DB แบบ async + retry
const bootstrapDB = async () => {
  const maxRetries = Number(process.env.DB_MAX_RETRIES || 10);
  const baseDelayMs = Number(process.env.DB_RETRY_DELAY_MS || 1000); // 1s

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await connectDB();
      console.log('✅ Database connected');
      return;
    } catch (err) {
      const maskedHost = process.env.DB_HOST ? process.env.DB_HOST.replace(/\d+(?:\.\d+){3}/, '***.***.***.***') : '(unset)';
      console.error(`❌ DB connect failed (attempt ${attempt}/${maxRetries}) host=${maskedHost} err=${err.code || err.message}`);
      const backoff = Math.min(baseDelayMs * Math.pow(2, attempt - 1), 15000);
      await new Promise((r) => setTimeout(r, backoff));
    }
  }
  console.error('🛑 DB still unreachable after retries. App stays up, routes that need DB may fail with 503.');
};
bootstrapDB();

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION!', err);
  // อย่าปิดโปรเซสทันที ให้แอปยังรับ probe/ทราฟฟิกที่ไม่ต้อง DB ได้
});

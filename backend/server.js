// server.js
import express from "express";
import mysql from "mysql2/promise";

const app = express();
const PORT = process.env.PORT || 3000;

// ====== ENV ======
const {
  DB_HOST,
  DB_PORT = 3306,
  DB_USERNAME,
  DB_PASSWORD,
  DB_DATABASE,
} = process.env;

// ====== MySQL Pool ======
const pool = mysql.createPool({
  host: DB_HOST,                           // ae7fb7a25f-dbserver.mysql.database.azure.com
  port: Number(DB_PORT),
  user: DB_USERNAME,                       // ต้องเป็น username@servername
  password: DB_PASSWORD,
  database: DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  // Azure MySQL Flexible Server บังคับ TLS
  ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true },
  connectTimeout: 15000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
});

// ตรวจ DB ตอนสตาร์ท และมี health route ให้เช็ค
async function checkDb() {
  try {
    const [rows] = await pool.query("SELECT 1 AS ok");
    console.log("DB OK:", rows);
    return true;
  } catch (err) {
    // log รายละเอียดแบบปลอดภัย
    console.error("DB CONNECT FAILED", {
      name: err.name,
      code: err.code,          // เช่น ER_ACCESS_DENIED_ERROR, ETIMEDOUT, ENOTFOUND
      errno: err.errno,
      sqlState: err.sqlState,
      message: err.message,
      fatal: err.fatal,
    });
    return false;
  }
}

app.get("/health/db", async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT NOW() AS now");
    res.json({ ok: true, now: rows[0].now });
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: {
        code: err.code,
        errno: err.errno,
        sqlState: err.sqlState,
        message: err.message,
      },
      hint: "ดู code/message ข้างบนเพื่อไล่สาเหตุด้านล่าง",
    });
  }
});

app.get("/", (_req, res) => res.send("Server running"));

app.listen(PORT, async () => {
  console.log(`Server listening on :${PORT}`);
  await checkDb();
});

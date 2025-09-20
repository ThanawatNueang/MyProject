// server.js
import express from "express";
import dotenv from "dotenv";
import mysql from "mysql2";

dotenv.config();

const app = express();

// ⭐ สร้าง connection
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT || 3306,
  ssl: { rejectUnauthorized: true }
});


connection.connect((err) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
  } else {
    console.log("✅ Database connected!");
  }
});


app.get("/", (req, res) => {
  res.send("Hello from Azure ✅");
});


app.get("/test-db", (req, res) => {
  connection.query("SELECT NOW() AS now", (err, results) => {
    if (err) {
      console.error("❌ Query error:", err.message);
      return res.status(500).json({ error: "DB error" });
    }
    res.json(results);
  });
});

const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${port}`);
});

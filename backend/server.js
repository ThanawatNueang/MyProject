import express from "express";
import dotenv from "dotenv";
import { connectDB, pingDB } from "./src/config/database.js";

dotenv.config();

const app = express();

// ================== Routes ==================
app.get("/", (req, res) => {
  res.send("Hello from Azure ✅ + MySQL check");
});

app.get("/db-health", async (_req, res) => {
  try {
    await pingDB();
    res.status(200).send("db:ok");
  } catch (err) {
    res.status(503).send("db:down " + err.message);
  }
});

// ================== Start Server ==================
const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", async () => {
  console.log(`✅ Server running on port ${port}`);

  // ลอง connect DB ตอน start
  try {
    await connectDB();
  } catch (e) {
    console.error("❌ DB connection failed on startup:", e.message);
  }
});

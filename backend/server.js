import express from "express";

const app = express();

app.get("/", (req, res) => {
  res.send("Hello from Azure ✅");
});

const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${port}`);
});

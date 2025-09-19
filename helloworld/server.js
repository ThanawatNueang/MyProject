import express from "express";
const app = express();

app.get("/", (req, res) => {
  res.send("Hello World from Azure App Service!");
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}`));

import express from 'express';

const app = express();

app.get('/', (_req, res) => {
  res.send('Hello from Azure ✅');
});

// health endpoint สำหรับ probe
app.get('/healthz', (_req, res) => {
  res.status(200).send('ok');
});

const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${port}`);
});

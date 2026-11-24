import express from 'express';
import 'dotenv/config';
import { db } from './db.js';

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

app.get('/health', async (req, res) => {
  try {
    await db.one('SELECT 1 AS ok');
    res.status(200).json({ status: 'ok', database: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

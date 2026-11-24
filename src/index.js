import fs from 'node:fs';
import express from 'express';
import yaml from 'yaml';
import swaggerUi from 'swagger-ui-express';
import 'dotenv/config';
import { db } from './db.js';
import linksRouter from './routes/links.js';

const app = express();
const PORT = process.env.PORT || 8080;

// Завантаження специфікації OpenAPI як єдиного джерела правди
const openapiSpec = yaml.parse(fs.readFileSync('./openapi.yaml', 'utf8'));

app.use(express.json());

// Інтерактивна документація Swagger UI
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));

// Перевірка стану сервера та бази даних
app.get('/health', async (req, res) => {
  try {
    await db.one('SELECT 1 AS ok');
    res.status(200).json({ status: 'ok', database: 'connected' });
  } catch {
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});

// REST API керування посиланнями
app.use('/api/links', linksRouter);

// Перехід за коротким посиланням (302 Found + атомарний інкремент clicks)
app.get('/:code', async (req, res) => {
  const row = await db.oneOrNone(
    'UPDATE links SET clicks = clicks + 1 WHERE code = $1 RETURNING original_url',
    [req.params.code]
  );

  if (!row) {
    return res.status(404).json({
      error: {
        code: 'LINK_NOT_FOUND',
        message: 'Коротке посилання не знайдено',
      },
    });
  }

  res.redirect(302, row.original_url);
});

// Обробка невідомих маршрутів
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: 'Запитаний маршрут не існує',
    },
  });
});

// Глобальний обробник помилок (Express 5 автоматично передає сюди помилки з async-маршрутів)
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: {
        code: 'INVALID_JSON',
        message: 'Некоректний синтаксис JSON у тілі запиту',
      },
    });
  }

  console.error(err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Внутрішня помилка сервера',
    },
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

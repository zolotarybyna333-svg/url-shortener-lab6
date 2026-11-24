import { Router } from 'express';
import { db } from '../db.js';
import {
  isValidHttpUrl,
  isValidAlias,
  generateShortCode,
  formatLinkItem,
} from '../validators.js';

const router = Router();

// POST /api/links — створення короткого посилання
router.post('/', async (req, res) => {
  const { originalUrl, alias } = req.body ?? {};

  if (!isValidHttpUrl(originalUrl)) {
    return res.status(400).json({
      error: {
        code: 'INVALID_URL',
        message: 'Надана адреса має некоректний формат або непідтримуваний протокол (дозволено лише http/https)',
      },
    });
  }

  if (alias !== undefined) {
    if (!isValidAlias(alias)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_ALIAS',
          message: 'Alias має містити 3–32 символи (латинські літери, цифри, _ або -) та не бути зарезервованим словом',
        },
      });
    }

    try {
      const inserted = await db.one(
        'INSERT INTO links (code, original_url) VALUES ($1, $2) RETURNING *',
        [alias, originalUrl]
      );
      return res
        .status(201)
        .location(`/api/links/${inserted.code}`)
        .json(formatLinkItem(inserted));
    } catch (err) {
      if (err.code === '23505') {
        return res.status(409).json({
          error: {
            code: 'ALIAS_TAKEN',
            message: `Код '${alias}' уже використовується`,
          },
        });
      }
      throw err;
    }
  }

  // Автоматична генерація коду із захистом від випадкових колізій
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateShortCode(6);
    try {
      const inserted = await db.one(
        'INSERT INTO links (code, original_url) VALUES ($1, $2) RETURNING *',
        [code, originalUrl]
      );
      return res
        .status(201)
        .location(`/api/links/${inserted.code}`)
        .json(formatLinkItem(inserted));
    } catch (err) {
      if (err.code !== '23505') throw err;
    }
  }

  return res.status(500).json({
    error: {
      code: 'CODE_GENERATION_FAILED',
      message: 'Не вдалося згенерувати унікальний короткий код',
    },
  });
});

// GET /api/links — список усіх посилань
router.get('/', async (req, res) => {
  const rows = await db.any('SELECT * FROM links ORDER BY created_at DESC');
  res.status(200).json(rows.map(formatLinkItem));
});

// GET /api/links/:code — інформація про одне посилання
router.get('/:code', async (req, res) => {
  const row = await db.oneOrNone('SELECT * FROM links WHERE code = $1', [req.params.code]);
  if (!row) {
    return res.status(404).json({
      error: {
        code: 'LINK_NOT_FOUND',
        message: 'Посилання з вказаним кодом не знайдено',
      },
    });
  }
  res.status(200).json(formatLinkItem(row));
});

// PATCH /api/links/:code — зміна оригінальної адреси
router.patch('/:code', async (req, res) => {
  const { originalUrl } = req.body ?? {};

  if (!isValidHttpUrl(originalUrl)) {
    return res.status(400).json({
      error: {
        code: 'INVALID_URL',
        message: 'Надана нова адреса має некоректний формат або непідтримуваний протокол',
      },
    });
  }

  const updated = await db.oneOrNone(
    'UPDATE links SET original_url = $1 WHERE code = $2 RETURNING *',
    [originalUrl, req.params.code]
  );

  if (!updated) {
    return res.status(404).json({
      error: {
        code: 'LINK_NOT_FOUND',
        message: 'Посилання з вказаним кодом не знайдено',
      },
    });
  }

  res.status(200).json(formatLinkItem(updated));
});

// DELETE /api/links/:code — видалення посилання
router.delete('/:code', async (req, res) => {
  const result = await db.result('DELETE FROM links WHERE code = $1', [req.params.code]);
  if (result.rowCount === 0) {
    return res.status(404).json({
      error: {
        code: 'LINK_NOT_FOUND',
        message: 'Посилання з вказаним кодом не знайдено',
      },
    });
  }
  res.status(204).send();
});

export default router;

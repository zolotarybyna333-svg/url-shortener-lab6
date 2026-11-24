import crypto from 'node:crypto';

const ALIAS_REGEX = /^[a-zA-Z0-9_-]{3,32}$/;
const RESERVED_CODES = new Set(['api', 'docs', 'health']);

export function isValidHttpUrl(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return false;
  }
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function isValidAlias(value) {
  if (typeof value !== 'string') {
    return false;
  }
  if (!ALIAS_REGEX.test(value)) {
    return false;
  }
  return !RESERVED_CODES.has(value.toLowerCase());
}

export function generateShortCode(length = 6) {
  return crypto.randomBytes(length).toString('base64url').slice(0, length);
}

export function formatLinkItem(row) {
  const baseUrl = (process.env.BASE_URL || 'http://localhost:8080').replace(/\/$/, '');
  return {
    code: row.code,
    shortUrl: `${baseUrl}/${row.code}`,
    originalUrl: row.original_url,
    clicks: row.clicks,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

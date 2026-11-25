# URL Shortener REST API (Лабораторна робота №6)

Вебсервіс скорочення посилань, реалізований за підходом **Design-First** на базі **Node.js (Express 5)**, **PostgreSQL 17** та **Docker Compose**.

## Стек технологій
- **Runtime & Framework:** Node.js 22, Express 5
- **Database:** PostgreSQL 17 (`pg-promise`)
- **API Specification:** OpenAPI 3.0.3 (`openapi.yaml`), Swagger UI (`/docs`), Redocly CLI
- **Containerization:** Docker, Docker Compose

## Швидкий старт

1. Скопіюйте файл конфігурації середовища та за потреби змініть пароль БД:
   ```bash
   cp .env.sample .env
   ```

2. Запустіть сервіси у Docker:
   ```bash
   docker compose up --build -d
   ```

3. Перевірте стан роботи:
   - Health check: `http://localhost:8080/health`
   - Інтерактивна документація Swagger UI: `http://localhost:8080/docs`

## Основні ендпоінти
- `POST /api/links` — створення короткого посилання (автоматичний код або власний `alias`)
- `GET /api/links` — список усіх посилань
- `GET /api/links/:code` — деталі та статистика переходів
- `PATCH /api/links/:code` — оновлення цільової адреси
- `DELETE /api/links/:code` — видалення посилання
- `GET /:code` — перенаправлення (`302 Found`) з інкрементом лічильника переходів

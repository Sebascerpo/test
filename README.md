# Checkout Challenge - Fullstack

SPA + API for product checkout with resilient payment recovery flow.

## Tech Stack

- Frontend: React + Redux Toolkit + Vite
- Backend: NestJS + TypeScript
- Database: PostgreSQL + TypeORM

## Backend Architecture

Hexagonal (Ports & Adapters) structure:

- `domain`: entities and enums.
- `application`: use cases and ports.
- `infrastructure`: controllers, TypeORM entities/repositories, payment adapters.
- `shared`: ROP result helpers and cross-cutting utilities.

## Data Model (Backend)

Tables:

- `products`: catalog with `stock`.
- `customers`: buyer and delivery profile snapshot source.
- `transactions`: payment lifecycle (`PENDING`, `APPROVED`, `DECLINED`, `ERROR`).
- `deliveries`: internal assignment record per transaction (unique `transaction_id`).

### Relationships

- `transactions.product_id -> products.id`
- `transactions.customer_id -> customers.id`
- `deliveries.transaction_id -> transactions.id` (1:1 logical via unique)
- `deliveries.product_id -> products.id`
- `deliveries.customer_id -> customers.id`

## API Documentation

Swagger UI:

- `http://localhost:3002/api/docs`

Core endpoints:

- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/customers`
- `GET /api/customers/:id`
- `GET /api/customers/email/:email`
- `POST /api/payment/process`
- `GET /api/transactions`
- `GET /api/transactions/:id`
- `GET /api/transactions/reference/:reference`
- `GET /api/transactions/reference/:reference/sync`
- `GET /api/deliveries/:id`
- `GET /api/deliveries/transaction/:transactionReference`
- `PATCH /api/deliveries/:id/status`

## Payment Sequence (Required Flow)

1. Backend creates local `PENDING` transaction with a reference.
2. Backend calls provider APIs (tokenize card, payment source, transaction).
3. Backend finalizes transaction status.
4. Backend creates/updates delivery assignment when status is final.
5. Backend decrements stock only if transaction is `APPROVED`.
6. Frontend consumes final status and returns to product page with updated stock.

## Resilience / Recovery

- Idempotent `reference` support to avoid duplicate charges on retries/reloads.
- Sync endpoint returns `200` retryable states for transient visibility windows:
  - `transaction: null`, `retryable: true`, `reason: "NOT_FOUND_YET"`.

## Local Setup

### 1) Database

```bash
docker-compose up -d
```

### 2) Backend

```bash
cd backend
npm install
npm run start:dev
```

### 3) Frontend

```bash
cd frontend
npm install
npm run dev
```

## Tests

Backend:

```bash
cd backend
npm run test
npm run test:e2e
npm run test:cov
```

Coverage target:

- `>= 80%` (challenge requirement).

## Security Notes

- Helmet enabled.
- Input validation via global `ValidationPipe`.
- CORS allowlist configurable via `CORS_ORIGINS`.

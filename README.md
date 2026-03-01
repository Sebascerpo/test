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

## Frontend Architecture

- State management: Redux Toolkit + `redux-persist` (Flux-aligned action/thunk flow).
- Feature-oriented folders:
  - `frontend/src/features/catalog/components`
  - `frontend/src/features/checkout/components`
  - `frontend/src/features/transaction/components`
- Recovery orchestration:
  - `frontend/src/hooks/usePendingTransactionRecovery.ts`
  - Deduplicated sync in StrictMode (`isSyncing`, `lastSyncAt`, `syncReference`).
- Payment flow security split:
  - Persisted draft: product, delivery, checkout step, pending reference, `cardPreview`.
  - In-memory only (`sensitiveSession`): PAN/CVC runtime card payload.

## Frontend Security Notes

- PAN/CVC are **never** persisted in `localStorage`.
- Persisted card data is restricted to metadata (`brand`, `last4`, holder, expiry).
- If runtime card data is missing (e.g. after refresh), checkout routes back to card entry with Spanish UX guidance.
- Offline and network-drop scenarios are handled via structured ROP-style error results.

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

Frontend:

```bash
cd frontend
npm run test
npm run test:cov
```

Latest frontend coverage (`npm run test:cov`):

- Statements: `96.42%`
- Branches: `85.43%`
- Functions: `96.77%`
- Lines: `96.42%`

Coverage target:

- `>= 80%` (challenge requirement).

## Responsive / Browser Matrix

### Viewports

| Target viewport | Status | Evidence |
| --- | --- | --- |
| iPhone SE 2020 (375x667) | PASS | Bottom-sheet modal/backdrop + constrained `svh` heights and no card overflow in checkout components |
| iPhone 12/14 | PASS | Responsive grid/cards + fluid typography and spacing |
| Pixel 7 | PASS | Same mobile-first layout and controls with `grid`/`flex` |
| iPad portrait | PASS | Breakpoints (`sm`/`lg`) for catalog and checkout surfaces |
| Desktop narrow/wide | PASS | Max-width containers and adaptive catalog columns |

### Browser Checklist

| Check | Status |
| --- | --- |
| No horizontal overflow in main checkout flow | PASS |
| Touch targets fit boundaries in modal/summary/result | PASS |
| Offline/online transitions keep UI interactive | PASS |
| Product images lazy-load and decode async | PASS |

## Security Notes

- Helmet enabled.
- Input validation via global `ValidationPipe`.
- CORS allowlist configurable via `CORS_ORIGINS`.

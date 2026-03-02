# Checkout Challenge - Fullstack

SPA + API for product checkout with resilient payment recovery flow.

## Submission Links

- Public repository: `https://github.com/Sebascerpo/test`
- Frontend deployed URL: `PENDING_DEPLOYMENT_URL`
- Backend deployed URL: `PENDING_DEPLOYMENT_URL`
- Public API docs URL: `PENDING_DEPLOYMENT_URL/api/docs`

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

- `GET /api/app/config`
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

### 1) Full Stack (DB + Backend + Frontend)

```bash
docker compose up --build
```

Services:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3002`
- Swagger: `http://localhost:3002/api/docs`
- PostgreSQL: `localhost:5432`

### 2) Backend only (optional)

```bash
cd backend
npm install
npm run start:dev
```

### 3) Frontend only (optional)

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

Note: Frontend uses Jest + Testing Library (`jest-dom`) with thresholds `>= 80%`.

Latest frontend coverage (`npm run test:cov`):

- Statements: `98.16%`
- Branches: `83.01%`
- Functions: `94.28%`
- Lines: `98.16%`

Coverage target:

- `>= 80%` (challenge requirement).

## Responsive / Browser Matrix

Automated contract checks:

- `frontend/src/features/responsive/ResponsiveContracts.spec.tsx`

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

## Config & Seed Notes

- Backend is the source of truth for checkout config (`APP_CURRENCY`, `APP_BASE_FEE`, `APP_DELIVERY_FEE`).
- Frontend consumes runtime config via `GET /api/app/config` and falls back to `VITE_*` only if needed.
- Product seeder converges to 10 catalog products with image URLs, idempotently by product `name`.

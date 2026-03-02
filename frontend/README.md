# Frontend - Checkout SPA

Frontend web app for the checkout challenge, built with React + Redux Toolkit + Vite.

## Public URL

- Production: `https://d31hbsczosda21.cloudfront.net/`

## Stack

- React 19 + TypeScript
- Redux Toolkit + redux-persist
- Vite
- Tailwind CSS v4 + custom design tokens
- Framer Motion
- Jest + Testing Library + MSW

## What This Frontend Handles

- Product catalog browsing (mobile-first responsive UI).
- Checkout modal flow:
  - card info,
  - delivery info,
  - summary + pay.
- Disaster recovery scenarios:
  - state restore after reload before pay,
  - pending transaction recovery after reload,
  - offline detection and graceful UX.
- Final transaction result screen with status-based UI and controlled redirect.

## Architecture

Feature-oriented folders:

- `src/features/catalog/components`
- `src/features/checkout/components`
- `src/features/transaction/components`

Cross-cutting:

- `src/store/payment-store.ts`: Redux slice, async thunks, persistence.
- `src/hooks/usePendingTransactionRecovery.ts`: sync/polling recovery orchestration.
- `src/hooks/useNetworkStatus.ts`: online/offline browser events.
- `src/lib/payment-api.ts`: API integration with structured result contracts.
- `src/lib/app-config.ts`: runtime config fetch (`/api/app/config`) + fallback values.

## Checkout State Model (Security + Recovery)

Persisted in localStorage (`redux-persist` whitelist):

- selected product, quantity
- delivery info
- checkout step
- pending transaction reference + timestamps
- transaction result
- card preview metadata (`brand`, `last4`, holder, expiry)

Never persisted:

- raw PAN / CVC (kept only in in-memory runtime session)

Behavior:

- If runtime card data is missing (e.g. refresh), payment is blocked and user returns to card step.
- Pending references are synchronized on app load and polled until terminal status.

## Runtime Config

Primary source: backend endpoint

- `GET /api/app/config` -> `{ currency, baseFee, deliveryFee }`

Fallback (frontend only):

- `VITE_CURRENCY`
- `VITE_BASE_FEE`
- `VITE_DELIVERY_FEE`

Current local `.env` example:

```bash
VITE_CURRENCY=COP
VITE_BASE_FEE=2500
VITE_DELIVERY_FEE=5000
```

Create your local env file:

```bash
cp .env.template .env
```

## Local Development

From repository root (recommended, full stack):

```bash
docker compose up --build
```

Frontend-only:

```bash
cd frontend
npm install
npm run dev
```

App URL:

- `http://localhost:5173`

## Test Setup

Commands:

```bash
cd frontend
npm run test
npm run test:watch
npm run test:cov
```

Testing stack:

- Jest (`ts-jest`, ESM mode)
- `@testing-library/react` + `@testing-library/jest-dom`
- MSW (`msw/node`) for API mocking

Key test infra files:

- `jest.config.cjs`
- `src/test/jest.environment.cjs` (injects fetch/Response APIs into jsdom)
- `src/test/bootstrap.ts` (polyfills: streams, BroadcastChannel, storage, RAF)
- `src/test/setup.ts` (MSW lifecycle, fetch wrapping, cleanup)

Coverage thresholds (enforced in Jest config):

- statements >= 80
- branches >= 80
- functions >= 80
- lines >= 80

Latest frontend test/coverage run (`npm run test:cov`, March 2, 2026):

- Test suites: `14 passed, 14 total`
- Tests: `63 passed, 63 total`
- Statements: `98.39%`
- Branches: `84.65%`
- Functions: `97.56%`
- Lines: `98.39%`

## UX / Compliance Notes

- Mobile-first design with responsive behavior focused on iPhone SE baseline.
- Redux/Flux-aligned flow with resilient persistence and rehydration.
- Spanish UX copy for checkout feedback and transaction states.
- Status-driven toasts and result states (pending/approved/declined/error).

## Troubleshooting

If tests fail with web API errors like `Response is not defined`:

1. Ensure Jest uses `src/test/jest.environment.cjs` as `testEnvironment`.
2. Ensure `setupFiles` includes `src/test/bootstrap.ts`.
3. Ensure `setupFilesAfterEnv` includes `src/test/setup.ts`.
4. Reinstall deps:

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

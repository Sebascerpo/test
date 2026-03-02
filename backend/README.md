# Backend API

NestJS API for resilient checkout flow.

## Docker Compose

Use root-level compose from repository root:

```bash
cp backend/.env.template backend/.env
docker compose up --build
```

## Run

```bash
cp .env.template .env
npm install
npm run start:dev
```

## Build

```bash
npm run build
```

## Test

```bash
npm run test
npm run test:e2e
npm run test:cov
```

Latest coverage (`npm run test:cov` on March 2, 2026):

- Statements: `98.96%`
- Branches: `92.72%`
- Functions: `100%`
- Lines: `98.87%`

## Docs

- Swagger (public): `https://d31hbsczosda21.cloudfront.net/api/docs`
- Swagger (local): `http://localhost:3002/api/docs`

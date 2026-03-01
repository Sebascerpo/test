# Payment Integration Challenge

This project is a FullStack application designed to integrate with a payment gateway.

## Structure

- `backend/`: NestJS API following Hexagonal Architecture.
- `frontend/`: React + TypeScript SPA (Vite).
- `docker-compose.yml`: Infrastructure for local development (PostgreSQL).

## Getting Started

### Prerequisites

- Node.js (v18+)
- Docker & Docker Compose

### Running the Database

```bash
docker-compose up -d
```

### Running the Backend

```bash
cd backend
npm install
npm run start:dev
```

### Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

## Requirements

- NestJS + TypeScript
- React + TypeScript
- PostgreSQL
- Hexagonal Architecture
- Unit Testing (>80% coverage)

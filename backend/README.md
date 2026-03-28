# Backend

NestJS API for the AI Agriculture Doctor System with Prisma and PostgreSQL.

## Environment

Create `backend/.env` from `backend/.env.example` and set:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5434/agri_doctor?schema=public"
JWT_SECRET=change-me
FRONTEND_ORIGIN=http://localhost:5173
PUBLIC_API_URL=http://localhost:3000
UPLOAD_DIR=uploads
DEMO_USER_EMAIL=farmer@example.com
DEMO_USER_PASSWORD=farmer123
DEMO_ADMIN_EMAIL=admin@example.com
DEMO_ADMIN_PASSWORD=admin1234
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5-mini
```

## Setup

```bash
npm run db:up
npm run db:ps
npm install
npm run prisma:generate
npm run prisma:migrate
```

## Run

```bash
npm run start:dev
```

## Run In Docker

From the repo root:

```bash
npm run app:up
```

The backend container runs migrations on startup and is exposed on `http://localhost:3002`.

## Test

```bash
npm run build
npm run test
npm run test:e2e
```

## Notes

- Prisma now expects PostgreSQL through `DATABASE_URL`.
- Prisma migrations live in `backend/prisma/migrations`.
- The app seeds a demo farmer and demo admin account on startup if they do not already exist.
- If `OPENAI_API_KEY` is empty, the system falls back to the local mock diagnosis flow.
- The repo root includes `docker-compose.yml` for local PostgreSQL startup.
- Old SQLite artifacts like `backend/dev.db` and `backend/data/diagnoses.json` are no longer used.
- `GET /` returns a health payload instead of the default Nest starter response.
- `GET /users` and `POST /users/staff` are admin-only routes.
- Uploaded files are stored locally in `backend/uploads` and served from `/uploads/...` in development.
- Critical environment variables are validated on startup so invalid deployment config fails early.
- `backend/Dockerfile` packages the API for production-style container deployment.

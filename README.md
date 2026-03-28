# AI Agriculture Doctor System

Full-stack crop diagnosis workflow with a React frontend, NestJS backend, Prisma ORM, and PostgreSQL persistence.

## Current status

- Frontend: upload crop image, choose crop, view diagnosis result, review history, and see dashboard metrics
- Backend: validated auth, crop, upload, and diagnosis endpoints with Prisma-backed persistence
- AI logic: provider integration hook is present, with a local fallback diagnosis flow when `OPENAI_API_KEY` is not set

## API checks

- `GET /` returns a health payload for the API
- `GET /crops` returns the crop catalog
- `POST /auth/login` signs in the demo farmer
- `POST /auth/register` creates a new farmer account
- `GET /users/me` returns the protected user profile
- `GET /users` lists users for admins only
- `POST /users/staff` creates agronomist/admin staff users for admins only
- `POST /upload` stores a crop image and returns a stable public file URL
- `POST /diagnosis` creates a diagnosis record
- `GET /diagnosis/history` returns saved diagnoses for the signed-in user

## Run locally

### Start PostgreSQL

```bash
npm run db:up
npm run db:ps
```

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate
npm run start:dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` and backend runs on `http://localhost:3000`.

To stop the local database:

```bash
npm run db:down
```

## Run With Docker

Bring up the full stack:

```bash
npm run app:up
```

Services:

- Frontend: `http://localhost:8081`
- Backend: `http://localhost:3002`
- PostgreSQL: `localhost:5434`

View logs:

```bash
npm run app:logs
```

Stop the stack:

```bash
npm run app:down
```

## Verify

Backend:

```bash
cd backend
npm run build
npm run test
npm run test:e2e
```

Frontend:

```bash
cd frontend
npm run build
npm run lint
```

## Environment

Backend `.env` values:

- `PORT`
- `DATABASE_URL`
- `JWT_SECRET`
- `FRONTEND_ORIGIN`
- `PUBLIC_API_URL`
- `UPLOAD_DIR`
- `DEMO_USER_EMAIL`
- `DEMO_USER_PASSWORD`
- `DEMO_ADMIN_EMAIL`
- `DEMO_ADMIN_PASSWORD`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`

Example PostgreSQL connection string:

```env
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5434/agri_doctor?schema=public"
FRONTEND_ORIGIN=http://localhost:5173
PUBLIC_API_URL=http://localhost:3000
UPLOAD_DIR=uploads
```

The included `docker-compose.yml` starts a matching local PostgreSQL instance on port `5434`.
Old SQLite artifacts like `backend/dev.db` and `backend/data/diagnoses.json` are no longer used by the app.
Uploaded images are stored locally in `backend/uploads` and served back from `/uploads/...` during development.
The backend now validates critical environment variables on startup and will fail fast on invalid deployment config.
The repository also includes backend/frontend Dockerfiles and a full-stack `docker-compose.yml` for containerized deployment.

Demo accounts:

- Farmer: `farmer@example.com` / `farmer123`
- Admin: `admin@example.com` / `admin1234`

## What is intentionally deferred

- Final production AI prompting and diagnosis tuning
- Production-grade object storage for uploads beyond local development storage
- Password reset and account recovery flows

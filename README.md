# AI Agriculture Doctor System

Full-stack crop diagnosis workflow with a completed application shell and an AI-ready backend interface.

## Current status

- Frontend: upload crop image, choose crop, view diagnosis result, review history, and see dashboard metrics
- Backend: validated upload/diagnosis endpoints, persistent diagnosis history in `backend/data/diagnoses.json`, crop catalog, and AI service interface
- AI logic: provider integration hook is present, but the diagnosis intelligence can still evolve later without changing the frontend contract

## Run locally

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run start:dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` and backend runs on `http://localhost:3000`.

## Environment

Backend `.env` values:

- `PORT`
- `JWT_SECRET`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`

If `OPENAI_API_KEY` is not set, the app still works through the local fallback diagnosis flow.

## What is intentionally deferred

- Final production AI prompting / diagnosis logic
- Database-backed persistence
- Authentication and role-aware access control

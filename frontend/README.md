# Frontend

React + Vite frontend for the AI Agriculture Doctor UI.

## Structure

- `public/` static assets (`favicon.ico`, template `index.html`)
- `src/app/` application shell and hash-based router
- `src/pages/` feature pages
- `src/components/` reusable UI components
- `src/services/` API service wrappers
- `src/assets/` static frontend assets

## Run

```bash
npm install
npm run dev
```

## Run In Docker

From the repo root:

```bash
npm run app:up
```

The frontend container is served by Nginx on `http://localhost:8081`.

## Verify

```bash
npm run build
npm run lint
```

## Notes

- `frontend/Dockerfile` builds the Vite app and serves it with Nginx.
- `VITE_API_BASE_URL` can be set at image build time for deployment environments. In the provided compose setup it points to `http://localhost:3002`.

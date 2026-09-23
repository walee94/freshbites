# FreshBites deployment

The frontend is deployed to Vercel, the API to Render, and PostgreSQL to Neon.

## 1. Neon

Create a Neon project and copy its PostgreSQL connection string. Keep it private.

## 2. Render backend

- Repository: `walee94/freshbites`
- Root directory: `backend`
- Build command: `npm install && npm run build`
- Start command: `npm start`
- Health check: `/api/health`

Environment variables:

```text
DATABASE_URL=<Neon PostgreSQL connection string>
FRONTEND_URL=<Vercel frontend URL, added after frontend deployment>
NODE_ENV=production
```

Render supplies `PORT` automatically.

## 3. Vercel frontend

- Repository: `walee94/freshbites`
- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`

Environment variable:

```text
VITE_API_URL=https://<your-render-service>.onrender.com
```

Redeploy the frontend after changing `VITE_API_URL`. Then add the final Vercel URL to Render as `FRONTEND_URL` and redeploy the backend.

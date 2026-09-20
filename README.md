# NEXVORA AI

Production-oriented full-stack SaaS application for AI resume analysis, ATS scoring, interview preparation, coding practice, career roadmaps, and a voice-enabled AI assistant.

## Stack

- React, TypeScript, Tailwind CSS, Framer Motion, Three.js, Recharts
- Node.js, Express, TypeScript
- PostgreSQL with Prisma
- JWT auth plus Google OAuth token verification endpoint
- OpenAI integration with deterministic local fallbacks
- Optional Cloudinary upload storage

## Quick Start

```bash
npm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
npm run db:generate
npm run dev
```

Frontend: `http://localhost:5173`

Backend: `http://localhost:8080`

For PostgreSQL persistence, set `DATABASE_URL` in `apps/api/.env`, then run:

```bash
npm run db:migrate
```

Without a configured database, the API runs with an in-memory development store so the app remains usable.

## Deployment

- Deploy `apps/web` to Vercel.
- Deploy `apps/api` to Railway or Render.
- Configure the environment variables from each `.env.example`.

# Hackathon Platform

Admin-managed hackathon scoring with live public leaderboards. Built with Next.js (App Router) + Neon Postgres, deployed on Vercel.

- Admins create hackathons, teams, tasks/challenges, and award points (task completions or ad hoc awards with a description).
- Every point change is logged in an activity history per team.
- Each hackathon has a unique public UUID link showing a live leaderboard that auto-refreshes (default every 30s, no page reload), optimized for full-screen display, with light/dark mode. Click a team to see its full point history with timestamps.

## Setup

### 1. Database (Neon Postgres)

1. In Vercel, open your project → **Storage** → **Create Database Store** → **Neon** (Marketplace integration) and connect it to your Neon project. Vercel injects `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED` automatically at runtime.
2. Apply the schema once against your Neon database:

   ```bash
   psql "$DATABASE_URL_UNPOOLED" -f schema.sql
   # or: npm run db:setup
   ```

   (Get `DATABASE_URL_UNPOOLED` from the Neon dashboard → your project → **Connect** → direct connection string.)

### 2. Environment variables

Copy `.env.example` to `.env.local` for local development, and set the following in Vercel → **Settings → Environment Variables**:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon **pooled** connection string (auto-set by the Marketplace integration) |
| `DATABASE_URL_UNPOOLED` | Neon direct connection string, used only for applying `schema.sql` |
| `ADMIN_PASSWORD` | Shared admin password for `/admin/login` |
| `JWT_SECRET` | Secret for signing the admin session JWT (`openssl rand -base64 32`) |
| `LEADERBOARD_REFRESH_MS` | Optional. Leaderboard auto-refresh interval in ms (default `30000`) |

### 3. Run locally

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`, go to `/admin/login`, and log in with `ADMIN_PASSWORD`.

### 4. Deploy

Push to `main` — Vercel deploys automatically. Make sure the env vars above are set in the Vercel project.

## Usage

1. Log in at `/admin/login` and create a hackathon.
2. Add teams and tasks/challenges with point values.
3. Mark tasks complete for teams or award ad hoc points (with a required description). Every award is logged in the activity history.
4. Set the hackathon status to **active** and share its public link (`/h/<uuid>`, shown on the admin page).
5. The public leaderboard auto-refreshes every 30s (configurable), works great on a full-screen display, and clicking a team opens its detailed point history.

## Auth model

- Single shared password (`ADMIN_PASSWORD`) → JWT session cookie (HttpOnly, SameSite=Lax, 7-day expiry), signed with `JWT_SECRET`.
- `proxy.ts` guards all `/admin` routes; every write server action additionally calls `requireAdmin()` (defense in depth).

## Tech notes

- Scores are derived from the unified `point_events` log: cumulative points = `SUM(points)` per team; the leaderboard ranks by that total (tie-break: team name A→Z).
- Task completions are unique per (team, task); deleting a point event removes the linked achievement via cascade.
- Only hackathons with status `active` are publicly visible (admins can preview drafts).

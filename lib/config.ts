export const LEADERBOARD_REFRESH_INTERVAL_MS = Number(
  process.env.LEADERBOARD_REFRESH_MS ?? 30_000
);

export const SESSION_COOKIE = "hackathon_admin_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

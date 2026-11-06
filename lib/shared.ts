export function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export type LeaderboardEntry = {
  id: string;
  name: string;
  total: number;
};

export type TeamEvent = {
  id: string;
  type: "task_completion" | "adhoc";
  points: number;
  description: string;
  task_title: string | null;
  note: string | null;
  created_at: string;
};

export type TeamDetail = {
  id: string;
  name: string;
  description: string;
  total: number;
  events: TeamEvent[];
};

export type LeaderboardData = {
  name: string;
  updatedAt: string;
  teams: LeaderboardEntry[];
};

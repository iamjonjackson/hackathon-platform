"use client";

import { useCallback, useEffect, useState } from "react";
import type { LeaderboardData, TeamDetail } from "@/lib/shared";
import { formatTimestamp } from "@/lib/shared";
import TeamOverlay from "./TeamOverlay";
import ThemeToggle from "./ThemeToggle";

const medal = ["🥇", "🥈", "🥉"];

export default function Leaderboard({
  uuid,
  initialName,
  initialTeams,
  refreshIntervalMs,
}: {
  uuid: string;
  initialName: string;
  initialTeams: LeaderboardData["teams"];
  refreshIntervalMs: number;
}) {
  const [name, setName] = useState(initialName);
  const [teams, setTeams] = useState(initialTeams);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [teamDetail, setTeamDetail] = useState<TeamDetail | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/hackathons/${uuid}/leaderboard`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data: LeaderboardData = await res.json();
      setName(data.name);
      setTeams(data.teams);
      setUpdatedAt(data.updatedAt);
    } catch {
      // keep showing last known data
    }
  }, [uuid]);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, refreshIntervalMs);
    return () => clearInterval(timer);
  }, [refresh, refreshIntervalMs]);

  useEffect(() => {
    if (!selectedTeam) {
      setTeamDetail(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/hackathons/${uuid}/teams/${selectedTeam}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: TeamDetail | null) => {
        if (!cancelled) setTeamDetail(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [selectedTeam, uuid]);

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <div className="flex items-center justify-between px-6 py-4 lg:px-12">
        <h1 className="text-2xl font-bold lg:text-4xl">🏆 {name}</h1>
        <div className="flex items-center gap-4">
          <span className="text-xs text-neutral-500 dark:text-neutral-400 lg:text-sm">
            {updatedAt ? `Updated ${formatTimestamp(updatedAt)}` : "Loading…"}
          </span>
          <ThemeToggle />
        </div>
      </div>

      <main className="flex flex-1 flex-col px-6 pb-6 lg:px-12 lg:pb-12">
        {teams.length === 0 ? (
          <p className="mt-12 text-center text-neutral-500 dark:text-neutral-400">
            No teams yet.
          </p>
        ) : (
          <ol className="flex flex-1 flex-col justify-center gap-2 lg:gap-4">
            {teams.map((team, index) => (
              <li key={team.id}>
                <button
                  type="button"
                  onClick={() => setSelectedTeam(team.id)}
                  className="flex w-full items-center gap-4 rounded-2xl border border-neutral-200 bg-white px-5 py-4 text-left shadow-sm transition hover:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-500 lg:gap-8 lg:rounded-3xl lg:px-10 lg:py-7"
                >
                  <span className="w-10 shrink-0 text-center text-xl font-bold tabular-nums lg:w-16 lg:text-4xl">
                    {medal[index] ?? index + 1}
                  </span>
                  <span className="flex-1 truncate text-xl font-semibold lg:text-4xl">
                    {team.name}
                  </span>
                  <span className="text-2xl font-bold tabular-nums lg:text-5xl">
                    {team.total}
                    <span className="ml-1 text-sm font-normal text-neutral-500 lg:text-lg dark:text-neutral-400">
                      pts
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        )}
      </main>

      {selectedTeam && (
        <TeamOverlay
          detail={teamDetail}
          onClose={() => setSelectedTeam(null)}
        />
      )}
    </div>
  );
}

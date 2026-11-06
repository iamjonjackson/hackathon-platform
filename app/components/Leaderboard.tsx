"use client";

import { useCallback, useEffect, useState } from "react";
import type { LeaderboardData, TaskSummary, TeamDetail } from "@/lib/shared";
import { formatTimestamp } from "@/lib/shared";
import TeamOverlay from "./TeamOverlay";
import ThemeToggle from "./ThemeToggle";

const medal = ["🥇", "🥈", "🥉"];

const URL_PATTERN = /(https?:\/\/[^\s<>"]+)/g;

function renderTextWithLinks(text: string) {
  return text.split(URL_PATTERN).map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="underline"
      >
        {part}
      </a>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export default function Leaderboard({
  uuid,
  initialName,
  initialDescription,
  initialTeams,
  refreshIntervalMs,
}: {
  uuid: string;
  initialName: string;
  initialDescription: string;
  initialTeams: LeaderboardData["teams"];
  refreshIntervalMs: number;
}) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [teams, setTeams] = useState(initialTeams);
  const [tasks, setTasks] = useState<TaskSummary[]>([]);
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
      setDescription(data.description);
      setTeams(data.teams);
      setTasks(data.tasks);
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
        <div className="min-w-0">
          <h1 className="text-2xl font-bold lg:text-4xl">🏆 {name}</h1>
          {description && (
            <p className="mt-1 max-w-4xl text-sm text-neutral-600 lg:text-base dark:text-neutral-300">
              {renderTextWithLinks(description)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-neutral-500 dark:text-neutral-400 lg:text-sm">
            {updatedAt ? `Updated ${formatTimestamp(updatedAt)}` : "Loading…"}
          </span>
          <ThemeToggle />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 gap-6 px-6 pb-6 lg:gap-10 lg:px-12 lg:pb-12">
        <main className="flex min-w-0 flex-1 flex-col">
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

        <aside className="hidden w-1/5 min-w-56 shrink-0 flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm md:flex dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="border-b border-neutral-200 px-4 py-3 text-sm font-bold uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
            Tasks to claim
          </h2>
          <div className="flex-1 overflow-y-auto p-3">
            {tasks.length === 0 ? (
              <p className="py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
                No tasks yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {tasks.map((task) => (
                  <li
                    key={task.id}
                    className="rounded-xl border border-neutral-200 px-3 py-2 dark:border-neutral-800"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-semibold">
                        {task.title}
                      </span>
                      <span className="shrink-0 text-sm font-bold tabular-nums">
                        {task.points > 0 ? `+${task.points}` : "various"}
                      </span>
                    </div>
                    {task.description && (
                      <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                        {task.description}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>

      {selectedTeam && (
        <TeamOverlay
          detail={teamDetail}
          onClose={() => setSelectedTeam(null)}
        />
      )}
    </div>
  );
}

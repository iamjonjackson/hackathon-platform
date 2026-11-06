"use client";

import { useState } from "react";
import { formatTimestamp } from "@/lib/shared";

export type AdminTaskOption = { id: string; title: string; points: number };
export type AdminTeamEvent = {
  id: string;
  type: string;
  points: number;
  description: string;
  created_at: string;
};
export type AdminTeam = {
  id: string;
  name: string;
  description: string;
  total: number;
  events: AdminTeamEvent[];
};
type ServerAction = (formData: FormData) => void | Promise<void>;

const inputClass =
  "rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700";
const smallButtonClass =
  "rounded-md border border-neutral-300 px-2 py-1 text-xs font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800";
const sectionCardClass =
  "rounded-xl border border-neutral-200 p-4 dark:border-neutral-800";

function EventList({
  team,
  hackathonId,
  deletePointEvent,
}: {
  team: AdminTeam;
  hackathonId: string;
  deletePointEvent: ServerAction;
}) {
  if (team.events.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
        No point history yet.
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {team.events.map((e) => (
        <li
          key={e.id}
          className="flex items-start justify-between gap-4 rounded-xl border border-neutral-200 px-4 py-3 dark:border-neutral-800"
        >
          <div>
            <div className="font-medium">{e.description}</div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              {formatTimestamp(e.created_at)} ·{" "}
              {e.type === "task_completion" ? "Task completion" : "Ad hoc award"}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span
              className={`font-bold tabular-nums ${
                e.points >= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {e.points > 0 ? `+${e.points}` : e.points}
            </span>
            <form action={deletePointEvent}>
              <input type="hidden" name="id" value={e.id} />
              <input type="hidden" name="hackathonId" value={hackathonId} />
              <button className="text-xs text-red-600 hover:underline dark:text-red-400">
                remove
              </button>
            </form>
          </div>
        </li>
      ))}
    </ul>
  );
}

function TeamModal({
  team,
  tasks,
  hackathonId,
  actions,
  onClose,
}: {
  team: AdminTeam;
  tasks: AdminTaskOption[];
  hackathonId: string;
  actions: {
    updateTeam: ServerAction;
    deleteTeam: ServerAction;
    completeTask: ServerAction;
    awardAdhocPoints: ServerAction;
    deletePointEvent: ServerAction;
  };
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
          <div>
            <h2 className="text-xl font-bold">{team.name}</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {team.total} points
              {team.description ? ` · ${team.description}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            ✕
          </button>
        </div>
        <div className="space-y-6 overflow-y-auto px-6 py-4">
          <section className={sectionCardClass}>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Edit team
            </h3>
            <form action={actions.updateTeam} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="id" value={team.id} />
              <input type="hidden" name="hackathonId" value={hackathonId} />
              <input
                name="name"
                defaultValue={team.name}
                required
                className={`flex-1 min-w-32 ${inputClass}`}
              />
              <input
                name="description"
                defaultValue={team.description}
                placeholder="Description"
                className={`flex-1 min-w-32 ${inputClass}`}
              />
              <button className={smallButtonClass}>Save team</button>
            </form>
          </section>

          <section className={sectionCardClass}>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Complete a task
            </h3>
            <form action={actions.completeTask} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="hackathonId" value={hackathonId} />
              <input type="hidden" name="teamId" value={team.id} />
              <select name="taskId" required className={`flex-1 min-w-32 ${inputClass}`}>
                <option value="">Select task…</option>
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} (+{t.points})
                  </option>
                ))}
              </select>
              <input
                name="note"
                placeholder="Note (optional)"
                className={`flex-1 min-w-32 ${inputClass}`}
              />
              <button className={smallButtonClass}>Complete task</button>
            </form>
          </section>

          <section className={sectionCardClass}>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Award ad hoc points
            </h3>
            <form action={actions.awardAdhocPoints} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="hackathonId" value={hackathonId} />
              <input type="hidden" name="teamId" value={team.id} />
              <input
                name="points"
                type="number"
                placeholder="±pts"
                required
                className={`w-20 ${inputClass}`}
              />
              <input
                name="description"
                placeholder="Reason (required)"
                required
                className={`flex-1 min-w-32 ${inputClass}`}
              />
              <button className={smallButtonClass}>Award points</button>
            </form>
          </section>

          <section className={sectionCardClass}>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Point history
            </h3>
            <EventList
              team={team}
              hackathonId={hackathonId}
              deletePointEvent={actions.deletePointEvent}
            />
          </section>

          <section className="rounded-xl border border-red-300 p-4 dark:border-red-900">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-red-600 dark:text-red-400">
              Danger zone
            </h3>
            <form action={actions.deleteTeam}>
              <input type="hidden" name="id" value={team.id} />
              <input type="hidden" name="hackathonId" value={hackathonId} />
              <button className="rounded-md border border-red-300 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950">
                Delete team
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function AdminTeamsPanel({
  teams,
  tasks,
  hackathonId,
  actions,
}: {
  teams: AdminTeam[];
  tasks: AdminTaskOption[];
  hackathonId: string;
  actions: {
    updateTeam: ServerAction;
    deleteTeam: ServerAction;
    completeTask: ServerAction;
    awardAdhocPoints: ServerAction;
    deletePointEvent: ServerAction;
  };
}) {
  const [openTeamId, setOpenTeamId] = useState<string | null>(null);
  const openTeam = teams.find((t) => t.id === openTeamId) ?? null;

  return (
    <div className="space-y-2">
      {teams.length === 0 && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          No teams yet.
        </p>
      )}
      {teams.map((team, i) => (
        <button
          key={team.id}
          type="button"
          onClick={() => setOpenTeamId(team.id)}
          className="flex w-full items-center gap-3 rounded-xl border border-neutral-200 px-4 py-2 text-left text-sm hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-800"
        >
          <span className="w-6 shrink-0 text-neutral-500 tabular-nums dark:text-neutral-400">
            {i + 1}
          </span>
          <span className="flex-1 truncate font-medium">{team.name}</span>
          {team.description && (
            <span className="hidden flex-1 truncate text-neutral-500 sm:block dark:text-neutral-400">
              {team.description}
            </span>
          )}
          <span className="shrink-0 font-bold tabular-nums">{team.total} pts</span>
          <span className={smallButtonClass}>Manage</span>
        </button>
      ))}
      {openTeam && (
        <TeamModal
          team={openTeam}
          tasks={tasks}
          hackathonId={hackathonId}
          actions={actions}
          onClose={() => setOpenTeamId(null)}
        />
      )}
    </div>
  );
}

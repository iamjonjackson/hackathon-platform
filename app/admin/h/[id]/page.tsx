import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { query, queryOne } from "@/lib/db";
import { formatTimestamp } from "@/lib/shared";
import AdminTeamsPanel, {
  type AdminTeam,
} from "@/app/components/AdminTeamsPanel";
import ConfirmSubmit from "@/app/components/ConfirmSubmit";
import {
  awardAdhocPoints,
  completeTask,
  createTask,
  createTeam,
  deleteHackathon,
  deletePointEvent,
  deleteTask,
  deleteTeam,
  regeneratePublicLink,
  updateHackathon,
  updateTask,
  updateTeam,
} from "../../actions";

export const dynamic = "force-dynamic";

type Hackathon = {
  id: string;
  name: string;
  description: string;
  public_uuid: string;
  status: string;
};
type Team = { id: string; name: string; description: string; total: number };
type Task = {
  id: string;
  title: string;
  description: string;
  points: number;
  active: boolean;
};
type Event = {
  id: string;
  team_id: string;
  team_name: string;
  type: string;
  points: number;
  description: string;
  task_title: string | null;
  note: string | null;
  created_at: string;
};

const inputClass =
  "rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700";
const buttonClass =
  "rounded-lg bg-neutral-900 px-3 py-2 text-sm font-semibold text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200";
const smallButtonClass =
  "rounded-md border border-neutral-300 px-2 py-1 text-xs font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800";

export default async function HackathonAdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const hackathon = await queryOne<Hackathon>(
    "SELECT id, name, description, public_uuid, status FROM hackathons WHERE id = $1",
    [id]
  );
  if (!hackathon) notFound();

  const teams = await query<Team>(
    `SELECT t.id, t.name, t.description,
            COALESCE((SELECT sum(pe.points) FROM point_events pe WHERE pe.team_id = t.id), 0)::int AS total
     FROM teams t WHERE t.hackathon_id = $1 ORDER BY t.name`,
    [id]
  );
  const tasks = await query<Task>(
    "SELECT id, title, description, points, active FROM tasks WHERE hackathon_id = $1 ORDER BY created_at",
    [id]
  );
  const allEvents = await query<Event>(
    `SELECT pe.id, pe.team_id, t.name AS team_name, pe.type, pe.points, pe.description,
            tk.title AS task_title, a.note, pe.created_at
     FROM point_events pe
     JOIN teams t ON t.id = pe.team_id
     LEFT JOIN achievements a ON a.point_event_id = pe.id
     LEFT JOIN tasks tk ON tk.id = a.task_id
     WHERE pe.hackathon_id = $1 ORDER BY pe.created_at DESC`,
    [id]
  );
  const events = allEvents.slice(0, 50);
  const eventsByTeam = new Map<string, AdminTeam["events"]>();
  for (const e of allEvents) {
    const list = eventsByTeam.get(e.team_id) ?? [];
    list.push({
      id: e.id,
      type: e.type,
      points: e.points,
      description: e.description,
      task_title: e.task_title,
      note: e.note,
      created_at: e.created_at,
    });
    eventsByTeam.set(e.team_id, list);
  }
  const adminTeams: AdminTeam[] = teams.map((team) => ({
    ...team,
    events: eventsByTeam.get(team.id) ?? [],
  }));

  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3000";
  const publicUrl = `${proto}://${host}/h/${hackathon.public_uuid}`;

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{hackathon.name}</h1>
          <span className="rounded-full bg-neutral-200 px-3 py-1 text-xs font-semibold uppercase dark:bg-neutral-800">
            {hackathon.status}
          </span>
        </div>
        <form action={updateHackathon} className="flex flex-wrap items-start gap-3">
          <input type="hidden" name="id" value={hackathon.id} />
          <input
            name="name"
            defaultValue={hackathon.name}
            required
            className={`flex-1 min-w-48 ${inputClass}`}
          />
          <input
            name="description"
            defaultValue={hackathon.description}
            placeholder="Description"
            className={`flex-1 min-w-48 ${inputClass}`}
          />
          <select name="status" defaultValue={hackathon.status} className={inputClass}>
            <option value="draft">draft</option>
            <option value="active">active</option>
            <option value="archived">archived</option>
          </select>
          <button type="submit" className={buttonClass}>
            Save
          </button>
        </form>
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-neutral-200 p-3 text-sm dark:border-neutral-800">
          <span className="mr-auto truncate">
            Public link:{" "}
            <Link href={`/h/${hackathon.public_uuid}`} className="font-mono underline">
              {publicUrl}
            </Link>
          </span>
          <form action={regeneratePublicLink}>
            <input type="hidden" name="id" value={hackathon.id} />
            <button className={smallButtonClass}>Regenerate link</button>
          </form>
          <form action={deleteHackathon}>
            <input type="hidden" name="id" value={hackathon.id} />
            <ConfirmSubmit
              className="rounded-md border border-red-300 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
              message={`Delete hackathon "${hackathon.name}" and all of its teams, tasks, and point history? This cannot be undone.`}
            >
              Delete hackathon
            </ConfirmSubmit>
          </form>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold">Teams</h2>
        <form action={createTeam} className="flex flex-wrap items-start gap-3">
          <input type="hidden" name="hackathonId" value={hackathon.id} />
          <input name="name" placeholder="Team name" required className={inputClass} />
          <input
            name="description"
            placeholder="Description (optional)"
            className={`flex-1 min-w-48 ${inputClass}`}
          />
          <button type="submit" className={buttonClass}>
            Add team
          </button>
        </form>
        <AdminTeamsPanel
          teams={adminTeams}
          tasks={tasks
            .filter((t) => t.active)
            .map((t) => ({ id: t.id, title: t.title, points: t.points }))}
          hackathonId={hackathon.id}
          actions={{
            updateTeam,
            deleteTeam,
            completeTask,
            awardAdhocPoints,
            deletePointEvent,
          }}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold">Tasks / Challenges</h2>
        <form action={createTask} className="flex flex-wrap items-start gap-3">
          <input type="hidden" name="hackathonId" value={hackathon.id} />
          <input name="title" placeholder="Task title" required className={inputClass} />
          <input
            name="description"
            placeholder="Description (optional)"
            className={`flex-1 min-w-32 ${inputClass}`}
          />
          <input
            name="points"
            type="number"
            min={0}
            placeholder="Points"
            required
            className={`w-24 ${inputClass}`}
          />
          <button type="submit" className={buttonClass}>
            Add task
          </button>
        </form>
        <div className="space-y-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex flex-wrap items-center gap-2 rounded-xl border border-neutral-200 p-3 dark:border-neutral-800"
            >
              <form action={updateTask} className="flex flex-1 flex-wrap items-center gap-2">
                <input type="hidden" name="id" value={task.id} />
                <input type="hidden" name="hackathonId" value={hackathon.id} />
                <input
                  name="title"
                  defaultValue={task.title}
                  required
                  className={`flex-1 min-w-32 ${inputClass}`}
                />
                <input
                  name="description"
                  defaultValue={task.description}
                  className={`flex-1 min-w-32 ${inputClass}`}
                />
                <input
                  name="points"
                  type="number"
                  min={0}
                  defaultValue={task.points}
                  required
                  className={`w-20 ${inputClass}`}
                />
                <label className="flex items-center gap-1 text-sm">
                  <input type="checkbox" name="active" defaultChecked={task.active} />
                  active
                </label>
                <button className={smallButtonClass}>Save</button>
              </form>
              <form action={deleteTask}>
                <input type="hidden" name="id" value={task.id} />
                <input type="hidden" name="hackathonId" value={hackathon.id} />
                <ConfirmSubmit
                  className="rounded-md border border-red-300 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                  message={`Delete task "${task.title}"? Existing point events are kept.`}
                >
                  Delete
                </ConfirmSubmit>
              </form>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">Activity History (latest 50)</h2>
        {events.length === 0 && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            No point activity yet.
          </p>
        )}
        <div className="overflow-x-auto rounded-2xl border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-sm">
            <thead className="bg-neutral-100 text-left dark:bg-neutral-900">
              <tr>
                <th className="px-4 py-2">When</th>
                <th className="px-4 py-2">Team</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Points</th>
                <th className="px-4 py-2">Description</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id} className="border-t border-neutral-200 dark:border-neutral-800">
                  <td className="px-4 py-2 whitespace-nowrap text-neutral-500 dark:text-neutral-400">
                    {formatTimestamp(e.created_at)}
                  </td>
                  <td className="px-4 py-2">{e.team_name}</td>
                  <td className="px-4 py-2">
                    <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs dark:bg-neutral-800">
                      {e.type === "task_completion" ? "task" : "ad hoc"}
                    </span>
                  </td>
                  <td className="px-4 py-2 font-semibold tabular-nums">
                    {e.points > 0 ? `+${e.points}` : e.points}
                  </td>
                  <td className="px-4 py-2">
                    {e.task_title ?? e.description}
                    {e.task_title && e.note && (
                      <span className="block text-xs text-neutral-500 dark:text-neutral-400">
                        {e.note}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <form action={deletePointEvent}>
                      <input type="hidden" name="id" value={e.id} />
                      <input type="hidden" name="hackathonId" value={hackathon.id} />
                      <button className="text-xs text-red-600 hover:underline dark:text-red-400">
                        remove
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

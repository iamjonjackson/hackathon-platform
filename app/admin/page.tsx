import Link from "next/link";
import { query } from "@/lib/db";
import { createHackathon } from "./actions";

export const dynamic = "force-dynamic";

type HackathonRow = {
  id: string;
  name: string;
  status: string;
  team_count: number;
};

export default async function AdminDashboard() {
  const hackathons = await query<HackathonRow>(
    `SELECT h.id, h.name, h.status,
            (SELECT count(*)::int FROM teams t WHERE t.hackathon_id = h.id) AS team_count
     FROM hackathons h
     ORDER BY h.created_at DESC`
  );

  return (
    <div className="space-y-8">
      <section>
        <h1 className="mb-4 text-2xl font-bold">Hackathons</h1>
        <form
          action={createHackathon}
          className="flex flex-wrap items-start gap-3 rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800"
        >
          <input
            name="name"
            placeholder="Hackathon name"
            required
            className="flex-1 min-w-48 rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
          />
          <input
            name="description"
            placeholder="Description (optional)"
            className="flex-1 min-w-48 rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
          />
          <button
            type="submit"
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            Create
          </button>
        </form>
      </section>

      <section className="space-y-3">
        {hackathons.length === 0 && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            No hackathons yet — create one above to get started.
          </p>
        )}
        {hackathons.map((h) => (
          <Link
            key={h.id}
            href={`/admin/h/${h.id}`}
            className="flex items-center justify-between rounded-2xl border border-neutral-200 p-4 hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-900"
          >
            <div>
              <div className="font-semibold">{h.name}</div>
              <div className="text-sm text-neutral-500 dark:text-neutral-400">
                {h.team_count} {h.team_count === 1 ? "team" : "teams"}
              </div>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                h.status === "active"
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                  : h.status === "archived"
                    ? "bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300"
              }`}
            >
              {h.status}
            </span>
          </Link>
        ))}
      </section>
    </div>
  );
}

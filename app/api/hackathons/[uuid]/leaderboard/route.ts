import { NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";
import type { LeaderboardData, TaskSummary } from "@/lib/shared";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ uuid: string }> }
) {
  const { uuid } = await params;
  const hackathon = await queryOne<{
    id: string;
    name: string;
    description: string;
    status: string;
  }>(
    "SELECT id, name, description, status FROM hackathons WHERE public_uuid = $1",
    [uuid]
  );
  if (!hackathon) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (hackathon.status !== "active" && !(await isAuthenticated())) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const teams = await query<{ id: string; name: string; total: number }>(
    `SELECT t.id, t.name,
            COALESCE(sum(pe.points), 0)::int AS total
     FROM teams t
     LEFT JOIN point_events pe ON pe.team_id = t.id
     WHERE t.hackathon_id = $1
     GROUP BY t.id, t.name
     ORDER BY total DESC, t.name ASC`,
    [hackathon.id]
  );

  const tasks = await query<TaskSummary>(
    "SELECT id, title, description, points FROM tasks WHERE hackathon_id = $1 AND active = true ORDER BY created_at",
    [hackathon.id]
  );

  const data: LeaderboardData = {
    name: hackathon.name,
    description: hackathon.description,
    updatedAt: new Date().toISOString(),
    teams,
    tasks,
  };
  return NextResponse.json(data, {
    headers: { "Cache-Control": "no-store" },
  });
}

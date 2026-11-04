import { NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";
import type { TeamDetail } from "@/lib/shared";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ uuid: string; teamId: string }> }
) {
  const { uuid, teamId } = await params;
  const hackathon = await queryOne<{ id: string; status: string }>(
    "SELECT id, status FROM hackathons WHERE public_uuid = $1",
    [uuid]
  );
  if (!hackathon) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (hackathon.status !== "active" && !(await isAuthenticated())) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const team = await queryOne<{ id: string; name: string; description: string }>(
    "SELECT id, name, description FROM teams WHERE id = $1 AND hackathon_id = $2",
    [teamId, hackathon.id]
  );
  if (!team) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const events = await query<{
    id: string;
    type: TeamDetail["events"][number]["type"];
    points: number;
    description: string;
    created_at: string;
  }>(
    `SELECT id, type, points, description, created_at
     FROM point_events WHERE team_id = $1 ORDER BY created_at DESC`,
    [teamId]
  );

  const data: TeamDetail = {
    ...team,
    total: events.reduce((sum, e) => sum + e.points, 0),
    events,
  };
  return NextResponse.json(data, {
    headers: { "Cache-Control": "no-store" },
  });
}

import { notFound } from "next/navigation";
import { queryOne } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";
import { LEADERBOARD_REFRESH_INTERVAL_MS } from "@/lib/config";
import type { LeaderboardEntry } from "@/lib/shared";
import Leaderboard from "../../components/Leaderboard";

export const dynamic = "force-dynamic";

export default async function PublicLeaderboardPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const { uuid } = await params;
  const hackathon = await queryOne<{
    id: string;
    name: string;
    description: string;
    status: string;
  }>("SELECT id, name, description, status FROM hackathons WHERE public_uuid = $1", [
    uuid,
  ]);
  if (!hackathon) notFound();
  if (hackathon.status !== "active" && !(await isAuthenticated())) notFound();

  const initialTeams: LeaderboardEntry[] = [];

  return (
    <Leaderboard
      uuid={uuid}
      initialName={hackathon.name}
      initialDescription={hackathon.description}
      initialTeams={initialTeams}
      refreshIntervalMs={LEADERBOARD_REFRESH_INTERVAL_MS}
    />
  );
}

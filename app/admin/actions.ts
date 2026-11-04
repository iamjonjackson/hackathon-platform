"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { query, queryOne } from "@/lib/db";
import {
  clearSessionCookie,
  requireAdmin,
  setSessionCookie,
} from "@/lib/auth";

export async function login(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || password !== expected) {
    redirect("/admin/login?error=1");
  }
  await setSessionCookie();
  redirect("/admin");
}

export async function logout() {
  await clearSessionCookie();
  redirect("/admin/login");
}

export async function createHackathon(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const description = String(formData.get("description") ?? "").trim();
  const row = await queryOne<{ id: string }>(
    "INSERT INTO hackathons (name, description) VALUES ($1, $2) RETURNING id",
    [name, description]
  );
  revalidatePath("/admin");
  if (row) redirect(`/admin/h/${row.id}`);
}

export async function updateHackathon(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const status = String(formData.get("status") ?? "draft");
  if (!id || !name) return;
  await query(
    "UPDATE hackathons SET name = $1, description = $2, status = $3, updated_at = now() WHERE id = $4",
    [name, description, status, id]
  );
  revalidatePath(`/admin/h/${id}`);
  revalidatePath("/admin");
}

export async function regeneratePublicLink(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  if (!id) return;
  await query(
    "UPDATE hackathons SET public_uuid = gen_random_uuid(), updated_at = now() WHERE id = $1",
    [id]
  );
  revalidatePath(`/admin/h/${id}`);
}

export async function deleteHackathon(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  if (!id) return;
  await query("DELETE FROM hackathons WHERE id = $1", [id]);
  revalidatePath("/admin");
  redirect("/admin");
}

export async function createTeam(formData: FormData) {
  await requireAdmin();
  const hackathonId = String(formData.get("hackathonId"));
  const name = String(formData.get("name") ?? "").trim();
  if (!hackathonId || !name) return;
  const description = String(formData.get("description") ?? "").trim();
  await query(
    "INSERT INTO teams (hackathon_id, name, description) VALUES ($1, $2, $3)",
    [hackathonId, name, description]
  );
  revalidatePath(`/admin/h/${hackathonId}`);
}

export async function updateTeam(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const hackathonId = String(formData.get("hackathonId"));
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) return;
  const description = String(formData.get("description") ?? "").trim();
  await query("UPDATE teams SET name = $1, description = $2 WHERE id = $3", [
    name,
    description,
    id,
  ]);
  revalidatePath(`/admin/h/${hackathonId}`);
}

export async function deleteTeam(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const hackathonId = String(formData.get("hackathonId"));
  if (!id) return;
  await query("DELETE FROM teams WHERE id = $1", [id]);
  revalidatePath(`/admin/h/${hackathonId}`);
}

export async function createTask(formData: FormData) {
  await requireAdmin();
  const hackathonId = String(formData.get("hackathonId"));
  const title = String(formData.get("title") ?? "").trim();
  const points = Number(formData.get("points"));
  if (!hackathonId || !title || !Number.isFinite(points) || points <= 0) return;
  const description = String(formData.get("description") ?? "").trim();
  await query(
    "INSERT INTO tasks (hackathon_id, title, description, points) VALUES ($1, $2, $3, $4)",
    [hackathonId, title, description, Math.round(points)]
  );
  revalidatePath(`/admin/h/${hackathonId}`);
}

export async function updateTask(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const hackathonId = String(formData.get("hackathonId"));
  const title = String(formData.get("title") ?? "").trim();
  const points = Number(formData.get("points"));
  if (!id || !title || !Number.isFinite(points) || points <= 0) return;
  const description = String(formData.get("description") ?? "").trim();
  const active = formData.get("active") === "on";
  await query(
    "UPDATE tasks SET title = $1, description = $2, points = $3, active = $4 WHERE id = $5",
    [title, description, Math.round(points), active, id]
  );
  revalidatePath(`/admin/h/${hackathonId}`);
}

export async function deleteTask(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const hackathonId = String(formData.get("hackathonId"));
  if (!id) return;
  await query("DELETE FROM tasks WHERE id = $1", [id]);
  revalidatePath(`/admin/h/${hackathonId}`);
}

export async function completeTask(formData: FormData) {
  await requireAdmin();
  const hackathonId = String(formData.get("hackathonId"));
  const teamId = String(formData.get("teamId"));
  const taskId = String(formData.get("taskId"));
  const note = String(formData.get("note") ?? "").trim();
  if (!hackathonId || !teamId || !taskId) return;

  const task = await queryOne<{ points: number; title: string }>(
    "SELECT points, title FROM tasks WHERE id = $1 AND hackathon_id = $2 AND active = true",
    [taskId, hackathonId]
  );
  if (!task) return;

  const existing = await queryOne<{ id: string }>(
    "SELECT id FROM achievements WHERE team_id = $1 AND task_id = $2",
    [teamId, taskId]
  );
  if (existing) return;

  const event = await queryOne<{ id: string }>(
    `INSERT INTO point_events (hackathon_id, team_id, type, points, description)
     VALUES ($1, $2, 'task_completion', $3, $4)
     RETURNING id`,
    [hackathonId, teamId, task.points, note || task.title]
  );
  if (!event) return;

  await query(
    `INSERT INTO achievements (team_id, task_id, points_awarded, note, point_event_id)
     VALUES ($1, $2, $3, $4, $5)`,
    [teamId, taskId, task.points, note, event.id]
  );
  revalidatePath(`/admin/h/${hackathonId}`);
}

export async function awardAdhocPoints(formData: FormData) {
  await requireAdmin();
  const hackathonId = String(formData.get("hackathonId"));
  const teamId = String(formData.get("teamId"));
  const points = Number(formData.get("points"));
  const description = String(formData.get("description") ?? "").trim();
  if (!hackathonId || !teamId || !Number.isFinite(points) || points === 0) return;
  if (!description) return;

  await query(
    `INSERT INTO point_events (hackathon_id, team_id, type, points, description)
     VALUES ($1, $2, 'adhoc', $3, $4)`,
    [hackathonId, teamId, Math.round(points), description]
  );
  revalidatePath(`/admin/h/${hackathonId}`);
}

export async function deletePointEvent(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const hackathonId = String(formData.get("hackathonId"));
  if (!id) return;
  await query("DELETE FROM point_events WHERE id = $1", [id]);
  revalidatePath(`/admin/h/${hackathonId}`);
}

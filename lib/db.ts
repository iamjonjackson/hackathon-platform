import { neon } from "@neondatabase/serverless";
import { SCHEMA_SQL } from "./schema";

function getClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  return neon(url);
}

type QueryParams = unknown[];

const UNDEFINED_TABLE = "42P01";

async function tablesExist(): Promise<boolean> {
  const rows = (await getClient().query(
    "SELECT to_regclass('public.hackathons') IS NOT NULL AS exists"
  )) as { exists: boolean }[];
  return Boolean(rows[0]?.exists);
}

async function applySchema(): Promise<void> {
  const statements = SCHEMA_SQL.split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  try {
    for (const statement of statements) {
      await getClient().query(statement);
    }
  } catch (error) {
    if (await tablesExist()) return;
    throw error;
  }
}

let schemaReady: Promise<void> | null = null;

function ensureSchema(): Promise<void> {
  schemaReady ??= (async () => {
    if (await tablesExist()) return;
    await applySchema();
    if (!(await tablesExist())) {
      throw new Error("Schema setup did not result in expected tables");
    }
  })().catch((error) => {
    schemaReady = null;
    throw error;
  });
  return schemaReady;
}

async function runQuery<T>(
  text: string,
  params: QueryParams
): Promise<T[]> {
  return getClient().query(text, params) as Promise<T[]>;
}

export async function query<T = Record<string, unknown>>(
  text: string,
  params: QueryParams = []
): Promise<T[]> {
  await ensureSchema();
  try {
    return await runQuery<T>(text, params);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      (error as { code?: string }).code === UNDEFINED_TABLE
    ) {
      schemaReady = null;
      await ensureSchema();
      return runQuery<T>(text, params);
    }
    throw error;
  }
}

export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params: QueryParams = []
): Promise<T | undefined> {
  const rows = await query<T>(text, params);
  return rows[0];
}

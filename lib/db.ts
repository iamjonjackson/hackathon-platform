import { neon } from "@neondatabase/serverless";

function getClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  return neon(url);
}

type QueryParams = unknown[];

export async function query<T = Record<string, unknown>>(
  text: string,
  params: QueryParams = []
): Promise<T[]> {
  return getClient().query(text, params) as Promise<T[]>;
}

export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params: QueryParams = []
): Promise<T | undefined> {
  const rows = await query<T>(text, params);
  return rows[0];
}

import { Client } from "pg";

/** Zera o controle de taxa para que os cadastros de teste não sejam bloqueados. */
export default async function globalSetup(): Promise<void> {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query('DELETE FROM "rate_limit"');
  } finally {
    await client.end();
  }
}

// GET /api/postgres/tables
// Returns all user-created tables with their column definitions.
// The UI uses this to populate the table list in the sidebar.

import { NextResponse } from "next/server";
import { Client } from "pg";

function getClient() {
  return new Client({
    host: "localhost", port: 5432,
    user: "postgres", password: "artemis", database: "artemis",
    connectionTimeoutMillis: 3000,
  });
}

export async function GET() {
  const client = getClient();
  try {
    await client.connect();

    // Get all tables in the public schema (user-created ones)
    const tablesRes = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    // For each table, get its columns
    const tables = await Promise.all(
      tablesRes.rows.map(async ({ table_name }) => {
        const colsRes = await client.query(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = $1
          ORDER BY ordinal_position
        `, [table_name]);

        return { name: table_name, columns: colsRes.rows };
      })
    );

    await client.end();
    return NextResponse.json(tables);
  } catch (err: unknown) {
    await client.end().catch(() => {});
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

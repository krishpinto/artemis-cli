// POST /api/postgres/query
// Executes a SQL query and returns rows + column names.
// Used by both the table viewer (SELECT * FROM table) and the SQL editor.

import { NextResponse } from "next/server";
import { Client } from "pg";

function getClient() {
  return new Client({
    host: "localhost", port: 5432,
    user: "postgres", password: "artemis", database: "artemis",
    connectionTimeoutMillis: 3000,
  });
}

export async function POST(req: Request) {
  const { query } = await req.json();

  if (!query?.trim()) {
    return NextResponse.json({ error: "No query provided" }, { status: 400 });
  }

  const client = getClient();
  try {
    await client.connect();
    const result = await client.query(query);
    await client.end();

    return NextResponse.json({
      rows:     result.rows,
      fields:   result.fields.map(f => f.name),
      rowCount: result.rowCount,
      command:  result.command, // SELECT, INSERT, UPDATE, DELETE etc.
    });
  } catch (err: unknown) {
    await client.end().catch(() => {});
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

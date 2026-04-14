// GET /api/services
// Tries to connect to each service on its local port.
// Returns { id, name, status: 'online'|'offline', port, connectionString }[]
// The UI uses this to show green/red dots on the dashboard.

import { NextResponse } from "next/server";
import { Client as PgClient } from "pg";
import Redis from "ioredis";
import { MongoClient } from "mongodb";

const SERVICES = [
  {
    id: "postgres",
    name: "PostgreSQL",
    port: 5432,
    connectionString: "postgresql://postgres:artemis@localhost:5432/artemis",
  },
  {
    id: "redis",
    name: "Redis",
    port: 6379,
    connectionString: "redis://localhost:6379",
  },
  {
    id: "mongodb",
    name: "MongoDB",
    port: 27017,
    connectionString: "mongodb://artemis:artemis@localhost:27017/artemis",
  },
  {
    id: "grafana",
    name: "Grafana",
    port: 3000,
    connectionString: "http://localhost:3000",
  },
  {
    id: "minio",
    name: "MinIO",
    port: 9000,
    connectionString: "http://localhost:9000",
  },
  {
    id: "prometheus",
    name: "Prometheus",
    port: 9090,
    connectionString: "http://localhost:9090",
  },
];

// Try to connect to Postgres — resolves true if successful, false if not
async function checkPostgres(): Promise<boolean> {
  const client = new PgClient({
    host: "localhost", port: 5432,
    user: "postgres", password: "artemis", database: "artemis",
    connectionTimeoutMillis: 2000,
  });
  try {
    await client.connect();
    await client.end();
    return true;
  } catch {
    return false;
  }
}

async function checkRedis(): Promise<boolean> {
  const redis = new Redis({ host: "localhost", port: 6379, lazyConnect: true, connectTimeout: 2000 });
  try {
    await redis.connect();
    await redis.quit();
    return true;
  } catch {
    return false;
  }
}

async function checkMongo(): Promise<boolean> {
  const client = new MongoClient("mongodb://artemis:artemis@localhost:27017/artemis", {
    serverSelectionTimeoutMS: 2000,
  });
  try {
    await client.connect();
    await client.close();
    return true;
  } catch {
    return false;
  }
}

// For HTTP services (Grafana, MinIO, Prometheus) — just try a TCP connection via fetch
async function checkHttp(port: number): Promise<boolean> {
  try {
    const res = await fetch(`http://localhost:${port}`, { signal: AbortSignal.timeout(2000) });
    return res.status < 500;
  } catch {
    return false;
  }
}

export async function GET() {
  // Run all checks in parallel
  const [pgOk, redisOk, mongoOk, grafanaOk, minioOk, prometheusOk] = await Promise.all([
    checkPostgres(),
    checkRedis(),
    checkMongo(),
    checkHttp(3000),
    checkHttp(9000),
    checkHttp(9090),
  ]);

  const statuses = [pgOk, redisOk, mongoOk, grafanaOk, minioOk, prometheusOk];

  const result = SERVICES.map((svc, i) => ({
    ...svc,
    status: statuses[i] ? "online" : "offline",
  }));

  return NextResponse.json(result);
}

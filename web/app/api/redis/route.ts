// /api/redis — GET lists all keys, POST sets a key, DELETE removes a key

import { NextResponse } from "next/server";
import Redis from "ioredis";

function getClient() {
  return new Redis({ host: "localhost", port: 6379, lazyConnect: true, connectTimeout: 3000 });
}

// GET /api/redis?pattern=* — list all keys with their type and value
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const pattern = searchParams.get("pattern") || "*";

  const redis = getClient();
  try {
    await redis.connect();
    const keys = await redis.keys(pattern);

    // For each key, get its type and value
    const items = await Promise.all(keys.map(async (key) => {
      const type = await redis.type(key);
      const ttl  = await redis.ttl(key);

      let value: unknown = null;
      if (type === "string") value = await redis.get(key);
      else if (type === "list") value = await redis.lrange(key, 0, 99);
      else if (type === "hash") value = await redis.hgetall(key);
      else if (type === "set")  value = await redis.smembers(key);
      else if (type === "zset") value = await redis.zrange(key, 0, 99, "WITHSCORES");

      return { key, type, value, ttl };
    }));

    await redis.quit();
    return NextResponse.json(items);
  } catch (err) {
    await redis.quit().catch(() => {});
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// POST /api/redis — set a key { key, value, ttl? }
export async function POST(req: Request) {
  const { key, value, ttl } = await req.json();
  const redis = getClient();
  try {
    await redis.connect();
    if (ttl) await redis.set(key, value, "EX", ttl);
    else await redis.set(key, value);
    await redis.quit();
    return NextResponse.json({ ok: true });
  } catch (err) {
    await redis.quit().catch(() => {});
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// DELETE /api/redis?key=mykey
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  if (!key) return NextResponse.json({ error: "No key provided" }, { status: 400 });

  const redis = getClient();
  try {
    await redis.connect();
    await redis.del(key);
    await redis.quit();
    return NextResponse.json({ ok: true });
  } catch (err) {
    await redis.quit().catch(() => {});
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

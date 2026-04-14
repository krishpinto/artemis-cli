// /api/mongodb — GET lists collections, POST queries documents

import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const URI = "mongodb://artemis:artemis@localhost:27017/artemis";

// GET /api/mongodb?collection=name&limit=50 — list collections or query documents
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const collection = searchParams.get("collection");
  const limit      = parseInt(searchParams.get("limit") || "50");

  const client = new MongoClient(URI, { serverSelectionTimeoutMS: 3000 });
  try {
    await client.connect();
    const db = client.db("artemis");

    if (!collection) {
      // List all collections with document counts
      const cols = await db.listCollections().toArray();
      const withCounts = await Promise.all(cols.map(async c => ({
        name: c.name,
        count: await db.collection(c.name).countDocuments(),
      })));
      await client.close();
      return NextResponse.json(withCounts);
    }

    // Return documents from the requested collection
    const docs = await db.collection(collection).find({}).limit(limit).toArray();
    await client.close();
    // Convert _id ObjectId to string so it serializes cleanly
    return NextResponse.json(docs.map(d => ({ ...d, _id: d._id.toString() })));
  } catch (err) {
    await client.close().catch(() => {});
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// POST /api/mongodb — insert a document { collection, document }
export async function POST(req: Request) {
  const { collection, document } = await req.json();
  const client = new MongoClient(URI, { serverSelectionTimeoutMS: 3000 });
  try {
    await client.connect();
    await client.db("artemis").collection(collection).insertOne(document);
    await client.close();
    return NextResponse.json({ ok: true });
  } catch (err) {
    await client.close().catch(() => {});
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

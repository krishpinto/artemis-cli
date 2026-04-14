"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy, FileText } from "lucide-react";

type Snippet = { label: string; code: string };
type Service = { id: string; name: string; icon: string; snippets: Record<string, Snippet[]> };

const SERVICES: Service[] = [
  {
    id: "postgres", name: "PostgreSQL", icon: "🐘",
    snippets: {
      "Node.js": [
        { label: "Install", code: "npm install pg" },
        { label: "Connect", code: `import { Client } from 'pg';

const client = new Client({
  connectionString: 'postgresql://postgres:artemis@localhost:5432/artemis'
});

await client.connect();
const res = await client.query('SELECT * FROM users');
console.log(res.rows);
await client.end();` },
      ],
      "Python": [
        { label: "Install", code: "pip install psycopg2-binary" },
        { label: "Connect", code: `import psycopg2

conn = psycopg2.connect(
  "postgresql://postgres:artemis@localhost:5432/artemis"
)
cur = conn.cursor()
cur.execute("SELECT * FROM users")
print(cur.fetchall())
conn.close()` },
      ],
      "Prisma": [
        { label: "Install", code: "npm install prisma @prisma/client" },
        { label: ".env", code: `DATABASE_URL="postgresql://postgres:artemis@localhost:5432/artemis"` },
        { label: "Connect", code: `import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const users = await prisma.user.findMany();` },
      ],
    },
  },
  {
    id: "redis", name: "Redis", icon: "⚡",
    snippets: {
      "Node.js": [
        { label: "Install", code: "npm install ioredis" },
        { label: "Connect", code: `import Redis from 'ioredis';

const redis = new Redis('redis://localhost:6379');

await redis.set('key', 'value');
const val = await redis.get('key');
console.log(val); // 'value'` },
      ],
      "Python": [
        { label: "Install", code: "pip install redis" },
        { label: "Connect", code: `import redis

r = redis.Redis(host='localhost', port=6379)
r.set('key', 'value')
print(r.get('key'))  # b'value'` },
      ],
    },
  },
  {
    id: "mongodb", name: "MongoDB", icon: "🍃",
    snippets: {
      "Node.js": [
        { label: "Install", code: "npm install mongodb" },
        { label: "Connect", code: `import { MongoClient } from 'mongodb';

const client = new MongoClient(
  'mongodb://artemis:artemis@localhost:27017/artemis'
);

await client.connect();
const db = client.db('artemis');
const users = await db.collection('users').find({}).toArray();
console.log(users);` },
      ],
      "Python": [
        { label: "Install", code: "pip install pymongo" },
        { label: "Connect", code: `from pymongo import MongoClient

client = MongoClient(
  'mongodb://artemis:artemis@localhost:27017/artemis'
)
db = client['artemis']
users = list(db['users'].find())
print(users)` },
      ],
      "Mongoose": [
        { label: "Install", code: "npm install mongoose" },
        { label: "Connect", code: `import mongoose from 'mongoose';

await mongoose.connect(
  'mongodb://artemis:artemis@localhost:27017/artemis'
);

const UserSchema = new mongoose.Schema({ name: String, email: String });
const User = mongoose.model('User', UserSchema);

const users = await User.find();` },
      ],
    },
  },
];

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className="relative group">
      <pre className="text-xs font-mono bg-muted/30 border border-border rounded-lg p-4 overflow-x-auto text-foreground/90 leading-relaxed">
        {code}
      </pre>
      <button
        onClick={copy}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded bg-muted hover:bg-muted/80"
      >
        {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
      </button>
    </div>
  );
}

export default function DocsPage() {
  const [activeService, setActiveService] = useState(SERVICES[0].id);
  const [activeLang, setActiveLang]       = useState<Record<string, string>>({});

  const service = SERVICES.find(s => s.id === activeService)!;
  const langs   = Object.keys(service.snippets);
  const lang    = activeLang[activeService] ?? langs[0];

  return (
    <div className="flex h-full">

      {/* Left: Service list */}
      <aside className="w-48 shrink-0 border-r border-border flex flex-col">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          <span className="text-sm font-mono font-medium text-primary">Docs</span>
        </div>
        <div className="p-2 space-y-0.5">
          {SERVICES.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveService(s.id)}
              className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
                activeService === s.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
            >
              <span>{s.icon}</span>
              <span className="font-mono text-xs">{s.name}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* Right: Snippets */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{service.icon}</span>
            <h2 className="text-lg font-bold font-mono text-foreground">{service.name}</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Copy-paste snippets to connect from your app. Run{" "}
            <code className="text-primary font-mono text-xs">artemis connect</code> first.
          </p>
        </div>

        {/* Language tabs */}
        <div className="flex gap-2">
          {langs.map(l => (
            <Button
              key={l}
              variant={lang === l ? "default" : "outline"}
              size="sm"
              className="text-xs font-mono"
              onClick={() => setActiveLang(prev => ({ ...prev, [activeService]: l }))}
            >
              {l}
            </Button>
          ))}
        </div>

        {/* Snippets */}
        <div className="space-y-4">
          {service.snippets[lang].map((snippet, i) => (
            <div key={i} className="space-y-2">
              <p className="text-xs text-muted-foreground font-mono uppercase tracking-wide">{snippet.label}</p>
              <CodeBlock code={snippet.code} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

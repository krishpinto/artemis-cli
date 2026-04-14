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
  'mongodb://artemis:artemis@localhost:27017/artemis?authSource=admin'
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
  'mongodb://artemis:artemis@localhost:27017/artemis?authSource=admin'
)
db = client['artemis']
users = list(db['users'].find())
print(users)` },
      ],
      "Mongoose": [
        { label: "Install", code: "npm install mongoose" },
        { label: "Connect", code: `import mongoose from 'mongoose';

await mongoose.connect(
  'mongodb://artemis:artemis@localhost:27017/artemis?authSource=admin'
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
      <pre className="text-xs font-mono bg-gray-50 text-gray-800 rounded-xl p-4 overflow-x-auto leading-relaxed border border-gray-200">
        {code}
      </pre>
      <button
        onClick={copy}
        className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md bg-white border border-gray-200 hover:bg-gray-50 shadow-sm"
      >
        {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-gray-400" />}
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
    <div className="flex h-full bg-white">

      {/* Left: service list */}
      <aside className="w-48 shrink-0 border-r border-gray-200 flex flex-col">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-semibold text-gray-800">Docs</span>
        </div>
        <div className="p-2 space-y-0.5">
          {SERVICES.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveService(s.id)}
              className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                activeService === s.id
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <span>{s.icon}</span>
              <span className="font-mono text-xs">{s.name}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* Right: snippets */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{service.icon}</span>
            <h2 className="text-lg font-bold text-gray-900">{service.name}</h2>
          </div>
          <p className="text-sm text-gray-500">
            Copy-paste snippets to connect from your app. Run{" "}
            <code className="text-blue-600 font-mono text-xs bg-blue-50 px-1.5 py-0.5 rounded">npx artemis-cli connect</code> first.
          </p>
        </div>

        {/* Language tabs */}
        <div className="flex gap-2 border-b border-gray-200 pb-0">
          {langs.map(l => (
            <button
              key={l}
              onClick={() => setActiveLang(prev => ({ ...prev, [activeService]: l }))}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                lang === l
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Snippets */}
        <div className="space-y-5">
          {service.snippets[lang].map((snippet, i) => (
            <div key={i} className="space-y-2">
              <p className="text-xs text-gray-400 font-mono uppercase tracking-wider">{snippet.label}</p>
              <CodeBlock code={snippet.code} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

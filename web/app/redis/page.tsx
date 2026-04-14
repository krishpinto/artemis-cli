"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Layers, Plus, Trash2, RefreshCw, Search } from "lucide-react";

type RedisItem = { key: string; type: string; value: unknown; ttl: number };

const TYPE_STYLE: Record<string, { color: string; bg: string }> = {
  string: { color: "text-blue-700",   bg: "bg-blue-50 border-blue-200"   },
  list:   { color: "text-purple-700", bg: "bg-purple-50 border-purple-200"},
  hash:   { color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200"},
  set:    { color: "text-green-700",  bg: "bg-green-50 border-green-200"  },
  zset:   { color: "text-orange-700", bg: "bg-orange-50 border-orange-200"},
};

const TYPE_DESC: Record<string, string> = {
  string: "A single text or number value. The most common Redis type.",
  list:   "An ordered sequence of strings, like an array.",
  hash:   "A map of field → value pairs, like a JS object.",
  set:    "A collection of unique strings with no duplicates.",
  zset:   "Like a set, but each item has a score for ordering.",
};

export default function RedisPage() {
  const [items, setItems]       = useState<RedisItem[]>([]);
  const [selected, setSelected] = useState<RedisItem | null>(null);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [newKey, setNewKey]     = useState("");
  const [newVal, setNewVal]     = useState("");
  const [adding, setAdding]     = useState(false);
  const [showAdd, setShowAdd]   = useState(false);

  async function fetchKeys() {
    setLoading(true);
    try {
      const data = await fetch("/api/redis").then(r => r.json());
      setItems(Array.isArray(data) ? data : []);
    } catch { setItems([]); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchKeys(); }, []);

  async function deleteKey(key: string) {
    await fetch(`/api/redis?key=${encodeURIComponent(key)}`, { method: "DELETE" });
    if (selected?.key === key) setSelected(null);
    fetchKeys();
  }

  async function addKey() {
    if (!newKey.trim() || !newVal.trim()) return;
    setAdding(true);
    await fetch("/api/redis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: newKey, value: newVal }),
    });
    setNewKey(""); setNewVal(""); setShowAdd(false); setAdding(false);
    fetchKeys();
  }

  function renderValue(item: RedisItem) {
    if (item.type === "string") return (
      <code className="text-sm font-mono text-gray-800 break-all">{String(item.value)}</code>
    );
    if (item.type === "list" || item.type === "set") return (
      <div className="space-y-1">
        {(item.value as string[]).map((v, i) => (
          <div key={i} className="flex items-center gap-3 py-1 border-b border-gray-100 last:border-0">
            <span className="text-xs text-gray-400 font-mono w-6 shrink-0">{i}</span>
            <code className="text-sm font-mono text-gray-800">{v}</code>
          </div>
        ))}
      </div>
    );
    if (item.type === "hash") return (
      <div className="space-y-1">
        {Object.entries(item.value as Record<string, string>).map(([k, v]) => (
          <div key={k} className="flex items-start gap-4 py-1 border-b border-gray-100 last:border-0">
            <code className="text-xs font-mono text-blue-600 w-28 shrink-0 truncate">{k}</code>
            <code className="text-xs font-mono text-gray-700">{v}</code>
          </div>
        ))}
      </div>
    );
    return <code className="text-sm font-mono text-gray-800">{JSON.stringify(item.value, null, 2)}</code>;
  }

  const filtered = items.filter(i => i.key.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex h-full bg-white">

      {/* ── Left: key list ── */}
      <aside className="w-64 shrink-0 border-r border-gray-200 flex flex-col">
        <div className="px-4 py-3 border-b border-gray-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-gray-800">Keys</span>
              <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-mono">{items.length}</span>
            </div>
            <div className="flex gap-1">
              <button
                onClick={fetchKeys}
                className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors"
                title="Refresh"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${loading ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={() => setShowAdd(s => !s)}
                className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors"
                title="Add key"
              >
                <Plus className="w-3.5 h-3.5 text-gray-500" />
              </button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <Input
              placeholder="Search keys..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs font-mono bg-gray-50 border-gray-200 text-gray-700 placeholder:text-gray-400"
            />
          </div>
        </div>

        {showAdd && (
          <div className="p-3 border-b border-gray-200 space-y-2 bg-gray-50">
            <Input
              placeholder="Key name"
              value={newKey}
              onChange={e => setNewKey(e.target.value)}
              className="h-8 text-xs font-mono bg-white border-gray-200"
            />
            <Input
              placeholder="Value"
              value={newVal}
              onChange={e => setNewVal(e.target.value)}
              className="h-8 text-xs font-mono bg-white border-gray-200"
            />
            <Button
              size="sm"
              className="w-full h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white"
              onClick={addKey}
              disabled={adding}
            >
              {adding ? "Adding..." : "Set Key"}
            </Button>
          </div>
        )}

        <ScrollArea className="flex-1">
          {loading ? (
            <div className="p-3 space-y-2">
              {[1,2,3,4].map(i => <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-4 text-xs text-gray-400">
              {items.length === 0 ? "No keys yet. Add one above." : "No keys match your search."}
            </div>
          ) : (
            <div className="p-2 space-y-0.5">
              {filtered.map(item => {
                const style = TYPE_STYLE[item.type] ?? { color: "text-gray-600", bg: "bg-gray-100 border-gray-200" };
                return (
                  <button
                    key={item.key}
                    onClick={() => setSelected(item)}
                    className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-xs transition-colors group ${
                      selected?.key === item.key
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border font-medium shrink-0 ${style.color} ${style.bg}`}>
                      {item.type}
                    </span>
                    <span className="truncate font-mono">{item.key}</span>
                    <button
                      onClick={e => { e.stopPropagation(); deleteKey(item.key); }}
                      className="ml-auto opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </aside>

      {/* ── Right: value viewer ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {!selected ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
            <Layers className="w-8 h-8" />
            <p className="text-sm font-medium">Select a key to inspect it</p>
            <p className="text-xs text-center max-w-xs">
              Redis stores every piece of data with a key (name) and a value
            </p>
          </div>
        ) : (
          <div className="p-6 space-y-4 overflow-auto">
            {/* Key header */}
            <div className="flex items-center gap-3 flex-wrap">
              <code className="text-lg font-mono font-bold text-gray-900">{selected.key}</code>
              {(() => {
                const style = TYPE_STYLE[selected.type] ?? { color: "text-gray-600", bg: "bg-gray-100 border-gray-200" };
                return (
                  <span className={`text-xs font-mono px-2 py-1 rounded-full border font-semibold ${style.color} ${style.bg}`}>
                    {selected.type}
                  </span>
                );
              })()}
              {selected.ttl > 0 && (
                <span className="text-xs font-mono px-2 py-1 rounded-full border text-orange-700 bg-orange-50 border-orange-200">
                  TTL: {selected.ttl}s
                </span>
              )}
              <button
                onClick={() => deleteKey(selected.key)}
                className="ml-auto flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Delete
              </button>
            </div>

            {/* Type description */}
            <p className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5">
              {TYPE_DESC[selected.type] ?? "Unknown Redis type."}
            </p>

            {/* Value */}
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 overflow-auto max-h-96">
              {renderValue(selected)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

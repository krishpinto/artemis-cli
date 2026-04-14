"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Layers, Plus, Trash2, RefreshCw, Search } from "lucide-react";

type RedisItem = { key: string; type: string; value: unknown; ttl: number };

const TYPE_COLORS: Record<string, string> = {
  string: "text-cyan-400 border-cyan-400/30 bg-cyan-400/10",
  list:   "text-purple-400 border-purple-400/30 bg-purple-400/10",
  hash:   "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  set:    "text-green-400 border-green-400/30 bg-green-400/10",
  zset:   "text-orange-400 border-orange-400/30 bg-orange-400/10",
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
      const res  = await fetch("/api/redis");
      const data = await res.json();
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
      <code className="text-sm font-mono text-foreground/90 break-all">{String(item.value)}</code>
    );
    if (item.type === "list" || item.type === "set") return (
      <div className="space-y-1">
        {(item.value as string[]).map((v, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-6">{i}</span>
            <code className="text-sm font-mono text-foreground/90">{v}</code>
          </div>
        ))}
      </div>
    );
    if (item.type === "hash") return (
      <div className="space-y-1">
        {Object.entries(item.value as Record<string, string>).map(([k, v]) => (
          <div key={k} className="flex items-start gap-3">
            <code className="text-xs font-mono text-primary w-24 shrink-0 truncate">{k}</code>
            <code className="text-xs font-mono text-foreground/80">{v}</code>
          </div>
        ))}
      </div>
    );
    return <code className="text-sm font-mono">{JSON.stringify(item.value, null, 2)}</code>;
  }

  const filtered = items.filter(i => i.key.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex h-full">

      {/* Left: Key list */}
      <aside className="w-64 shrink-0 border-r border-border flex flex-col">
        <div className="px-3 py-3 border-b border-border space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <span className="text-sm font-mono font-medium text-primary">Keys</span>
              <Badge variant="outline" className="text-xs">{items.length}</Badge>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={fetchKeys}>
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowAdd(s => !s)}>
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
            <Input
              placeholder="Search keys..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-7 h-7 text-xs font-mono bg-muted/30"
            />
          </div>
        </div>

        {showAdd && (
          <div className="p-3 border-b border-border space-y-2">
            <Input placeholder="Key" value={newKey} onChange={e => setNewKey(e.target.value)} className="h-7 text-xs font-mono bg-muted/30" />
            <Input placeholder="Value" value={newVal} onChange={e => setNewVal(e.target.value)} className="h-7 text-xs font-mono bg-muted/30" />
            <Button size="sm" className="w-full h-7 text-xs" onClick={addKey} disabled={adding}>
              {adding ? "Adding..." : "Set Key"}
            </Button>
          </div>
        )}

        <ScrollArea className="flex-1">
          {loading ? (
            <div className="p-3 space-y-2">
              {[1,2,3,4].map(i => <div key={i} className="h-3 bg-muted rounded animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-4 text-xs text-muted-foreground">
              {items.length === 0 ? "No keys yet. Add one above." : "No keys match your search."}
            </div>
          ) : (
            <div className="p-2 space-y-0.5">
              {filtered.map(item => (
                <button
                  key={item.key}
                  onClick={() => setSelected(item)}
                  className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded text-xs transition-colors group ${
                    selected?.key === item.key
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  <Badge variant="outline" className={`text-[10px] px-1 py-0 shrink-0 ${TYPE_COLORS[item.type] ?? ""}`}>
                    {item.type}
                  </Badge>
                  <span className="truncate font-mono">{item.key}</span>
                  <button
                    onClick={e => { e.stopPropagation(); deleteKey(item.key); }}
                    className="ml-auto opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </aside>

      {/* Right: Value viewer */}
      <div className="flex-1 flex flex-col min-w-0">
        {!selected ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
            <Layers className="w-8 h-8" />
            <p className="text-sm">Select a key to view its value</p>
            <p className="text-xs">Redis is a key-value store — every piece of data has a key (name) and a value</p>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <code className="text-lg font-mono font-bold text-foreground">{selected.key}</code>
              <Badge variant="outline" className={TYPE_COLORS[selected.type] ?? ""}>
                {selected.type}
              </Badge>
              {selected.ttl > 0 && (
                <Badge variant="outline" className="text-yellow-400 border-yellow-400/30 bg-yellow-400/10 text-xs">
                  TTL: {selected.ttl}s
                </Badge>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto h-7 w-7 text-red-400 hover:text-red-300"
                onClick={() => deleteKey(selected.key)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            {/* What this type means — helpful for users who don't know Redis */}
            <div className="text-xs text-muted-foreground bg-muted/20 rounded px-3 py-2 border border-border">
              {selected.type === "string" && "String — a single text or number value. The most common Redis type."}
              {selected.type === "list"   && "List — an ordered sequence of strings, like an array."}
              {selected.type === "hash"   && "Hash — a map of field → value pairs, like a JS object."}
              {selected.type === "set"    && "Set — a collection of unique strings, no duplicates."}
              {selected.type === "zset"   && "Sorted Set — like a set, but each item has a score for ordering."}
            </div>

            <div className="bg-muted/20 rounded-lg border border-border p-4 overflow-auto max-h-96">
              {renderValue(selected)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

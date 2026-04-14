"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Leaf, RefreshCw, ChevronRight, FileJson } from "lucide-react";

type Collection = { name: string; count: number };

export default function MongoPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selected, setSelected]       = useState<string | null>(null);
  const [docs, setDocs]               = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading]         = useState(true);
  const [docsLoading, setDocsLoading] = useState(false);
  const [activeDoc, setActiveDoc]     = useState<Record<string, unknown> | null>(null);

  async function fetchCollections() {
    setLoading(true);
    try {
      const res  = await fetch("/api/mongodb");
      const data = await res.json();
      setCollections(Array.isArray(data) ? data : []);
    } catch { setCollections([]); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchCollections(); }, []);

  async function selectCollection(name: string) {
    setSelected(name); setActiveDoc(null); setDocsLoading(true);
    try {
      const res  = await fetch(`/api/mongodb?collection=${encodeURIComponent(name)}`);
      const data = await res.json();
      setDocs(Array.isArray(data) ? data : []);
    } catch { setDocs([]); }
    finally { setDocsLoading(false); }
  }

  return (
    <div className="flex h-full">

      {/* Left: Collections */}
      <aside className="w-52 shrink-0 border-r border-border flex flex-col">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="w-4 h-4 text-primary" />
            <span className="text-sm font-mono font-medium text-primary">Collections</span>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={fetchCollections}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          {loading ? (
            <div className="p-3 space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-3 bg-muted rounded animate-pulse" />)}
            </div>
          ) : collections.length === 0 ? (
            <div className="p-4 text-xs text-muted-foreground">No collections yet.</div>
          ) : (
            <div className="p-2 space-y-0.5">
              {collections.map(col => (
                <button
                  key={col.name}
                  onClick={() => selectCollection(col.name)}
                  className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded text-xs transition-colors ${
                    selected === col.name
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  <Leaf className="w-3 h-3 shrink-0" />
                  <span className="truncate font-mono">{col.name}</span>
                  <Badge variant="outline" className="ml-auto text-[10px] px-1">{col.count}</Badge>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </aside>

      {/* Middle: Document list */}
      <div className="w-72 shrink-0 border-r border-border flex flex-col">
        <div className="px-4 py-3 border-b border-border">
          <span className="text-xs text-muted-foreground font-mono">
            {selected ? `${docs.length} documents` : "Select a collection"}
          </span>
        </div>
        <ScrollArea className="flex-1">
          {docsLoading ? (
            <div className="p-3 space-y-2">
              {[1,2,3,4].map(i => <div key={i} className="h-8 bg-muted rounded animate-pulse" />)}
            </div>
          ) : (
            <div className="p-2 space-y-0.5">
              {docs.map((doc, i) => (
                <button
                  key={i}
                  onClick={() => setActiveDoc(doc)}
                  className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded text-xs transition-colors ${
                    activeDoc === doc
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  <FileJson className="w-3 h-3 shrink-0" />
                  <span className="truncate font-mono">{String(doc._id)}</span>
                  {activeDoc === doc && <ChevronRight className="w-3 h-3 ml-auto shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Right: Document viewer */}
      <div className="flex-1 flex flex-col min-w-0">
        {!activeDoc ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
            <FileJson className="w-8 h-8" />
            <p className="text-sm">Select a document to inspect it</p>
            <p className="text-xs max-w-xs text-center">
              MongoDB stores data as JSON documents — flexible objects with any shape you want
            </p>
          </div>
        ) : (
          <div className="p-6 overflow-auto">
            <p className="text-xs text-muted-foreground font-mono mb-3">Document · {String(activeDoc._id)}</p>
            <pre className="text-sm font-mono bg-muted/20 border border-border rounded-lg p-4 overflow-auto text-foreground/90 leading-relaxed">
              {JSON.stringify(activeDoc, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

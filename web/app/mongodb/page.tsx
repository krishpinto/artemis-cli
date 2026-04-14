"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
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
      const data = await fetch("/api/mongodb").then(r => r.json());
      setCollections(Array.isArray(data) ? data : []);
    } catch { setCollections([]); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchCollections(); }, []);

  async function selectCollection(name: string) {
    setSelected(name); setActiveDoc(null); setDocsLoading(true);
    try {
      const data = await fetch(`/api/mongodb?collection=${encodeURIComponent(name)}`).then(r => r.json());
      setDocs(Array.isArray(data) ? data : []);
    } catch { setDocs([]); }
    finally { setDocsLoading(false); }
  }

  return (
    <div className="flex h-full bg-white">

      {/* ── Left: collections ── */}
      <aside className="w-52 shrink-0 border-r border-gray-200 flex flex-col">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="w-4 h-4 text-green-600" />
            <span className="text-sm font-semibold text-gray-800">Collections</span>
          </div>
          <button
            onClick={fetchCollections}
            className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
        <ScrollArea className="flex-1">
          {loading ? (
            <div className="p-3 space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />)}
            </div>
          ) : collections.length === 0 ? (
            <div className="p-4 text-xs text-gray-400">No collections yet.</div>
          ) : (
            <div className="p-2 space-y-0.5">
              {collections.map(col => (
                <button
                  key={col.name}
                  onClick={() => selectCollection(col.name)}
                  className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-xs transition-colors ${
                    selected === col.name
                      ? "bg-green-50 text-green-700 font-medium"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Leaf className="w-3 h-3 shrink-0" />
                  <span className="truncate font-mono">{col.name}</span>
                  <span className="ml-auto text-[10px] font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full shrink-0">
                    {col.count}
                  </span>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </aside>

      {/* ── Middle: document list ── */}
      <div className="w-64 shrink-0 border-r border-gray-200 flex flex-col">
        <div className="px-4 py-3 border-b border-gray-200">
          <span className="text-xs text-gray-500 font-mono">
            {selected ? `${docs.length} documents` : "Select a collection"}
          </span>
        </div>
        <ScrollArea className="flex-1">
          {docsLoading ? (
            <div className="p-3 space-y-2">
              {[1,2,3,4].map(i => <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />)}
            </div>
          ) : (
            <div className="p-2 space-y-0.5">
              {docs.map((doc, i) => (
                <button
                  key={i}
                  onClick={() => setActiveDoc(doc)}
                  className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-xs transition-colors ${
                    activeDoc === doc
                      ? "bg-green-50 text-green-700 font-medium"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
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

      {/* ── Right: document viewer ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {!activeDoc ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
            <FileJson className="w-8 h-8" />
            <p className="text-sm font-medium">Select a document to inspect it</p>
            <p className="text-xs max-w-xs text-center">
              MongoDB stores data as JSON documents — flexible objects with any shape
            </p>
          </div>
        ) : (
          <div className="p-6 overflow-auto">
            <p className="text-xs text-gray-400 font-mono mb-3">
              Document · <span className="text-gray-600">{String(activeDoc._id)}</span>
            </p>
            <pre className="text-sm font-mono bg-gray-50 border border-gray-200 rounded-xl p-5 overflow-auto text-gray-800 leading-relaxed shadow-sm">
              {JSON.stringify(activeDoc, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

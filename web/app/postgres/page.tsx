"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Database, Play, Table2, ChevronRight, Key, Hash } from "lucide-react";

type Column     = { column_name: string; data_type: string; is_nullable: string };
type TableDef   = { name: string; columns: Column[] };
type QueryResult = { rows: Record<string, unknown>[]; fields: string[]; rowCount: number; command: string; error?: string };

// Map Postgres types to a short display label + color
const TYPE_STYLE: Record<string, { label: string; color: string }> = {
  "integer":                    { label: "int4",      color: "text-blue-600 bg-blue-50"   },
  "bigint":                     { label: "int8",      color: "text-blue-600 bg-blue-50"   },
  "smallint":                   { label: "int2",      color: "text-blue-600 bg-blue-50"   },
  "text":                       { label: "text",      color: "text-green-700 bg-green-50" },
  "character varying":          { label: "varchar",   color: "text-green-700 bg-green-50" },
  "boolean":                    { label: "bool",      color: "text-orange-600 bg-orange-50"},
  "timestamp without time zone":{ label: "timestamp", color: "text-purple-600 bg-purple-50"},
  "timestamp with time zone":   { label: "timestampz",color: "text-purple-600 bg-purple-50"},
  "uuid":                       { label: "uuid",      color: "text-gray-600 bg-gray-100"  },
  "jsonb":                      { label: "jsonb",     color: "text-yellow-700 bg-yellow-50"},
  "json":                       { label: "json",      color: "text-yellow-700 bg-yellow-50"},
  "numeric":                    { label: "numeric",   color: "text-blue-600 bg-blue-50"   },
  "real":                       { label: "float4",    color: "text-blue-600 bg-blue-50"   },
  "double precision":           { label: "float8",    color: "text-blue-600 bg-blue-50"   },
};

function typeStyle(t: string) {
  return TYPE_STYLE[t] ?? { label: t, color: "text-gray-500 bg-gray-100" };
}

type Tab = "schema" | "data" | "sql";

export default function PostgresPage() {
  const [tables, setTables]         = useState<TableDef[]>([]);
  const [selected, setSelected]     = useState<string | null>(null);
  const [result, setResult]         = useState<QueryResult | null>(null);
  const [sql, setSql]               = useState("SELECT * FROM ");
  const [loading, setLoading]       = useState(false);
  const [tablesLoading, setTablesLoading] = useState(true);
  const [tab, setTab]               = useState<Tab>("schema");

  useEffect(() => {
    fetch("/api/postgres/tables")
      .then(r => r.json())
      .then(data => { setTables(Array.isArray(data) ? data : []); setTablesLoading(false); })
      .catch(() => setTablesLoading(false));
  }, []);

  async function selectTable(name: string) {
    setSelected(name);
    setSql(`SELECT * FROM "${name}" LIMIT 100;`);
    setTab("data");
    await runQuery(`SELECT * FROM "${name}" LIMIT 100;`);
  }

  async function runQuery(queryOverride?: string) {
    const q = queryOverride ?? sql;
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res  = await fetch("/api/postgres/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      setResult({
        rows:     Array.isArray(data.rows)   ? data.rows   : [],
        fields:   Array.isArray(data.fields) ? data.fields : [],
        rowCount: data.rowCount ?? 0,
        command:  data.command  ?? "",
        error:    data.error,
      });
    } catch (e) {
      setResult({ rows: [], fields: [], rowCount: 0, command: "", error: String(e) });
    } finally {
      setLoading(false);
    }
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: "schema", label: "Schema" },
    { id: "data",   label: "Table Data" },
    { id: "sql",    label: "SQL Editor" },
  ];

  return (
    <div className="flex h-full bg-white">

      {/* ── Left sidebar: table list ── */}
      <aside className="w-52 shrink-0 border-r border-gray-200 flex flex-col">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-semibold text-gray-800">Tables</span>
        </div>
        <ScrollArea className="flex-1">
          {tablesLoading ? (
            <div className="p-4 space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-3 bg-gray-100 rounded animate-pulse" />)}
            </div>
          ) : tables.length === 0 ? (
            <div className="p-4 text-xs text-gray-400">
              No tables yet. Create one in the SQL editor.
            </div>
          ) : (
            <div className="p-2 space-y-0.5">
              {tables.map(t => (
                <button
                  key={t.name}
                  onClick={() => selectTable(t.name)}
                  className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                    selected === t.name
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <Table2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate font-mono text-xs">{t.name}</span>
                  {selected === t.name && <ChevronRight className="w-3 h-3 ml-auto shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </aside>

      {/* ── Right: tabs ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Tab bar */}
        <div className="flex items-center gap-0 border-b border-gray-200 px-4">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              {t.label}
            </button>
          ))}
          {selected && (
            <span className="ml-auto text-xs text-gray-400 font-mono pr-2">{selected}</span>
          )}
        </div>

        {/* ── Schema tab ── */}
        {tab === "schema" && (
          <ScrollArea className="flex-1">
            {tablesLoading ? (
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1,2,3].map(i => (
                  <div key={i} className="border border-gray-200 rounded-xl p-4 animate-pulse">
                    <div className="h-4 bg-gray-100 rounded w-24 mb-3" />
                    <div className="space-y-2">
                      {[1,2,3].map(j => <div key={j} className="h-3 bg-gray-100 rounded" />)}
                    </div>
                  </div>
                ))}
              </div>
            ) : tables.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-24 text-gray-400 gap-2">
                <Table2 className="w-8 h-8" />
                <p className="text-sm">No tables yet</p>
                <p className="text-xs">Switch to the SQL Editor tab to create one</p>
              </div>
            ) : (
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 content-start">
                {tables.map(table => (
                  <div
                    key={table.name}
                    onClick={() => selectTable(table.name)}
                    className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group"
                  >
                    {/* Card header */}
                    <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200 group-hover:bg-blue-50 transition-colors">
                      <Table2 className="w-4 h-4 text-gray-500 group-hover:text-blue-600 transition-colors shrink-0" />
                      <span className="font-semibold text-gray-800 text-sm font-mono group-hover:text-blue-700 transition-colors truncate">
                        {table.name}
                      </span>
                      <span className="ml-auto text-xs text-gray-400 font-mono shrink-0">
                        {table.columns.length} col{table.columns.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* Column list */}
                    <div className="divide-y divide-gray-100">
                      {table.columns.slice(0, 8).map((col, i) => {
                        const { label, color } = typeStyle(col.data_type);
                        const isPk = col.column_name === "id";
                        return (
                          <div key={col.column_name} className="flex items-center gap-3 px-4 py-2">
                            {/* PK indicator */}
                            <div className="w-4 shrink-0 flex justify-center">
                              {isPk
                                ? <Key className="w-3 h-3 text-yellow-500" />
                                : <Hash className="w-3 h-3 text-gray-300" />
                              }
                            </div>
                            <span className="flex-1 text-xs font-mono text-gray-700 truncate">
                              {col.column_name}
                            </span>
                            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-medium ${color}`}>
                              {label}
                            </span>
                            {col.is_nullable === "YES" && (
                              <span className="text-[10px] text-gray-300 font-mono">null</span>
                            )}
                          </div>
                        );
                      })}
                      {table.columns.length > 8 && (
                        <div className="px-4 py-2 text-xs text-gray-400 font-mono">
                          +{table.columns.length - 8} more columns
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        )}

        {/* ── Table data tab ── */}
        {tab === "data" && (
          <div className="flex-1 overflow-auto">
            {!result ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                <Table2 className="w-8 h-8" />
                <p className="text-sm">Select a table from the sidebar</p>
              </div>
            ) : result.error ? (
              <div className="p-4 text-sm text-red-600 font-mono bg-red-50 m-4 rounded-lg border border-red-200">
                {result.error}
              </div>
            ) : (
              <div className="overflow-auto h-full">
                <table className="w-full text-xs font-mono border-collapse">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr className="border-b border-gray-200">
                      {result.fields.map(f => (
                        <th key={f} className="text-left px-4 py-2.5 text-gray-500 font-semibold whitespace-nowrap text-[11px] uppercase tracking-wide">
                          {f}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.length === 0 ? (
                      <tr>
                        <td colSpan={result.fields.length} className="px-4 py-10 text-center text-gray-400 text-sm">
                          No rows found
                        </td>
                      </tr>
                    ) : (
                      result.rows.map((row, i) => (
                        <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          {result.fields.map(f => (
                            <td key={f} className="px-4 py-2 whitespace-nowrap text-gray-700 max-w-xs truncate">
                              {row[f] === null
                                ? <span className="text-gray-300 italic">null</span>
                                : String(row[f])}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                <div className="px-4 py-2 border-t border-gray-200 text-xs text-gray-400">
                  {result.rowCount} row{result.rowCount !== 1 ? "s" : ""}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── SQL editor tab ── */}
        {tab === "sql" && (
          <div className="flex-1 flex flex-col p-5 gap-4 overflow-auto">
            <Textarea
              value={sql}
              onChange={e => setSql(e.target.value)}
              placeholder="SELECT * FROM your_table;"
              className="font-mono text-sm resize-none bg-gray-50 border-gray-200 min-h-40 text-gray-800 focus:ring-blue-500 focus:border-blue-500"
              onKeyDown={e => {
                if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                  e.preventDefault();
                  runQuery();
                }
              }}
            />
            <div className="flex items-center gap-3">
              <Button
                onClick={() => runQuery()}
                disabled={loading}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Play className="w-3.5 h-3.5 mr-2" />
                {loading ? "Running..." : "Run Query"}
              </Button>
              <span className="text-xs text-gray-400">or Ctrl+Enter</span>
            </div>

            {result?.error && (
              <div className="p-3 text-sm text-red-600 font-mono bg-red-50 rounded-lg border border-red-200">
                {result.error}
              </div>
            )}

            {result && !result.error && (
              <div className="overflow-auto border border-gray-200 rounded-xl flex-1 shadow-sm">
                <table className="w-full text-xs font-mono border-collapse">
                  <thead className="sticky top-0 bg-white border-b border-gray-200">
                    <tr>
                      {result.fields.map(f => (
                        <th key={f} className="text-left px-4 py-2.5 text-gray-500 font-semibold whitespace-nowrap text-[11px] uppercase tracking-wide">
                          {f}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((row, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        {result.fields.map(f => (
                          <td key={f} className="px-4 py-2 whitespace-nowrap text-gray-700">
                            {row[f] === null ? <span className="text-gray-300 italic">null</span> : String(row[f])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-4 py-2 border-t border-gray-200 text-xs text-gray-400 flex items-center gap-2">
                  <span className="font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px]">{result.command}</span>
                  {result.rowCount} row{result.rowCount !== 1 ? "s" : ""}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

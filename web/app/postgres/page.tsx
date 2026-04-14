"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, Play, Table2, ChevronRight } from "lucide-react";

type Column = { column_name: string; data_type: string; is_nullable: string };
type TableDef = { name: string; columns: Column[] };
type QueryResult = { rows: Record<string, unknown>[]; fields: string[]; rowCount: number; command: string; error?: string };

export default function PostgresPage() {
  const [tables, setTables]         = useState<TableDef[]>([]);
  const [selected, setSelected]     = useState<string | null>(null);
  const [result, setResult]         = useState<QueryResult | null>(null);
  const [sql, setSql]               = useState("SELECT * FROM ");
  const [loading, setLoading]       = useState(false);
  const [tablesLoading, setTablesLoading] = useState(true);

  // Load table list on mount
  useEffect(() => {
    fetch("/api/postgres/tables")
      .then(r => r.json())
      .then(data => { setTables(data); setTablesLoading(false); })
      .catch(() => setTablesLoading(false));
  }, []);

  // When a table is clicked — run SELECT * to show its rows
  async function selectTable(name: string) {
    setSelected(name);
    setSql(`SELECT * FROM "${name}" LIMIT 100;`);
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
      setResult(data);
    } catch (e) {
      setResult({ rows: [], fields: [], rowCount: 0, command: "", error: String(e) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full">

      {/* Left: Table list */}
      <aside className="w-52 shrink-0 border-r border-border flex flex-col">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Database className="w-4 h-4 text-primary" />
          <span className="text-sm font-mono font-medium text-primary">Tables</span>
        </div>
        <ScrollArea className="flex-1">
          {tablesLoading ? (
            <div className="p-4 space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-3 bg-muted rounded animate-pulse" />)}
            </div>
          ) : tables.length === 0 ? (
            <div className="p-4 text-xs text-muted-foreground">
              No tables yet. Create one using the SQL editor.
            </div>
          ) : (
            <div className="p-2 space-y-0.5">
              {tables.map(t => (
                <button
                  key={t.name}
                  onClick={() => selectTable(t.name)}
                  className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
                    selected === t.name
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
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

      {/* Right: Data + SQL editor */}
      <div className="flex-1 flex flex-col min-w-0">
        <Tabs defaultValue="data" className="flex flex-col h-full">
          <div className="flex items-center justify-between px-4 py-2 border-b border-border">
            <TabsList className="bg-muted/30">
              <TabsTrigger value="data" className="text-xs">Table Data</TabsTrigger>
              <TabsTrigger value="sql"  className="text-xs">SQL Editor</TabsTrigger>
            </TabsList>
            {selected && (
              <span className="text-xs text-muted-foreground font-mono">{selected}</span>
            )}
          </div>

          {/* Table data view */}
          <TabsContent value="data" className="flex-1 overflow-auto m-0 p-0">
            {!result ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                <Table2 className="w-8 h-8" />
                <p className="text-sm">Select a table to view its data</p>
              </div>
            ) : result.error ? (
              <div className="p-4 text-sm text-red-400 font-mono bg-red-500/5 m-4 rounded border border-red-500/20">
                {result.error}
              </div>
            ) : (
              <div className="overflow-auto h-full">
                <table className="w-full text-xs font-mono border-collapse">
                  <thead className="sticky top-0 bg-background z-10">
                    <tr>
                      {result.fields.map(f => (
                        <th key={f} className="text-left px-4 py-2 border-b border-border text-muted-foreground font-medium whitespace-nowrap">
                          {f}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.length === 0 ? (
                      <tr>
                        <td colSpan={result.fields.length} className="px-4 py-8 text-center text-muted-foreground">
                          No rows found
                        </td>
                      </tr>
                    ) : (
                      result.rows.map((row, i) => (
                        <tr key={i} className="border-b border-border/50 hover:bg-white/3 transition-colors">
                          {result.fields.map(f => (
                            <td key={f} className="px-4 py-2 whitespace-nowrap text-foreground/80 max-w-xs truncate">
                              {row[f] === null
                                ? <span className="text-muted-foreground italic">null</span>
                                : String(row[f])}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground">
                  {result.rowCount} row{result.rowCount !== 1 ? "s" : ""}
                </div>
              </div>
            )}
          </TabsContent>

          {/* SQL editor */}
          <TabsContent value="sql" className="flex-1 flex flex-col m-0 p-4 gap-3">
            <Textarea
              value={sql}
              onChange={e => setSql(e.target.value)}
              placeholder="SELECT * FROM your_table;"
              className="flex-1 font-mono text-sm resize-none bg-muted/30 border-border min-h-32"
              onKeyDown={e => {
                // Ctrl+Enter or Cmd+Enter runs the query
                if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                  e.preventDefault();
                  runQuery();
                }
              }}
            />
            <div className="flex items-center gap-3">
              <Button onClick={() => runQuery()} disabled={loading} size="sm">
                <Play className="w-3.5 h-3.5 mr-2" />
                {loading ? "Running..." : "Run Query"}
              </Button>
              <span className="text-xs text-muted-foreground">or Ctrl+Enter</span>
            </div>

            {/* Query results */}
            {result && !result.error && (
              <div className="overflow-auto border border-border rounded-md flex-1">
                <table className="w-full text-xs font-mono border-collapse">
                  <thead className="sticky top-0 bg-background">
                    <tr>
                      {result.fields.map(f => (
                        <th key={f} className="text-left px-3 py-2 border-b border-border text-muted-foreground font-medium whitespace-nowrap">
                          {f}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((row, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-white/3">
                        {result.fields.map(f => (
                          <td key={f} className="px-3 py-1.5 whitespace-nowrap text-foreground/80">
                            {row[f] === null ? <span className="text-muted-foreground italic">null</span> : String(row[f])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-3 py-1.5 border-t border-border text-xs text-muted-foreground flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-mono">{result.command}</Badge>
                  {result.rowCount} row{result.rowCount !== 1 ? "s" : ""}
                </div>
              </div>
            )}

            {result?.error && (
              <div className="p-3 text-sm text-red-400 font-mono bg-red-500/5 rounded border border-red-500/20">
                {result.error}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

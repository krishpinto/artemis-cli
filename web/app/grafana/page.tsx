"use client";
import { BarChart2, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function GrafanaPage() {
  return (
    <div className="p-8 max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <BarChart2 className="w-6 h-6 text-orange-400" />
        <h1 className="text-xl font-bold text-gray-900">Grafana</h1>
        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-mono">port 3000</span>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-3">
        <p className="text-sm font-semibold text-gray-700">Login Details</p>
        <div className="space-y-2 font-mono text-sm">
          {[
            ["URL",      "http://localhost:3000"],
            ["Username", "admin"],
            ["Password", "admin"],
          ].map(([k, v]) => (
            <div key={k} className="flex gap-4">
              <span className="text-gray-400 w-24 shrink-0">{k}</span>
              <span className="text-gray-800">{v}</span>
            </div>
          ))}
        </div>
      </div>

      <a
        href="http://localhost:3000"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 w-fit bg-orange-400 hover:bg-orange-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        <ExternalLink className="w-4 h-4" />
        Open Grafana
      </a>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 space-y-1">
        <p className="font-semibold">Quick setup</p>
        <ol className="list-decimal list-inside space-y-1 text-blue-700">
          <li>Open Grafana → Connections → Data Sources → Add</li>
          <li>Pick <strong>Prometheus</strong> → URL: <code className="font-mono text-xs">http://artemis-prometheus-svc:9090</code></li>
          <li>Pick <strong>PostgreSQL</strong> → Host: <code className="font-mono text-xs">artemis-postgres-svc:5432</code></li>
          <li>Build your first dashboard</li>
        </ol>
      </div>

      <p className="text-sm text-gray-500">
        See the <Link href="/docs" className="text-blue-600 hover:underline">Docs</Link> tab for Grafana HTTP API snippets.
      </p>
    </div>
  );
}

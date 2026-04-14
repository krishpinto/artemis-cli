"use client";
import { Flame, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function PrometheusPage() {
  return (
    <div className="p-8 max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Flame className="w-6 h-6 text-orange-500" />
        <h1 className="text-xl font-bold text-gray-900">Prometheus</h1>
        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-mono">port 9090</span>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-3">
        <p className="text-sm font-semibold text-gray-700">Connection Details</p>
        <div className="space-y-2 font-mono text-sm">
          {[
            ["Endpoint", "http://localhost:9090"],
            ["Auth",     "none (open)"],
          ].map(([k, v]) => (
            <div key={k} className="flex gap-4">
              <span className="text-gray-400 w-24 shrink-0">{k}</span>
              <span className="text-gray-800">{v}</span>
            </div>
          ))}
        </div>
      </div>

      <a
        href="http://localhost:9090"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 w-fit bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        <ExternalLink className="w-4 h-4" />
        Open Prometheus UI
      </a>

      <p className="text-sm text-gray-500">
        Point Grafana at <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono">http://artemis-prometheus-svc:9090</code> to build dashboards. See the <Link href="/docs" className="text-blue-600 hover:underline">Docs</Link> tab for instrumenting your app.
      </p>
    </div>
  );
}

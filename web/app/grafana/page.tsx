"use client";
import { BarChart2 } from "lucide-react";

export default function GrafanaPage() {
  return (
    <div className="flex flex-col h-full">
      {/* Header strip — credentials visible so user doesn't have to remember them */}
      <div className="shrink-0 px-5 py-3 border-b border-gray-200 flex items-center gap-6 bg-white">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-orange-400" />
          <span className="font-semibold text-sm text-gray-900">Grafana</span>
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-mono">port 30300</span>
        </div>
        <div className="flex items-center gap-4 font-mono text-xs text-gray-500">
          <span><span className="text-gray-400">user</span> admin</span>
          <span><span className="text-gray-400">pass</span> admin</span>
        </div>
      </div>

      {/* Full-height iframe — Grafana has its own complete UI */}
      <iframe
        src="http://localhost:30300"
        className="flex-1 w-full border-0"
        allow="same-origin"
      />
    </div>
  );
}

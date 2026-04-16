"use client";
import { Flame } from "lucide-react";

export default function PrometheusPage() {
  return (
    <div className="flex flex-col h-full">
      {/* Header strip */}
      <div className="shrink-0 px-5 py-3 border-b border-gray-200 flex items-center gap-6 bg-white">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-500" />
          <span className="font-semibold text-sm text-gray-900">Prometheus</span>
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-mono">port 30090</span>
        </div>
        <div className="flex items-center gap-4 font-mono text-xs text-gray-500">
          <span><span className="text-gray-400">auth</span> none</span>
          <span><span className="text-gray-400">endpoint</span> http://localhost:30090</span>
        </div>
      </div>

      {/* Full-height iframe — Prometheus has its own query UI */}
      <iframe
        src="http://localhost:30090"
        className="flex-1 w-full border-0"
        allow="same-origin"
      />
    </div>
  );
}

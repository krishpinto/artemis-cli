"use client";
import { Flame, ExternalLink } from "lucide-react";

export default function PrometheusPage() {
  return (
    <div className="flex flex-col h-full bg-white">
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

      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-5 max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto">
            <Flame className="w-7 h-7 text-orange-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Prometheus</h2>
            <p className="text-sm text-gray-500 mt-1">
              Metrics collection and monitoring engine. Prometheus blocks embedding — open it in a dedicated tab for the full query UI.
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-left space-y-2">
            <p className="text-xs font-mono text-gray-500"><span className="text-gray-400">URL</span>    http://localhost:30090</p>
            <p className="text-xs font-mono text-gray-500"><span className="text-gray-400">Auth</span>   none required</p>
          </div>
          <a
            href="http://localhost:30090"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors"
          >
            Open Prometheus
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}

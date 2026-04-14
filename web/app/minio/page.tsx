"use client";
import { HardDrive, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function MinIOPage() {
  return (
    <div className="p-8 max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <HardDrive className="w-6 h-6 text-blue-600" />
        <h1 className="text-xl font-bold text-gray-900">MinIO</h1>
        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-mono">port 9000</span>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-3">
        <p className="text-sm font-semibold text-gray-700">Connection Details</p>
        <div className="space-y-2 font-mono text-sm">
          {[
            ["Endpoint",   "http://localhost:9000"],
            ["Access Key", "artemis"],
            ["Secret Key", "artemis123"],
          ].map(([k, v]) => (
            <div key={k} className="flex gap-4">
              <span className="text-gray-400 w-28 shrink-0">{k}</span>
              <span className="text-gray-800">{v}</span>
            </div>
          ))}
        </div>
      </div>

      <a
        href="http://localhost:9000"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 w-fit bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        <ExternalLink className="w-4 h-4" />
        Open MinIO Console
      </a>

      <p className="text-sm text-gray-500">
        MinIO is S3-compatible — use the <Link href="/docs" className="text-blue-600 hover:underline">Docs</Link> tab for AWS SDK snippets.
      </p>
    </div>
  );
}

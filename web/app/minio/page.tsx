"use client";
import { HardDrive } from "lucide-react";

export default function MinIOPage() {
  return (
    <div className="flex flex-col h-full">
      {/* Header strip — show both ports: 30900 = S3 API, 30901 = web console */}
      <div className="shrink-0 px-5 py-3 border-b border-gray-200 flex items-center gap-6 bg-white">
        <div className="flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-blue-600" />
          <span className="font-semibold text-sm text-gray-900">MinIO</span>
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-mono">console 30901</span>
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-mono">S3 API 30900</span>
        </div>
        <div className="flex items-center gap-4 font-mono text-xs text-gray-500">
          <span><span className="text-gray-400">access</span> artemis</span>
          <span><span className="text-gray-400">secret</span> artemis123</span>
        </div>
      </div>

      {/* Full-height iframe — embed the MinIO web console (port 30901, not the S3 API port) */}
      <iframe
        src="http://localhost:30901"
        className="flex-1 w-full border-0"
        allow="same-origin"
      />
    </div>
  );
}

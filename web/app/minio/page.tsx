"use client";
import { HardDrive, ExternalLink } from "lucide-react";

export default function MinIOPage() {
  return (
    <div className="flex flex-col h-full bg-white">
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

      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-5 max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto">
            <HardDrive className="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">MinIO Console</h2>
            <p className="text-sm text-gray-500 mt-1">
              S3-compatible object storage. MinIO blocks embedding — open the console in a dedicated tab to manage buckets and files.
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-left space-y-2">
            <p className="text-xs font-mono text-gray-500"><span className="text-gray-400">Console</span>  http://localhost:30901</p>
            <p className="text-xs font-mono text-gray-500"><span className="text-gray-400">S3 API</span>   http://localhost:30900</p>
            <p className="text-xs font-mono text-gray-500"><span className="text-gray-400">Access</span>   artemis</p>
            <p className="text-xs font-mono text-gray-500"><span className="text-gray-400">Secret</span>   artemis123</p>
          </div>
          <a
            href="http://localhost:30901"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Open MinIO Console
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}

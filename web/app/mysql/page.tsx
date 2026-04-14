"use client";
import { Fish, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function MySQLPage() {
  return (
    <div className="p-8 max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Fish className="w-6 h-6 text-blue-600" />
        <h1 className="text-xl font-bold text-gray-900">MySQL</h1>
        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-mono">port 3306</span>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-3">
        <p className="text-sm font-semibold text-gray-700">Connection Details</p>
        <div className="space-y-2 font-mono text-sm">
          {[
            ["Host",     "localhost"],
            ["Port",     "3306"],
            ["User",     "artemis"],
            ["Password", "artemis"],
            ["Database", "artemis"],
          ].map(([k, v]) => (
            <div key={k} className="flex gap-4">
              <span className="text-gray-400 w-24 shrink-0">{k}</span>
              <span className="text-gray-800">{v}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
        <p className="text-sm font-semibold text-gray-700 mb-2">Connection String</p>
        <code className="text-xs text-blue-600 bg-blue-50 border border-blue-200 px-3 py-2 rounded-lg block">
          mysql://artemis:artemis@localhost:3306/artemis
        </code>
      </div>

      <p className="text-sm text-gray-500">
        Use the <Link href="/docs" className="text-blue-600 hover:underline">Docs</Link> tab for copy-paste connection snippets in Node.js, Python, and Prisma.
      </p>
    </div>
  );
}

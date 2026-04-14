"use client";
import { Rabbit, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function RabbitMQPage() {
  return (
    <div className="p-8 max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Rabbit className="w-6 h-6 text-orange-600" />
        <h1 className="text-xl font-bold text-gray-900">RabbitMQ</h1>
        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-mono">port 5672</span>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-3">
        <p className="text-sm font-semibold text-gray-700">Connection Details</p>
        <div className="space-y-2 font-mono text-sm">
          {[
            ["Host",       "localhost"],
            ["AMQP Port",  "5672"],
            ["Mgmt Port",  "15672"],
            ["Username",   "artemis"],
            ["Password",   "artemis"],
          ].map(([k, v]) => (
            <div key={k} className="flex gap-4">
              <span className="text-gray-400 w-28 shrink-0">{k}</span>
              <span className="text-gray-800">{v}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
        <p className="text-sm font-semibold text-gray-700 mb-2">Connection String</p>
        <code className="text-xs text-blue-600 bg-blue-50 border border-blue-200 px-3 py-2 rounded-lg block">
          amqp://artemis:artemis@localhost:5672
        </code>
      </div>

      <a
        href="http://localhost:15672"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 w-fit bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        <ExternalLink className="w-4 h-4" />
        Open Management UI
      </a>

      <p className="text-sm text-gray-500">
        The management UI runs on port 15672. See the <Link href="/docs" className="text-blue-600 hover:underline">Docs</Link> tab for publish/consume snippets in Node.js and Python.
      </p>
    </div>
  );
}

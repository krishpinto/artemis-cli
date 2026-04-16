"use client";
import { Rabbit } from "lucide-react";

export default function RabbitMQPage() {
  return (
    <div className="flex flex-col h-full">
      {/* Header strip — show both ports: 30672 = AMQP, 30673 = management UI */}
      <div className="shrink-0 px-5 py-3 border-b border-gray-200 flex items-center gap-6 bg-white">
        <div className="flex items-center gap-2">
          <Rabbit className="w-4 h-4 text-orange-600" />
          <span className="font-semibold text-sm text-gray-900">RabbitMQ</span>
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-mono">mgmt 30673</span>
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-mono">AMQP 30672</span>
        </div>
        <div className="flex items-center gap-4 font-mono text-xs text-gray-500">
          <span><span className="text-gray-400">user</span> artemis</span>
          <span><span className="text-gray-400">pass</span> artemis</span>
          <span><span className="text-gray-400">vhost</span> /</span>
        </div>
      </div>

      {/* Full-height iframe — embed the RabbitMQ management UI (port 30673) */}
      <iframe
        src="http://localhost:30673"
        className="flex-1 w-full border-0"
        allow="same-origin"
      />
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Copy, Check, ExternalLink, Activity, Server, Wifi, Clock } from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Service = {
  id: string;
  name: string;
  port: number;
  connectionString: string;
  status: "online" | "offline" | "loading";
};

const SERVICE_ICONS: Record<string, string> = {
  postgres:   "🐘",
  redis:      "⚡",
  mongodb:    "🍃",
  grafana:    "📊",
  minio:      "🪣",
  prometheus: "🔥",
};

// Generate mock sparkline data once at module level (stable across renders)
function generateSparkline(base: number, variance: number, points = 12) {
  return Array.from({ length: points }, (_, i) => ({
    t: i,
    v: Math.max(0, base + Math.floor((Math.random() - 0.5) * variance)),
  }));
}

const SPARKLINES: Record<string, { t: number; v: number }[]> = {
  postgres:   generateSparkline(38, 18),
  redis:      generateSparkline(72, 30),
  mongodb:    generateSparkline(24, 12),
  grafana:    generateSparkline(8,  6),
  minio:      generateSparkline(15, 10),
  prometheus: generateSparkline(5,  4),
};

// 24-hour activity chart data (generated once)
const HOURS = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`,
  postgres:   Math.max(0, 35 + Math.floor((Math.random() - 0.4) * 25)),
  redis:      Math.max(0, 65 + Math.floor((Math.random() - 0.4) * 35)),
  mongodb:    Math.max(0, 20 + Math.floor((Math.random() - 0.4) * 15)),
  grafana:    Math.max(0, 6  + Math.floor((Math.random() - 0.4) * 5)),
}));

export default function Dashboard() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading]   = useState(true);
  const [copied, setCopied]     = useState<string | null>(null);

  async function fetchStatus() {
    setLoading(true);
    try {
      const res  = await fetch("/api/services");
      const data = await res.json();
      setServices(data);
    } catch {
      setServices([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchStatus(); }, []);

  function copyString(str: string, id: string) {
    navigator.clipboard.writeText(str);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  const online = services.filter(s => s.status === "online").length;
  const total  = services.length || 6;

  const statCards = [
    {
      label: "Services Online",
      value: loading ? "—" : `${online} / ${total}`,
      icon: Server,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Active Connections",
      value: loading ? "—" : "142",
      icon: Wifi,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Uptime",
      value: "99.9%",
      icon: Activity,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      label: "Last Deploy",
      value: "2 hours ago",
      icon: Clock,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
  ];

  return (
    <div className="p-8 max-w-6xl space-y-8">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? "Checking service status…" : `${online} of ${total} services running`}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchStatus}
          disabled={loading}
          className="border-gray-200 text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
              <div className={`${bg} p-1.5 rounded-lg`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Service cards grid */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Services</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm animate-pulse"
                >
                  <div className="h-4 bg-gray-100 rounded w-24 mb-3" />
                  <div className="h-3 bg-gray-100 rounded w-full mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                </div>
              ))
            : services.map(svc => {
                const isOnline = svc.status === "online";
                const sparkData = SPARKLINES[svc.id] ?? generateSparkline(10, 5);

                return (
                  <div
                    key={svc.id}
                    className={`bg-white border rounded-xl p-5 shadow-sm transition-opacity ${
                      isOnline ? "border-gray-200" : "border-gray-200 opacity-60"
                    }`}
                  >
                    {/* Card header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg leading-none">{SERVICE_ICONS[svc.id] ?? "🛰️"}</span>
                        <span className="font-semibold text-gray-900 text-sm">{svc.name}</span>
                      </div>
                      <Badge
                        className={
                          isOnline
                            ? "bg-green-50 text-green-700 border border-green-200 text-xs px-2 py-0.5 rounded-full font-medium"
                            : "bg-red-50 text-red-600 border border-red-200 text-xs px-2 py-0.5 rounded-full font-medium"
                        }
                      >
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 inline-block ${
                          isOnline ? "bg-green-500" : "bg-red-400"
                        }`} />
                        {svc.status}
                      </Badge>
                    </div>

                    {/* Sparkline */}
                    <div className="h-14 mb-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={isOnline ? sparkData : sparkData.map(d => ({ ...d, v: 0 }))} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id={`grad-${svc.id}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%"  stopColor={isOnline ? "#2563eb" : "#9ca3af"} stopOpacity={0.15} />
                              <stop offset="95%" stopColor={isOnline ? "#2563eb" : "#9ca3af"} stopOpacity={0}    />
                            </linearGradient>
                          </defs>
                          <Area
                            type="monotone"
                            dataKey="v"
                            stroke={isOnline ? "#2563eb" : "#9ca3af"}
                            strokeWidth={1.5}
                            fill={`url(#grad-${svc.id})`}
                            dot={false}
                            isAnimationActive={false}
                          />
                          <Tooltip
                            contentStyle={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, border: "1px solid #e5e7eb" }}
                            labelFormatter={() => ""}
                            formatter={(v) => [v, "conn"]}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Connection string */}
                    <div className="flex items-center gap-2 mb-3">
                      <code className="text-xs text-gray-500 bg-gray-50 border border-gray-200 px-2 py-1.5 rounded-lg flex-1 truncate font-mono">
                        {svc.connectionString}
                      </code>
                      <button
                        className="h-7 w-7 shrink-0 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                        onClick={() => copyString(svc.connectionString, svc.id)}
                        title="Copy connection string"
                      >
                        {copied === svc.id
                          ? <Check className="w-3.5 h-3.5 text-green-500" />
                          : <Copy className="w-3.5 h-3.5 text-gray-400" />
                        }
                      </button>
                    </div>

                    {/* Open button for HTTP services */}
                    {["grafana", "minio", "prometheus"].includes(svc.id) && isOnline && (
                      <a
                        href={svc.connectionString}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Open in browser
                      </a>
                    )}
                  </div>
                );
              })
          }
        </div>
      </div>

      {/* 24-hour activity chart */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-sm font-semibold text-gray-900">Service Activity</h2>
          <p className="text-xs text-gray-500 mt-0.5">Active connections over the last 24 hours</p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 mb-4 flex-wrap">
          {[
            { key: "postgres",  label: "PostgreSQL", color: "#2563eb" },
            { key: "redis",     label: "Redis",      color: "#7c3aed" },
            { key: "mongodb",   label: "MongoDB",    color: "#059669" },
            { key: "grafana",   label: "Grafana",    color: "#ea580c" },
          ].map(({ key, label, color }) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className="w-3 h-1.5 rounded-full inline-block" style={{ backgroundColor: color }} />
              <span className="text-xs text-gray-500">{label}</span>
            </div>
          ))}
        </div>

        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={HOURS} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
              <defs>
                {[
                  { id: "pg",  color: "#2563eb" },
                  { id: "rd",  color: "#7c3aed" },
                  { id: "mg",  color: "#059669" },
                  { id: "gf",  color: "#ea580c" },
                ].map(({ id, color }) => (
                  <linearGradient key={id} id={`activity-${id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={color} stopOpacity={0.12} />
                    <stop offset="95%" stopColor={color} stopOpacity={0}    />
                  </linearGradient>
                ))}
              </defs>
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
                interval={5}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
                }}
              />
              <Area type="monotone" dataKey="postgres" stroke="#2563eb" strokeWidth={1.5} fill="url(#activity-pg)" dot={false} />
              <Area type="monotone" dataKey="redis"    stroke="#7c3aed" strokeWidth={1.5} fill="url(#activity-rd)" dot={false} />
              <Area type="monotone" dataKey="mongodb"  stroke="#059669" strokeWidth={1.5} fill="url(#activity-mg)" dot={false} />
              <Area type="monotone" dataKey="grafana"  stroke="#ea580c" strokeWidth={1.5} fill="url(#activity-gf)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Empty state */}
      {!loading && services.every(s => s.status === "offline") && (
        <div className="mt-4 text-center py-12 border border-dashed border-gray-200 rounded-xl bg-gray-50">
          <Server className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm font-medium">No services running</p>
          <p className="text-gray-400 text-xs mt-1">
            Run <code className="text-blue-600 font-mono bg-blue-50 px-1 py-0.5 rounded">artemis connect</code> in your terminal first.
          </p>
        </div>
      )}

    </div>
  );
}

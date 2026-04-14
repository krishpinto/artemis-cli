"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Rocket, RefreshCw, Copy, Check, ExternalLink } from "lucide-react";

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
  const total  = services.length;

  return (
    <div className="p-8 max-w-5xl">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Rocket className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold font-mono text-primary tracking-wide">Mission Control</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            {loading ? "Scanning services..." : `${online} of ${total} services in orbit`}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchStatus} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Service cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-2">
                  <div className="h-4 bg-muted rounded w-24" />
                </CardHeader>
                <CardContent>
                  <div className="h-3 bg-muted rounded w-full mb-2" />
                  <div className="h-3 bg-muted rounded w-3/4" />
                </CardContent>
              </Card>
            ))
          : services.map(svc => (
              <Card
                key={svc.id}
                className={`border transition-colors ${
                  svc.status === "online"
                    ? "border-primary/20 bg-card"
                    : "border-border opacity-60"
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-mono flex items-center gap-2">
                      <span>{SERVICE_ICONS[svc.id] ?? "🛰️"}</span>
                      {svc.name}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className={
                        svc.status === "online"
                          ? "border-green-500/40 text-green-400 bg-green-500/10"
                          : "border-red-500/40 text-red-400 bg-red-500/10"
                      }
                    >
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 inline-block ${
                        svc.status === "online" ? "bg-green-400" : "bg-red-400"
                      }`} />
                      {svc.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <code className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded flex-1 truncate font-mono">
                      {svc.connectionString}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => copyString(svc.connectionString, svc.id)}
                    >
                      {copied === svc.id
                        ? <Check className="w-3.5 h-3.5 text-green-400" />
                        : <Copy className="w-3.5 h-3.5" />
                      }
                    </Button>
                  </div>

                  {["grafana", "minio", "prometheus"].includes(svc.id) && svc.status === "online" && (
                    <a
                      href={svc.connectionString}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Open in browser
                    </a>
                  )}
                </CardContent>
              </Card>
            ))
        }
      </div>

      {!loading && services.every(s => s.status === "offline") && (
        <div className="mt-8 text-center py-12 border border-dashed border-border rounded-lg">
          <Rocket className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No services in orbit.</p>
          <p className="text-muted-foreground text-xs mt-1">
            Run <code className="text-primary font-mono">artemis connect</code> in your terminal first.
          </p>
        </div>
      )}

    </div>
  );
}

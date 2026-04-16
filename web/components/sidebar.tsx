"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Database,
  Layers,
  FileText,
  Leaf,
  Fish,
  HardDrive,
  Flame,
  BarChart2,
  Rabbit,
} from "lucide-react";

// Maps service id from /api/services → the nav item href
const SERVICE_NAV: Record<string, { href: string; label: string; icon: React.ElementType; section?: string }> = {
  postgres:   { href: "/postgres",   label: "PostgreSQL", icon: Database,       section: "Databases"     },
  redis:      { href: "/redis",      label: "Redis",      icon: Layers                                    },
  mongodb:    { href: "/mongodb",    label: "MongoDB",    icon: Leaf                                      },
  mysql:      { href: "/mysql",      label: "MySQL",      icon: Fish                                      },
  minio:      { href: "/minio",      label: "MinIO",      icon: HardDrive,      section: "Storage & Ops" },
  prometheus: { href: "/prometheus", label: "Prometheus", icon: Flame                                     },
  grafana:    { href: "/grafana",    label: "Grafana",    icon: BarChart2                                 },
  rabbitmq:   { href: "/rabbitmq",   label: "RabbitMQ",   icon: Rabbit                                   },
};

export default function Sidebar() {
  const pathname = usePathname();
  const [onlineIds, setOnlineIds] = useState<string[]>([]);

  // Poll /api/services every 10s to keep sidebar in sync with what's actually running
  useEffect(() => {
    async function check() {
      try {
        const data = await fetch("/api/services").then(r => r.json());
        if (Array.isArray(data)) {
          setOnlineIds(data.filter((s: { status: string }) => s.status === "online").map((s: { id: string }) => s.id));
        }
      } catch { /* silently ignore — sidebar just won't show services */ }
    }
    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, []);

  // Build the visible nav: always show Dashboard + Docs, show service pages only if online
  const serviceItems = onlineIds
    .map(id => SERVICE_NAV[id])
    .filter(Boolean);

  // Group service items by section header
  const grouped: { section?: string; href: string; label: string; icon: React.ElementType }[] = [];
  const seenSections = new Set<string>();

  for (const item of serviceItems) {
    if (item.section && !seenSections.has(item.section)) {
      seenSections.add(item.section);
    }
    grouped.push(item);
  }

  return (
    <aside className="flex flex-col w-56 shrink-0 border-r border-gray-200 bg-white h-screen sticky top-0">

      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-gray-200">
        <img src="/artemis-logo.png" alt="Artemis" width={44} height={44} className="shrink-0" />
        <span className="font-bold tracking-[0.15em] text-[13px] text-gray-900 uppercase">Artemis</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 p-3 flex-1 overflow-y-auto">

        {/* Dashboard — always visible */}
        <Link
          href="/"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
            pathname === "/"
              ? "bg-blue-50 text-blue-600 font-medium border-l-2 border-blue-600 rounded-l-none pl-[10px]"
              : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
          )}
        >
          <LayoutDashboard className="w-4 h-4 shrink-0" />
          Dashboard
        </Link>

        {/* Live service items */}
        {grouped.length > 0 && (
          <>
            {(() => {
              let lastSection: string | undefined;
              return grouped.map(({ href, label, icon: Icon, section }) => {
                const showHeader = section && section !== lastSection;
                lastSection = section;
                const active = pathname === href;
                return (
                  <div key={href}>
                    {showHeader && (
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 pt-3 pb-1">
                        {section}
                      </p>
                    )}
                    <Link
                      href={href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                        active
                          ? "bg-blue-50 text-blue-600 font-medium border-l-2 border-blue-600 rounded-l-none pl-[10px]"
                          : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                      )}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {label}
                    </Link>
                  </div>
                );
              });
            })()}
          </>
        )}

        {/* No services hint */}
        {grouped.length === 0 && (
          <p className="text-xs text-gray-400 px-3 py-2">
            No services online.<br />
            Run <code className="font-mono">npx artemis-cli</code> to deploy.
          </p>
        )}

        {/* Docs — always visible */}
        <div className="mt-auto pt-2 border-t border-gray-100">
          <Link
            href="/docs"
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
              pathname === "/docs"
                ? "bg-blue-50 text-blue-600 font-medium border-l-2 border-blue-600 rounded-l-none pl-[10px]"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            )}
          >
            <FileText className="w-4 h-4 shrink-0" />
            Docs
          </Link>
        </div>

      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200">
        <p className="text-xs text-gray-400 font-mono">v{process.env.NEXT_PUBLIC_VERSION} · Krish Pinto</p>
      </div>
    </aside>
  );
}

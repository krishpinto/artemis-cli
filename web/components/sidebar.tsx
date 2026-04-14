"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Database,
  Layers,
  FileText,
  Leaf,
} from "lucide-react";

const NAV = [
  { href: "/",         label: "Dashboard",  icon: LayoutDashboard },
  { href: "/postgres", label: "PostgreSQL",  icon: Database        },
  { href: "/redis",    label: "Redis",       icon: Layers          },
  { href: "/mongodb",  label: "MongoDB",     icon: Leaf            },
  { href: "/docs",     label: "Docs",        icon: FileText        },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col w-56 shrink-0 border-r border-gray-200 bg-white h-screen sticky top-0">

      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-gray-200">
        <img src="/artemis-logo.png" alt="Artemis" width={44} height={44} className="shrink-0" />
        <span className="font-bold tracking-[0.15em] text-[13px] text-gray-900 uppercase">Artemis</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 p-3 flex-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors relative",
                active
                  ? "bg-blue-50 text-blue-600 font-medium border-l-2 border-blue-600 rounded-l-none pl-[10px]"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200">
        <p className="text-xs text-gray-400 font-mono">v1.0.0 · Krish Pinto</p>
      </div>
    </aside>
  );
}

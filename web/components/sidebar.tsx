"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Database,
  Layers,
  FileText,
  Rocket,
  CircleDot,
  Leaf,
} from "lucide-react";

const NAV = [
  { href: "/",         label: "Mission Control", icon: LayoutDashboard },
  { href: "/postgres", label: "PostgreSQL",       icon: Database        },
  { href: "/redis",    label: "Redis",            icon: Layers          },
  { href: "/mongodb",  label: "MongoDB",          icon: Leaf            },
  { href: "/docs",     label: "Docs",             icon: FileText        },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col w-56 shrink-0 border-r border-border bg-sidebar h-screen sticky top-0">

      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-border">
        <Rocket className="w-5 h-5 text-primary" />
        <span className="font-mono font-bold text-primary tracking-widest text-sm">ARTEMIS</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 p-3 flex-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                active
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border">
        <p className="text-xs text-muted-foreground font-mono">v1.0.0 · Krish Pinto</p>
      </div>
    </aside>
  );
}

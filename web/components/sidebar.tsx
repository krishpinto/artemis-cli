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
        {/* Artemis icon mark — Orbital A */}
        <svg
          width="28"
          height="28"
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Left leg of A */}
          <line x1="6" y1="30" x2="18" y2="7" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          {/* Right leg of A */}
          <line x1="30" y1="30" x2="18" y2="7" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          {/* Orbit arc crossbar */}
          <path d="M11 21 Q18 16.5 25 21" stroke="#2563eb" strokeWidth="2" strokeLinecap="round"/>
          {/* Spacecraft dot at apex */}
          <circle cx="18" cy="7" r="2" fill="#2563eb"/>
        </svg>
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

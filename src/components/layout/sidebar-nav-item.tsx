"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/lib/constants";

interface SidebarNavItemProps {
  item: NavItem;
}

export function SidebarNavItem({ item }: SidebarNavItemProps) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(
    item.children?.some((child) => pathname.startsWith(child.href)) ?? false
  );

  const isActive =
    pathname === item.href ||
    item.children?.some((child) => pathname === child.href);

  const Icon = item.icon;

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
            isActive
              ? "bg-srsf-green-500/20 text-srsf-green-300"
              : "text-white/70 hover:text-white hover:bg-white/10"
          )}
        >
          <Icon className="w-5 h-5 shrink-0" />
          <span className="flex-1 text-left">{item.label}</span>
          <ChevronDown
            className={cn(
              "w-4 h-4 transition-transform",
              expanded && "rotate-180"
            )}
          />
        </button>
        {expanded && (
          <div className="ml-8 mt-1 space-y-1">
            {item.children.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                className={cn(
                  "block px-3 py-1.5 rounded-md text-sm transition-colors",
                  pathname === child.href
                    ? "bg-srsf-green-500/20 text-srsf-green-300"
                    : "text-white/60 hover:text-white hover:bg-white/10"
                )}
              >
                {child.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
        isActive
          ? "bg-srsf-green-500/20 text-srsf-green-300"
          : "text-white/70 hover:text-white hover:bg-white/10"
      )}
    >
      <Icon className="w-5 h-5 shrink-0" />
      <span>{item.label}</span>
    </Link>
  );
}

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
            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
            isActive
              ? "bg-srsf-green-500/20 text-white"
              : "text-white/60 hover:text-white hover:bg-white/8"
          )}
        >
          <Icon className="size-4 shrink-0" />
          <span className="flex-1 text-left">{item.label}</span>
          <ChevronDown
            className={cn(
              "size-3.5 transition-transform duration-200",
              expanded && "rotate-180"
            )}
          />
        </button>
        {expanded && (
          <div className="ml-7 mt-0.5 space-y-0.5 border-l border-white/10 pl-3">
            {item.children.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                className={cn(
                  "block px-2.5 py-1.5 rounded-md text-[13px] transition-all duration-150",
                  pathname === child.href
                    ? "bg-srsf-green-500/20 text-white font-medium"
                    : "text-white/50 hover:text-white hover:bg-white/8"
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
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
        isActive
          ? "bg-srsf-green-500/20 text-white"
          : "text-white/60 hover:text-white hover:bg-white/8"
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span>{item.label}</span>
    </Link>
  );
}

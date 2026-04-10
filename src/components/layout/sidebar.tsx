"use client";

import Image from "next/image";
import { NAV_ITEMS } from "@/lib/constants";
import { SidebarNavItem } from "./sidebar-nav-item";
import { useUser } from "@/hooks/use-user";
import { PanelLeftClose, PanelLeft } from "lucide-react";
import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const { hasAccess, loading } = useUser();
  const [collapsed, setCollapsed] = useState(false);

  const visibleItems = NAV_ITEMS.filter(
    (item) => loading || hasAccess(item.module)
  );

  // Close sidebar on mobile when a nav link is clicked
  const handleNavigate = useCallback(() => {
    if (window.innerWidth < 1024) {
      setCollapsed(true);
    }
  }, []);

  return (
    <>
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-gradient-to-b from-srsf-purple-800 to-srsf-purple-900 transition-all duration-300 flex flex-col shadow-xl",
          collapsed ? "w-0 overflow-hidden lg:w-16" : "w-64"
        )}
      >
        {/* Logo / collapse button row */}
        <div
          className={cn(
            "flex items-center h-16 border-b border-white/10",
            collapsed ? "justify-center px-0" : "justify-between px-5"
          )}
        >
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <Image
                src="/srsf-logo.png"
                alt="SRSF"
                width={36}
                height={36}
                className="rounded-md"
              />
              <span className="text-lg font-bold text-white tracking-tight">
                SRSF MIS
              </span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-white/50 hover:text-white transition-colors hidden lg:block"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeft className="w-5 h-5" />
            ) : (
              <PanelLeftClose className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        {collapsed ? (
          /* Collapsed: icon-only nav (desktop only — hidden on mobile via w-0/overflow-hidden) */
          <nav className="flex-1 flex flex-col items-center py-5 gap-1 overflow-y-auto">
            {visibleItems.map((item) => (
              <SidebarNavItem
                key={item.href}
                item={item}
                onNavigate={handleNavigate}
                iconOnly
              />
            ))}
          </nav>
        ) : (
          <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
            {visibleItems.map((item) => (
              <SidebarNavItem
                key={item.href}
                item={item}
                onNavigate={handleNavigate}
              />
            ))}
          </nav>
        )}

        {/* Bottom branding (expanded only) */}
        {!collapsed && (
          <div className="px-5 py-4 border-t border-white/10">
            <p className="text-[11px] text-white/30 leading-relaxed">
              Springboard Road Show Foundation
            </p>
          </div>
        )}
      </aside>

      {/* Mobile toggle (shown when sidebar is hidden) */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          "fixed top-4 left-4 z-50 p-2 rounded-lg bg-srsf-purple-800 text-white shadow-lg lg:hidden",
          !collapsed && "hidden"
        )}
      >
        <PanelLeft className="w-5 h-5" />
      </button>
    </>
  );
}

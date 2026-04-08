"use client";

import { NAV_ITEMS } from "@/lib/constants";
import { SidebarNavItem } from "./sidebar-nav-item";
import { useUser } from "@/hooks/use-user";
import { PanelLeftClose, PanelLeft } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const { hasAccess, loading } = useUser();
  const [collapsed, setCollapsed] = useState(false);

  const visibleItems = NAV_ITEMS.filter(
    (item) => loading || hasAccess(item.module)
  );

  return (
    <>
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-gradient-to-b from-srsf-purple-800 to-srsf-purple-900 transition-all duration-300 flex flex-col shadow-xl",
          collapsed ? "w-0 overflow-hidden lg:w-16" : "w-64"
        )}
      >
        {/* Logo area */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-white/10">
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-srsf-green-500 flex items-center justify-center">
                <span className="text-white text-xs font-black tracking-tight">
                  S
                </span>
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                SRSF MIS
              </span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-white/50 hover:text-white transition-colors hidden lg:block"
          >
            {collapsed ? (
              <PanelLeft className="w-5 h-5" />
            ) : (
              <PanelLeftClose className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        {!collapsed && (
          <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
            {visibleItems.map((item) => (
              <SidebarNavItem key={item.href} item={item} />
            ))}
          </nav>
        )}

        {/* Bottom branding */}
        {!collapsed && (
          <div className="px-5 py-4 border-t border-white/10">
            <p className="text-[11px] text-white/30 leading-relaxed">
              Springboard Road Show Foundation
            </p>
          </div>
        )}
      </aside>

      {/* Mobile toggle */}
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

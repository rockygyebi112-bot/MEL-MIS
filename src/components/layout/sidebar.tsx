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
      {/* Mobile overlay */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-srsf-purple-700 transition-all duration-300 flex flex-col",
          collapsed ? "w-0 overflow-hidden lg:w-16" : "w-64"
        )}
      >
        {/* Logo area */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-white/10">
          {!collapsed && (
            <span className="text-xl font-bold text-white">SRSF MIS</span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-white/70 hover:text-white hidden lg:block"
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
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {visibleItems.map((item) => (
              <SidebarNavItem key={item.href} item={item} />
            ))}
          </nav>
        )}

        {/* Bottom branding */}
        {!collapsed && (
          <div className="px-4 py-3 border-t border-white/10">
            <p className="text-xs text-white/40">
              Springboard Road Show Foundation
            </p>
          </div>
        )}
      </aside>

      {/* Mobile toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          "fixed top-4 left-4 z-50 p-2 rounded-md bg-srsf-purple-700 text-white lg:hidden",
          !collapsed && "hidden"
        )}
      >
        <PanelLeft className="w-5 h-5" />
      </button>
    </>
  );
}

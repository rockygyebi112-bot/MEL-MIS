"use client";

import Image from "next/image";
import { NAV_ITEMS } from "@/lib/constants";
import { SidebarNavItem } from "./sidebar-nav-item";
import { useUser } from "@/hooks/use-user";
import { useSidebar } from "@/lib/sidebar-context";
import { PanelLeftClose, PanelLeft } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const { hasAccess, loading } = useUser();
  const { mobileOpen, closeMobile } = useSidebar();

  // Desktop-only collapsed (icon-only) state
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);

  const visibleItems = NAV_ITEMS.filter(
    (item) => loading || hasAccess(item.module)
  );

  // Close on mobile nav click
  const handleNavigate = useCallback(() => {
    closeMobile();
  }, [closeMobile]);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      {/* ── Mobile backdrop ──────────────────────────────────── */}
      <div
        aria-hidden="true"
        className={cn(
          "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          mobileOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        )}
        onClick={closeMobile}
      />

      {/* ── Sidebar panel ───────────────────────────────────── */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen bg-gradient-to-b from-srsf-purple-800 to-srsf-purple-900 flex flex-col shadow-xl",
          // Mobile: slide in/out via translateX, full nav width
          "w-72 transition-transform duration-300 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop: always visible, collapse to icon-only via width
          desktopCollapsed
            ? "lg:translate-x-0 lg:w-16 lg:overflow-hidden"
            : "lg:translate-x-0 lg:w-64"
        )}
      >
        {/* Header row */}
        <div
          className={cn(
            "flex items-center h-16 border-b border-white/10 shrink-0",
            desktopCollapsed
              ? "lg:justify-center lg:px-0 justify-between px-5"
              : "justify-between px-5"
          )}
        >
          <div
            className={cn(
              "flex items-center gap-2.5",
              desktopCollapsed && "lg:hidden"
            )}
          >
            <Image
              src="/srsf-logo.png"
              alt="SRSF"
              width={36}
              height={36}
              className="rounded-md shrink-0"
            />
            <span className="text-lg font-bold text-white tracking-tight whitespace-nowrap">
              SRSF MIS
            </span>
          </div>

          {/* Desktop collapse/expand button */}
          <button
            type="button"
            onClick={() => setDesktopCollapsed((c) => !c)}
            className="text-white/50 hover:text-white transition-colors hidden lg:block p-1 rounded"
            title={desktopCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {desktopCollapsed ? (
              <PanelLeft className="w-5 h-5" />
            ) : (
              <PanelLeftClose className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        {desktopCollapsed ? (
          // Desktop icon-only
          <nav className="flex-1 hidden lg:flex flex-col items-center py-4 gap-1 overflow-y-auto">
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
          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
            {visibleItems.map((item) => (
              <SidebarNavItem
                key={item.href}
                item={item}
                onNavigate={handleNavigate}
              />
            ))}
          </nav>
        )}

        {/* Bottom branding */}
        {!desktopCollapsed && (
          <div className="px-5 py-4 border-t border-white/10 shrink-0">
            <p className="text-[11px] text-white/30 leading-relaxed">
              Springboard Road Show Foundation
            </p>
          </div>
        )}
      </aside>
    </>
  );
}

import { AppModule } from "./types";
import {
  LayoutDashboard,
  BarChart3,
  ClipboardEdit,
  SlidersHorizontal,
  Lightbulb,
  Settings,
  LucideIcon,
} from "lucide-react";

export const PROGRAMS = [
  { name: "Enterprise Spotlight", slug: "enterprise-spotlight" },
  { name: "Virtual University", slug: "virtual-university" },
  { name: "Hangout", slug: "hangout" },
  { name: "ABSA Onboarding", slug: "absa-onboarding" },
] as const;

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  module: AppModule;
  children?: { label: string; href: string }[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Executive Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    module: "executive_dashboard",
  },
  {
    label: "Program Dashboards",
    href: "/programs",
    icon: BarChart3,
    module: "program_dashboards",
    children: PROGRAMS.map((p) => ({
      label: p.name,
      href: `/programs/${p.slug}`,
    })),
  },
  {
    label: "Data Entry",
    href: "/data-entry",
    icon: ClipboardEdit,
    module: "data_entry",
  },
  {
    label: "Indicators",
    href: "/indicators",
    icon: SlidersHorizontal,
    module: "indicators",
  },
  {
    label: "Learnings",
    href: "/learnings",
    icon: Lightbulb,
    module: "learnings",
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    module: "settings",
  },
];

export const MODULE_LABELS: Record<AppModule, string> = {
  executive_dashboard: "Executive Dashboard",
  program_dashboards: "Program Dashboards",
  data_entry: "Data Entry",
  indicators: "Indicators Management",
  learnings: "Learnings",
  settings: "Settings",
};

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

// ============================================
// DATA ENTRY FORM OPTIONS
// ============================================

// Ghana's 16 regions (as of 2019 reorganization)
export const REGIONS = [
  "Ahafo",
  "Ashanti",
  "Bono",
  "Bono East",
  "Central",
  "Eastern",
  "Greater Accra",
  "North East",
  "Northern",
  "Oti",
  "Savannah",
  "Upper East",
  "Upper West",
  "Volta",
  "Western",
  "Western North",
] as const;

export const GENDERS = ["Male", "Female"] as const;

export const DISABILITY_TYPES = [
  "Visual",
  "Hearing",
  "Physical",
  "Intellectual",
  "Speech",
  "Psychosocial",
  "Other",
] as const;

export const OWNERSHIP_TYPES = [
  "Sole Proprietor",
  "Partnership",
  "Close Corporation",
  "(Pty) Ltd",
  "Cooperative",
  "Other",
] as const;

export const BUSINESS_SIZES = [
  "Micro (0-10)",
  "Small (11-50)",
  "Medium (51-200)",
  "Large (200+)",
] as const;

export const FUNDING_STATUSES = [
  "Self-funded",
  "Grant-funded",
  "Loan-funded",
  "Investor-funded",
  "Mixed",
] as const;

export const BUSINESS_SECTORS = [
  "Agriculture",
  "Construction",
  "Education",
  "Finance",
  "Healthcare",
  "Hospitality",
  "ICT",
  "Manufacturing",
  "Mining",
  "Retail",
  "Services",
  "Transport",
  "Other",
] as const;

export const EMPLOYMENT_STATUSES = [
  "Employed",
  "Unemployed",
  "Self-employed",
  "Student",
  "Other",
] as const;

export const PLATFORMS = ["Facebook", "YouTube"] as const;

export const AGE_BRACKETS = [
  "Under 18",
  "18-24",
  "25-34",
  "35-44",
  "45-54",
  "55-64",
  "65+",
] as const;

export const LEARNING_CATEGORIES = [
  "Operations",
  "Partnerships",
  "Audience Engagement",
  "Impact",
  "Other",
] as const;

// Programs available in data entry (includes Learnings as a data entry option)
export const DATA_ENTRY_PROGRAMS = [
  { name: "Enterprise Spotlight", slug: "enterprise-spotlight", description: "Track enterprise development applications and business metrics" },
  { name: "Virtual University", slug: "virtual-university", description: "Record weekly educational episode data and audience metrics" },
  { name: "Hangout", slug: "hangout", description: "Record weekly community engagement episode data" },
  { name: "ABSA Onboarding", slug: "absa-onboarding", description: "Track participant onboarding for the ABSA partnership" },
  { name: "Learnings", slug: "learnings", description: "Capture learnings and insights across all programs" },
] as const;

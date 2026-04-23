export type UserStatus = "pending" | "active" | "inactive" | "rejected";

export type AppModule =
  | "executive_dashboard"
  | "program_dashboards"
  | "data_entry"
  | "indicators"
  | "learnings"
  | "settings"
  | "projects";

export interface Role {
  id: string;
  name: string;
  is_system: boolean;
  created_at: string;
}

export interface RolePermission {
  id: string;
  role_id: string;
  module: AppModule;
  allowed: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role_id: string | null;
  status: UserStatus;
  created_at: string;
  updated_at: string;
  role?: Role;
}

export interface Program {
  id: string;
  name: string;
  slug: string;
  description: string;
  created_at: string;
}

// ============================================
// INDICATORS
// ============================================

export interface Indicator {
  id: string;
  program_id: string;
  name: string;
  data_type: "numeric" | "categorical";
  options: string[];
  is_core: boolean;
  show_on_executive: boolean;
  manual_entry: boolean;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

// ============================================
// PROGRAM ENTRIES
// ============================================

export interface EnterpriseSpotlightEntry {
  id: string;
  user_id: string;
  applicant_name: string;
  region: string;
  gender: string;
  age: number | null;
  age_bracket: string;
  disability_status: string;
  disability_type: string | null;
  ownership_type: string;
  business_longevity: number | null;
  business_size: string;
  funding_status: string;
  business_registered: string;
  business_sector: string;
  custom_fields: Record<string, unknown>;
  learning: string;
  is_draft: boolean;
  created_at: string;
  updated_at: string;
}

export interface MediaProgramEntry {
  id: string;
  user_id: string;
  episode_title: string;
  date_aired: string | null;
  platforms: string[];
  metrics: {
    facebook?: { views: number; shares: number; saves: number; likes: number };
    youtube?: { views: number; shares: number; saves: number; likes: number };
  };
  demographics: {
    gender: Record<string, number>;
    age_brackets: Record<string, number>;
  };
  custom_fields: Record<string, unknown>;
  learning: string;
  is_draft: boolean;
  created_at: string;
  updated_at: string;
}

export interface AbsaOnboardingEntry {
  id: string;
  user_id: string;
  participant_name: string;
  gender: string;
  age: number | null;
  age_bracket: string;
  region: string;
  employment_status: string;
  disability_status: string;
  disability_type: string | null;
  custom_fields: Record<string, unknown>;
  learning: string;
  is_draft: boolean;
  created_at: string;
  updated_at: string;
}

export interface LearningEntry {
  id: string;
  user_id: string;
  program_id: string;
  category: string;
  title: string;
  description: string;
  learning_date: string | null;
  created_at: string;
  updated_at: string;
  program?: Program;
}

// Slug to table name mapping
export type ProgramSlug =
  | "enterprise-spotlight"
  | "virtual-university"
  | "hangout"
  | "absa-onboarding"
  | "learnings";

export const PROGRAM_TABLE_MAP: Record<ProgramSlug, string> = {
  "enterprise-spotlight": "enterprise_spotlight_entries",
  "virtual-university": "virtual_university_entries",
  "hangout": "hangout_entries",
  "absa-onboarding": "absa_onboarding_entries",
  "learnings": "learnings",
};

// ============================================
// PERFORMANCE MANAGEMENT
// ============================================

export type ActivityStatus = "pending" | "done" | "overdue";
export type GoalStatus = "on_track" | "at_risk" | "behind";

export interface Department {
  id: string;
  name: string;
  created_at: string;
}

export interface UserDepartment {
  id: string;
  user_id: string;
  department_id: string;
  is_manager: boolean;
}

export interface PerformanceGoal {
  id: string;
  department_id: string;
  title: string;
  description: string | null;
  year: number;
  quarter: number;
  due_date: string;
  created_by: string | null;
  created_at: string;
}

export interface PerformanceActivity {
  id: string;
  goal_id: string;
  title: string;
  assigned_to: string | null;
  due_date: string;
  created_by: string | null;
  created_at: string;
}

export interface ActivitySubmission {
  id: string;
  activity_id: string;
  submitted_by: string;
  description: string;
  submitted_at: string;
  updated_at: string;
}

export interface ActivityAttachment {
  id: string;
  submission_id: string;
  file_name: string;
  file_size: number;
  storage_path: string;
  uploaded_at: string;
}

// Enriched shapes used in UI (assembled from joined queries)
export interface ActivityWithStatus extends PerformanceActivity {
  status: ActivityStatus;
  submission: ActivitySubmission | null;
  attachments: ActivityAttachment[];
  assignee: { full_name: string; email: string };
}

export interface GoalWithActivities extends PerformanceGoal {
  activities: ActivityWithStatus[];
  status: GoalStatus;
  progress_pct: number;
}

export interface DepartmentSummary extends Department {
  goals: GoalWithActivities[];
  progress_pct: number;
  status: GoalStatus;
  staff_count: number;
  done_count: number;
  pending_count: number;
  overdue_count: number;
}

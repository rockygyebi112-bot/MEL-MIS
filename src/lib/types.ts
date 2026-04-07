export type UserStatus = "pending" | "active" | "inactive" | "rejected";

export type AppModule =
  | "executive_dashboard"
  | "program_dashboards"
  | "data_entry"
  | "indicators"
  | "learnings"
  | "settings";

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

export interface AuditLogEntry {
  id: string;
  user_id: string;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
}

export interface Program {
  id: string;
  name: string;
  slug: string;
  description: string;
  created_at: string;
}

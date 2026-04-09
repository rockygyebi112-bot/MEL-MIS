"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import type { UserProfile, Role } from "@/lib/types";

interface PendingUsersTableProps {
  onUserUpdated: () => void;
}

export function PendingUsersTable({ onUserUpdated }: PendingUsersTableProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const supabase = createClient();

    const [usersRes, rolesRes] = await Promise.all([
      supabase
        .from("user_profiles")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
      supabase.from("roles").select("*").order("name"),
    ]);

    setUsers((usersRes.data as UserProfile[]) || []);
    setRoles((rolesRes.data as Role[]) || []);
    setLoading(false);
  }

  async function approveUser(userId: string) {
    const roleId = selectedRoles[userId];
    if (!roleId) return;

    const supabase = createClient();
    const { error } = await supabase
      .from("user_profiles")
      .update({ status: "active", role_id: roleId, updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (!error) {
      await supabase.from("audit_log").insert({
        user_id: userId,
        action: "user_approved",
        details: { role_id: roleId },
      });
      setUsers(users.filter((u) => u.id !== userId));
      onUserUpdated();
    }
  }

  async function rejectUser(userId: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("user_profiles")
      .update({ status: "rejected", updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (!error) {
      await supabase.from("audit_log").insert({
        user_id: userId,
        action: "user_rejected",
        details: {},
      });
      setUsers(users.filter((u) => u.id !== userId));
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading...</p>;
  if (users.length === 0)
    return <p className="text-sm text-muted-foreground">No pending users.</p>;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Signed Up</TableHead>
          <TableHead>Assign Role</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">
              {user.full_name || "\u2014"}
            </TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>
              {new Date(user.created_at).toLocaleDateString()}
            </TableCell>
            <TableCell>
              <Select
                value={selectedRoles[user.id] ?? ""}
                onValueChange={(value: string | null) => {
                  if (value) setSelectedRoles((prev) => ({ ...prev, [user.id]: value }));
                }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select role">
                    {selectedRoles[user.id]
                      ? roles.find((r) => r.id === selectedRoles[user.id])?.name ?? "Select role"
                      : "Select role"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => approveUser(user.id)}
                  disabled={!selectedRoles[user.id]}
                  className="bg-srsf-green-500 hover:bg-srsf-green-600"
                >
                  <Check className="w-4 h-4 mr-1" /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => rejectUser(user.id)}
                >
                  <X className="w-4 h-4 mr-1" /> Reject
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

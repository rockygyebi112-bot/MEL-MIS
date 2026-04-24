"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { createProject, updateProject } from "@/lib/projects/mutations";
import type { Project } from "@/lib/projects/types";
import { DATA_ENTRY_PROGRAMS } from "@/lib/constants";

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface UserOption {
  id: string;
  full_name: string | null;
  email: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Partial<Project>;
  onSaved: () => void;
}

export function ProjectFormModal({
  open,
  onOpenChange,
  initial,
  onSaved,
}: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(!!initial?.slug);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [ownerId, setOwnerId] = useState(initial?.owner_user_id ?? "");
  const [programSlug, setProgramSlug] = useState(initial?.program_slug ?? "");
  const [startDate, setStartDate] = useState(initial?.start_date ?? "");
  const [targetEnd, setTargetEnd] = useState(initial?.target_end_date ?? "");
  const [users, setUsers] = useState<UserOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("user_profiles")
        .select("id, full_name, email, role:roles(name)")
        .eq("status", "active")
        .order("full_name", { ascending: true });
      const rows = (data ?? []) as unknown as Array<
        UserOption & { role?: { name?: string } | null }
      >;
      setUsers(
        rows.filter(
          (u) => u.role?.name === "Admin" || u.role?.name === "Program Manager",
        ),
      );
    })();
  }, [open]);

  useEffect(() => {
    if (!slugEdited) setSlug(toSlug(name));
  }, [name, slugEdited]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        name,
        slug,
        description: description || null,
        owner_user_id: ownerId || null,
        program_slug: programSlug || null,
        start_date: startDate || null,
        target_end_date: targetEnd || null,
      };
      if (initial?.id) {
        await updateProject(initial.id, payload);
      } else {
        await createProject(payload);
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>
              {initial?.id ? "Edit Project" : "New Project"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-3 py-4">
            <div className="grid gap-1.5">
              <Label htmlFor="proj-name">Name</Label>
              <Input
                id="proj-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="proj-slug">Slug</Label>
              <Input
                id="proj-slug"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlugEdited(true);
                }}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="proj-desc">Description</Label>
              <Textarea
                id="proj-desc"
                value={description ?? ""}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="proj-owner">Owner (MEL Manager)</Label>
              <select
                id="proj-owner"
                value={ownerId ?? ""}
                onChange={(e) => setOwnerId(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                required
              >
                <option value="">Select owner…</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name || u.email}
                  </option>
                ))}
              </select>
              {users.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No active MEL managers are available to assign yet.
                </p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="proj-program">Linked Program</Label>
              <select
                id="proj-program"
                value={programSlug ?? ""}
                onChange={(e) => setProgramSlug(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">None</option>
                {DATA_ENTRY_PROGRAMS.filter((p) => p.slug !== "learnings").map(
                  (p) => (
                    <option key={p.slug} value={p.slug}>
                      {p.name}
                    </option>
                  ),
                )}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="proj-start">Start Date</Label>
                <Input
                  id="proj-start"
                  type="date"
                  value={startDate ?? ""}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="proj-end">Target End</Label>
                <Input
                  id="proj-end"
                  type="date"
                  value={targetEnd ?? ""}
                  onChange={(e) => setTargetEnd(e.target.value)}
                />
              </div>
            </div>
            {error && (
              <div className="text-xs text-red-600">{error}</div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

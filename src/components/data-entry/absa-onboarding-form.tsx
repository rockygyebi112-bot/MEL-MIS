"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { AbsaOnboardingEntry } from "@/lib/types";
import { getAgeBracket } from "@/lib/utils";
import { REGIONS, GENDERS, EMPLOYMENT_STATUSES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";

interface AbsaOnboardingFormProps {
  editEntry?: AbsaOnboardingEntry | null;
  onSaved: () => void;
  onCancel?: () => void;
}

const EMPTY_FORM = {
  participant_name: "",
  gender: "",
  age: "",
  region: "",
  employment_status: "",
  disability_status: "",
  learning: "",
};

export function AbsaOnboardingForm({
  editEntry,
  onSaved,
  onCancel,
}: AbsaOnboardingFormProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (editEntry) {
      setForm({
        participant_name: editEntry.participant_name,
        gender: editEntry.gender,
        age: editEntry.age?.toString() ?? "",
        region: editEntry.region,
        employment_status: editEntry.employment_status,
        disability_status: editEntry.disability_status,
        learning: editEntry.learning,
      });
    }
  }, [editEntry]);

  function setField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(isDraft: boolean) {
    if (!isDraft && !form.participant_name.trim()) {
      toast.error("Participant name is required");
      return;
    }

    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be logged in");
      setSaving(false);
      return;
    }

    const ageNum = form.age ? parseInt(form.age, 10) : null;
    const record = {
      user_id: user.id,
      participant_name: form.participant_name,
      gender: form.gender,
      age: ageNum,
      age_bracket: ageNum ? getAgeBracket(ageNum) : "",
      region: form.region,
      employment_status: form.employment_status,
      disability_status: form.disability_status,
      learning: form.learning,
      is_draft: isDraft,
    };

    let error;
    if (editEntry) {
      ({ error } = await supabase
        .from("absa_onboarding_entries")
        .update(record)
        .eq("id", editEntry.id));
    } else {
      ({ error } = await supabase
        .from("absa_onboarding_entries")
        .insert(record));
    }

    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(
      isDraft
        ? "Draft saved"
        : editEntry
          ? "Entry updated"
          : "Entry submitted"
    );
    setForm(EMPTY_FORM);
    onSaved();
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Participant Name */}
        <div className="space-y-2">
          <Label htmlFor="participant_name">Participant Name *</Label>
          <Input
            id="participant_name"
            value={form.participant_name}
            onChange={(e) => setField("participant_name", e.target.value)}
            placeholder="Full name"
          />
        </div>

        {/* Gender */}
        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <Select
            value={form.gender}
            onValueChange={(v) => setField("gender", v)}
          >
            <SelectTrigger id="gender">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              {GENDERS.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Age */}
        <div className="space-y-2">
          <Label htmlFor="age">Age</Label>
          <Input
            id="age"
            type="number"
            min={0}
            max={150}
            value={form.age}
            onChange={(e) => setField("age", e.target.value)}
            placeholder="Age in years"
          />
          {form.age && (
            <p className="text-xs text-muted-foreground">
              Bracket: {getAgeBracket(parseInt(form.age, 10))}
            </p>
          )}
        </div>

        {/* Region */}
        <div className="space-y-2">
          <Label htmlFor="region">Region</Label>
          <Select
            value={form.region}
            onValueChange={(v) => setField("region", v)}
          >
            <SelectTrigger id="region">
              <SelectValue placeholder="Select region" />
            </SelectTrigger>
            <SelectContent>
              {REGIONS.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Employment Status */}
        <div className="space-y-2">
          <Label htmlFor="employment_status">Employment Status</Label>
          <Select
            value={form.employment_status}
            onValueChange={(v) => setField("employment_status", v)}
          >
            <SelectTrigger id="employment_status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {EMPLOYMENT_STATUSES.map((e) => (
                <SelectItem key={e} value={e}>
                  {e}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Disability Status */}
        <div className="space-y-2">
          <Label htmlFor="disability_status">Disability Status</Label>
          <Select
            value={form.disability_status}
            onValueChange={(v) => setField("disability_status", v)}
          >
            <SelectTrigger id="disability_status">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Yes">Yes</SelectItem>
              <SelectItem value="No">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Learning */}
      <div className="space-y-2">
        <Label htmlFor="learning">Learnings</Label>
        <Textarea
          id="learning"
          value={form.learning}
          onChange={(e) => setField("learning", e.target.value)}
          placeholder="Any learnings or insights from this onboarding..."
          rows={3}
        />
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button
          onClick={() => handleSubmit(false)}
          disabled={saving}
          className="bg-srsf-green-500 hover:bg-srsf-green-600"
        >
          {saving ? "Saving..." : editEntry ? "Update Entry" : "Submit Entry"}
        </Button>
        <Button
          variant="outline"
          onClick={() => handleSubmit(true)}
          disabled={saving}
        >
          Save as Draft
        </Button>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}

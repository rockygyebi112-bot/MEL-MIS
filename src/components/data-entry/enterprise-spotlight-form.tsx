"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { EnterpriseSpotlightEntry } from "@/lib/types";
import { getAgeBracket } from "@/lib/utils";
import {
  REGIONS,
  GENDERS,
  DISABILITY_TYPES,
  OWNERSHIP_TYPES,
  BUSINESS_SIZES,
  FUNDING_STATUSES,
  BUSINESS_SECTORS,
} from "@/lib/constants";
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
import { CustomFieldsSection } from "@/components/data-entry/custom-fields-section";
import { toast } from "sonner";

interface EnterpriseSpotlightFormProps {
  editEntry?: EnterpriseSpotlightEntry | null;
  onSaved: () => void;
  onCancel?: () => void;
}

const EMPTY_FORM = {
  applicant_name: "",
  region: "",
  gender: "",
  age: "",
  disability_status: "",
  disability_type: "",
  ownership_type: "",
  business_longevity: "",
  business_size: "",
  funding_status: "",
  business_registered: "",
  business_sector: "",
  learning: "",
};

export function EnterpriseSpotlightForm({
  editEntry,
  onSaved,
  onCancel,
}: EnterpriseSpotlightFormProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [customFields, setCustomFields] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (editEntry) {
      setForm({
        applicant_name: editEntry.applicant_name,
        region: editEntry.region,
        gender: editEntry.gender,
        age: editEntry.age?.toString() ?? "",
        disability_status: editEntry.disability_status,
        disability_type: editEntry.disability_type ?? "",
        ownership_type: editEntry.ownership_type,
        business_longevity: editEntry.business_longevity?.toString() ?? "",
        business_size: editEntry.business_size,
        funding_status: editEntry.funding_status,
        business_registered: editEntry.business_registered,
        business_sector: editEntry.business_sector,
        learning: editEntry.learning,
      });
      setCustomFields((editEntry.custom_fields as Record<string, unknown>) ?? {});
    }
  }, [editEntry]);

  function setField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(isDraft: boolean) {
    if (!isDraft && !form.applicant_name.trim()) {
      toast.error("Applicant name is required");
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
      applicant_name: form.applicant_name,
      region: form.region,
      gender: form.gender,
      age: ageNum,
      age_bracket: ageNum ? getAgeBracket(ageNum) : "",
      disability_status: form.disability_status,
      disability_type:
        form.disability_status === "Yes" ? form.disability_type : null,
      ownership_type: form.ownership_type,
      business_longevity: form.business_longevity
        ? parseInt(form.business_longevity, 10)
        : null,
      business_size: form.business_size,
      funding_status: form.funding_status,
      business_registered: form.business_registered,
      business_sector: form.business_sector,
      learning: form.learning,
      custom_fields: customFields,
      is_draft: isDraft,
    };

    let error;
    if (editEntry) {
      ({ error } = await supabase
        .from("enterprise_spotlight_entries")
        .update(record)
        .eq("id", editEntry.id));
    } else {
      ({ error } = await supabase
        .from("enterprise_spotlight_entries")
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
    setCustomFields({});
    onSaved();
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Applicant Name */}
        <div className="space-y-2">
          <Label htmlFor="applicant_name">Applicant Name *</Label>
          <Input
            id="applicant_name"
            value={form.applicant_name}
            onChange={(e) => setField("applicant_name", e.target.value)}
            placeholder="Full name"
          />
        </div>

        {/* Region */}
        <div className="space-y-2">
          <Label htmlFor="region">Region</Label>
          <Select
            value={form.region}
            onValueChange={(v) => setField("region", v ?? "")}
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

        {/* Gender */}
        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <Select
            value={form.gender}
            onValueChange={(v) => setField("gender", v ?? "")}
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

        {/* Disability Status */}
        <div className="space-y-2">
          <Label htmlFor="disability_status">Disability Status</Label>
          <Select
            value={form.disability_status}
            onValueChange={(v) => setField("disability_status", v ?? "")}
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

        {/* Disability Type (conditional) */}
        {form.disability_status === "Yes" && (
          <div className="space-y-2">
            <Label htmlFor="disability_type">Disability Type</Label>
            <Select
              value={form.disability_type}
              onValueChange={(v) => setField("disability_type", v ?? "")}
            >
              <SelectTrigger id="disability_type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {DISABILITY_TYPES.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Ownership Type */}
        <div className="space-y-2">
          <Label htmlFor="ownership_type">Ownership Type</Label>
          <Select
            value={form.ownership_type}
            onValueChange={(v) => setField("ownership_type", v ?? "")}
          >
            <SelectTrigger id="ownership_type">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {OWNERSHIP_TYPES.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Business Longevity */}
        <div className="space-y-2">
          <Label htmlFor="business_longevity">Business Longevity (years)</Label>
          <Input
            id="business_longevity"
            type="number"
            min={0}
            value={form.business_longevity}
            onChange={(e) => setField("business_longevity", e.target.value)}
            placeholder="Years in operation"
          />
        </div>

        {/* Business Size */}
        <div className="space-y-2">
          <Label htmlFor="business_size">Business Size</Label>
          <Select
            value={form.business_size}
            onValueChange={(v) => setField("business_size", v ?? "")}
          >
            <SelectTrigger id="business_size">
              <SelectValue placeholder="Select size" />
            </SelectTrigger>
            <SelectContent>
              {BUSINESS_SIZES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Funding Status */}
        <div className="space-y-2">
          <Label htmlFor="funding_status">Funding Status</Label>
          <Select
            value={form.funding_status}
            onValueChange={(v) => setField("funding_status", v ?? "")}
          >
            <SelectTrigger id="funding_status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {FUNDING_STATUSES.map((f) => (
                <SelectItem key={f} value={f}>
                  {f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Business Registered */}
        <div className="space-y-2">
          <Label htmlFor="business_registered">Business Registered</Label>
          <Select
            value={form.business_registered}
            onValueChange={(v) => setField("business_registered", v ?? "")}
          >
            <SelectTrigger id="business_registered">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Yes">Yes</SelectItem>
              <SelectItem value="No">No</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Business Sector */}
        <div className="space-y-2">
          <Label htmlFor="business_sector">Business Sector</Label>
          <Select
            value={form.business_sector}
            onValueChange={(v) => setField("business_sector", v ?? "")}
          >
            <SelectTrigger id="business_sector">
              <SelectValue placeholder="Select sector" />
            </SelectTrigger>
            <SelectContent>
              {BUSINESS_SECTORS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Custom Indicators */}
      <CustomFieldsSection
        programSlug="enterprise-spotlight"
        values={customFields}
        onChange={setCustomFields}
      />

      {/* Learning */}
      <div className="space-y-2">
        <Label htmlFor="learning">Learnings</Label>
        <Textarea
          id="learning"
          value={form.learning}
          onChange={(e) => setField("learning", e.target.value)}
          placeholder="Any learnings or insights from this application..."
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

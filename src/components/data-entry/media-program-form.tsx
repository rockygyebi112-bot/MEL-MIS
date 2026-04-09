"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { MediaProgramEntry } from "@/lib/types";
import { PLATFORMS, GENDERS, AGE_BRACKETS } from "@/lib/constants";
import { useCoreIndicatorOptions } from "@/lib/hooks/use-core-indicator-options";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { CustomFieldsSection } from "@/components/data-entry/custom-fields-section";
import { toast } from "sonner";

interface MediaProgramFormProps {
  tableName: "virtual_university_entries" | "hangout_entries";
  programSlug: string;
  programLabel: string;
  editEntry?: MediaProgramEntry | null;
  onSaved: () => void;
  onCancel?: () => void;
}

interface PlatformMetrics {
  views: string;
  shares: string;
  saves: string;
  likes: string;
}

const EMPTY_METRICS: PlatformMetrics = {
  views: "",
  shares: "",
  saves: "",
  likes: "",
};

export function MediaProgramForm({
  tableName,
  programSlug,
  programLabel,
  editEntry,
  onSaved,
  onCancel,
}: MediaProgramFormProps) {
  const [episodeTitle, setEpisodeTitle] = useState("");
  const [dateAired, setDateAired] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [platformMetrics, setPlatformMetrics] = useState<
    Record<string, PlatformMetrics>
  >({
    Facebook: { ...EMPTY_METRICS },
    YouTube: { ...EMPTY_METRICS },
  });
  const [genderCounts, setGenderCounts] = useState<Record<string, string>>({});
  const [ageBracketCounts, setAgeBracketCounts] = useState<
    Record<string, string>
  >({});
  const [learning, setLearning] = useState("");
  const [customFields, setCustomFields] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const supabase = createClient();
  const { options: coreOptions } = useCoreIndicatorOptions(programSlug);

  const genderOptions = coreOptions.gender ?? [...GENDERS];
  const ageBracketOptions = coreOptions.age_bracket ?? [...AGE_BRACKETS];

  useEffect(() => {
    if (editEntry) {
      setEpisodeTitle(editEntry.episode_title);
      setDateAired(editEntry.date_aired ?? "");
      setSelectedPlatforms(editEntry.platforms);
      const metricsState: Record<string, PlatformMetrics> = {
        Facebook: { ...EMPTY_METRICS },
        YouTube: { ...EMPTY_METRICS },
      };
      for (const p of PLATFORMS) {
        const key = p.toLowerCase() as "facebook" | "youtube";
        const m = editEntry.metrics[key];
        if (m) {
          metricsState[p] = {
            views: m.views?.toString() ?? "",
            shares: m.shares?.toString() ?? "",
            saves: m.saves?.toString() ?? "",
            likes: m.likes?.toString() ?? "",
          };
        }
      }
      setPlatformMetrics(metricsState);
      const gc: Record<string, string> = {};
      for (const [k, v] of Object.entries(editEntry.demographics.gender ?? {})) {
        gc[k] = v.toString();
      }
      setGenderCounts(gc);
      const ac: Record<string, string> = {};
      for (const [k, v] of Object.entries(
        editEntry.demographics.age_brackets ?? {}
      )) {
        ac[k] = v.toString();
      }
      setAgeBracketCounts(ac);
      setLearning(editEntry.learning);
      setCustomFields((editEntry.custom_fields as Record<string, unknown>) ?? {});
    }
  }, [editEntry]);

  function togglePlatform(platform: string) {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  }

  function setMetric(
    platform: string,
    field: keyof PlatformMetrics,
    value: string
  ) {
    setPlatformMetrics((prev) => ({
      ...prev,
      [platform]: { ...prev[platform], [field]: value },
    }));
  }

  async function handleSubmit(isDraft: boolean) {
    if (!isDraft && !episodeTitle.trim()) {
      toast.error("Episode title is required");
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

    const metrics: Record<
      string,
      { views: number; shares: number; saves: number; likes: number }
    > = {};
    for (const p of selectedPlatforms) {
      const pm = platformMetrics[p];
      metrics[p.toLowerCase()] = {
        views: parseInt(pm.views, 10) || 0,
        shares: parseInt(pm.shares, 10) || 0,
        saves: parseInt(pm.saves, 10) || 0,
        likes: parseInt(pm.likes, 10) || 0,
      };
    }

    const demographics = {
      gender: Object.fromEntries(
        Object.entries(genderCounts)
          .filter(([, v]) => v !== "")
          .map(([k, v]) => [k, parseInt(v, 10) || 0])
      ),
      age_brackets: Object.fromEntries(
        Object.entries(ageBracketCounts)
          .filter(([, v]) => v !== "")
          .map(([k, v]) => [k, parseInt(v, 10) || 0])
      ),
    };

    const record = {
      user_id: user.id,
      episode_title: episodeTitle,
      date_aired: dateAired || null,
      platforms: selectedPlatforms,
      metrics,
      demographics,
      learning,
      custom_fields: customFields,
      is_draft: isDraft,
    };

    let error;
    if (editEntry) {
      ({ error } = await supabase
        .from(tableName)
        .update(record)
        .eq("id", editEntry.id));
    } else {
      ({ error } = await supabase.from(tableName).insert(record));
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
    // Reset form
    setEpisodeTitle("");
    setDateAired("");
    setSelectedPlatforms([]);
    setPlatformMetrics({
      Facebook: { ...EMPTY_METRICS },
      YouTube: { ...EMPTY_METRICS },
    });
    setGenderCounts({});
    setAgeBracketCounts({});
    setLearning("");
    setCustomFields({});
    onSaved();
  }

  return (
    <div className="space-y-6">
      {/* Episode Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="episode_title">Episode Title *</Label>
          <Input
            id="episode_title"
            value={episodeTitle}
            onChange={(e) => setEpisodeTitle(e.target.value)}
            placeholder="Episode title"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="date_aired">Date Aired</Label>
          <Input
            id="date_aired"
            type="date"
            value={dateAired}
            onChange={(e) => setDateAired(e.target.value)}
          />
        </div>
      </div>

      {/* Platform Selection */}
      <div className="space-y-3">
        <Label>Platforms</Label>
        <div className="flex gap-4">
          {PLATFORMS.map((platform) => (
            <label
              key={platform}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Checkbox
                checked={selectedPlatforms.includes(platform)}
                onCheckedChange={() => togglePlatform(platform)}
              />
              <span className="text-sm">{platform}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Per-Platform Metrics */}
      {selectedPlatforms.map((platform) => (
        <div
          key={platform}
          className="rounded-xl border border-border/60 p-4 space-y-3"
        >
          <h4 className="font-medium">{platform} Metrics</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(["views", "shares", "saves", "likes"] as const).map((field) => (
              <div key={field} className="space-y-1">
                <Label className="text-xs capitalize">{field}</Label>
                <Input
                  type="number"
                  min={0}
                  value={platformMetrics[platform]?.[field] ?? ""}
                  onChange={(e) => setMetric(platform, field, e.target.value)}
                  placeholder="0"
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Audience Demographics — Gender */}
      <div className="rounded-xl border border-border/60 p-4 space-y-3">
        <h4 className="font-medium">Audience Demographics — Gender</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {genderOptions.map((g) => (
            <div key={g} className="space-y-1">
              <Label className="text-xs">{g}</Label>
              <Input
                type="number"
                min={0}
                value={genderCounts[g] ?? ""}
                onChange={(e) =>
                  setGenderCounts((prev) => ({
                    ...prev,
                    [g]: e.target.value,
                  }))
                }
                placeholder="0"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Audience Demographics — Age Bracket */}
      <div className="rounded-xl border border-border/60 p-4 space-y-3">
        <h4 className="font-medium">Audience Demographics — Age Bracket</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {ageBracketOptions.map((ab) => (
            <div key={ab} className="space-y-1">
              <Label className="text-xs">{ab}</Label>
              <Input
                type="number"
                min={0}
                value={ageBracketCounts[ab] ?? ""}
                onChange={(e) =>
                  setAgeBracketCounts((prev) => ({
                    ...prev,
                    [ab]: e.target.value,
                  }))
                }
                placeholder="0"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Custom Indicators */}
      <CustomFieldsSection
        programSlug={programSlug}
        values={customFields}
        onChange={setCustomFields}
      />

      {/* Learning */}
      <div className="space-y-2">
        <Label htmlFor="learning">Learnings</Label>
        <Textarea
          id="learning"
          value={learning}
          onChange={(e) => setLearning(e.target.value)}
          placeholder={`Any learnings or insights from this ${programLabel} episode...`}
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

"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, X } from "lucide-react";

interface ProofOfWorkModalProps {
  open: boolean;
  onClose: () => void;
  onSubmitted: () => void;
  activityId: string;
  activityTitle: string;
  submittedBy: string;
  departmentId: string;
  goalId: string;
}

export function ProofOfWorkModal({
  open,
  onClose,
  onSubmitted,
  activityId,
  activityTitle,
  submittedBy,
  departmentId,
  goalId,
}: ProofOfWorkModalProps) {
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function addFiles(newFiles: FileList | null) {
    if (!newFiles) return;
    setFiles((prev) => [...prev, ...Array.from(newFiles)]);
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;

    setSaving(true);
    const supabase = createClient();

    // 1. Create submission
    const { data: submission, error: subErr } = await supabase
      .from("activity_submissions")
      .insert({
        activity_id: activityId,
        submitted_by: submittedBy,
        description: description.trim(),
      })
      .select()
      .single();

    if (subErr) {
      toast.error("Failed to submit: " + subErr.message);
      setSaving(false);
      return;
    }

    // 2. Upload attachments
    for (const file of files) {
      const storagePath = `${departmentId}/${goalId}/${activityId}/${Date.now()}-${file.name}`;
      const { error: uploadErr } = await supabase.storage
        .from("performance-attachments")
        .upload(storagePath, file);

      if (uploadErr) {
        toast.error(`Failed to upload ${file.name}: ` + uploadErr.message);
        continue;
      }

      await supabase.from("activity_attachments").insert({
        submission_id: submission.id,
        file_name: file.name,
        file_size: file.size,
        storage_path: storagePath,
      });
    }

    toast.success("Activity marked as done");
    setDescription("");
    setFiles([]);
    onSubmitted();
    onClose();
    setSaving(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark as Done</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground -mt-1 line-clamp-2">
          {activityTitle}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="proof-desc">What did you do? *</Label>
            <Textarea
              id="proof-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Describe what you completed, any blockers you encountered, and outcomes…"
              required
            />
          </div>

          {/* File attachments */}
          <div className="space-y-2">
            <Label>Attachments (optional)</Label>
            {files.length > 0 && (
              <ul className="space-y-1">
                {files.map((f, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between text-sm bg-muted/50 rounded-lg px-3 py-1.5"
                  >
                    <span className="truncate max-w-[80%]">{f.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="text-muted-foreground hover:text-foreground shrink-0"
                    >
                      <X className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 text-sm text-[#6B2D7B] hover:underline"
            >
              <Paperclip className="size-4" />
              Attach files
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || !description.trim()}
              className="bg-[#5BBF3A] hover:bg-[#4da830] text-white"
            >
              {saving ? "Submitting…" : "Mark as Done"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

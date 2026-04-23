"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import {
  deleteAttachment,
  getAttachmentSignedUrl,
  uploadAttachment,
} from "@/lib/projects/mutations";
import { listAttachments } from "@/lib/projects/queries";
import type { ProjectActivityAttachment } from "@/lib/projects/types";

const MAX_BYTES = 25 * 1024 * 1024;

interface Props {
  projectId: string;
  activityId: string;
  currentUserId: string;
  canUpload: boolean;
  canDelete: boolean;
  onChange: () => void;
  onCountChange?: (n: number) => void;
}

export function AttachmentsGallery({
  projectId,
  activityId,
  currentUserId,
  canUpload,
  canDelete,
  onChange,
  onCountChange,
}: Props) {
  const [items, setItems] = useState<ProjectActivityAttachment[]>([]);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const list = await listAttachments(activityId);
    setItems(list);
    onCountChange?.(list.length);
    const urls: Record<string, string> = {};
    await Promise.all(
      list.map(async (a) => {
        if (a.mime_type.startsWith("image/")) {
          urls[a.id] = await getAttachmentSignedUrl(a.file_path);
        }
      }),
    );
    setPreviews(urls);
  }, [activityId, onCountChange]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      for (const f of Array.from(files)) {
        if (f.size > MAX_BYTES) throw new Error(`${f.name} exceeds 25 MB`);
        await uploadAttachment({
          project_id: projectId,
          activity_id: activityId,
          uploaded_by: currentUserId,
          file: f,
        });
      }
      await refresh();
      onChange();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(a: ProjectActivityAttachment) {
    if (!confirm(`Delete ${a.file_name}?`)) return;
    await deleteAttachment(a.id, a.file_path);
    await refresh();
    onChange();
  }

  async function openInNewTab(a: ProjectActivityAttachment) {
    const url = previews[a.id] ?? (await getAttachmentSignedUrl(a.file_path));
    window.open(url, "_blank", "noreferrer");
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">Proof of activity</h3>
        {canUpload && (
          <label className="text-xs px-3 py-1 rounded border border-border cursor-pointer">
            {uploading ? "Uploading…" : "Upload proof"}
            <input
              type="file"
              multiple
              className="hidden"
              accept="image/*,application/pdf,.docx,.xlsx"
              disabled={uploading}
              onChange={(e) => handleFiles(e.target.files)}
            />
          </label>
        )}
      </div>
      {error && <div className="text-xs text-red-600 mb-2">{error}</div>}
      {items.length === 0 ? (
        <div className="text-xs text-muted-foreground">No attachments yet.</div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {items.map((a) => (
            <div
              key={a.id}
              className="border border-border rounded p-2 text-[11px]"
            >
              {previews[a.id] ? (
                <div className="relative w-full h-20 mb-1">
                  <Image
                    src={previews[a.id]}
                    alt={a.caption ?? a.file_name}
                    fill
                    className="object-cover rounded"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="w-full h-20 rounded bg-muted flex items-center justify-center text-muted-foreground">
                  {a.file_name.split(".").pop()?.toUpperCase()}
                </div>
              )}
              <div className="truncate" title={a.file_name}>
                {a.file_name}
              </div>
              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => openInNewTab(a)}
                  className="underline"
                >
                  View
                </button>
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => handleDelete(a)}
                    className="text-red-600 underline"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

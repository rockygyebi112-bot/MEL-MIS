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
import { cn } from "@/lib/utils";
import {
  ExternalLink,
  FileText,
  ImageIcon,
  Trash2,
  UploadCloud,
} from "lucide-react";

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

function formatBytes(value: number) {
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
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

    const nextPreviews: Record<string, string> = {};
    await Promise.all(
      list.map(async (item) => {
        if (item.mime_type.startsWith("image/")) {
          nextPreviews[item.id] = await getAttachmentSignedUrl(item.file_path);
        }
      }),
    );
    setPreviews(nextPreviews);
  }, [activityId, onCountChange]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    setError(null);
    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        if (file.size > MAX_BYTES) {
          throw new Error(`${file.name} exceeds 25 MB`);
        }

        await uploadAttachment({
          project_id: projectId,
          activity_id: activityId,
          uploaded_by: currentUserId,
          file,
        });
      }

      await refresh();
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(item: ProjectActivityAttachment) {
    if (!confirm(`Delete ${item.file_name}?`)) return;
    await deleteAttachment(item.id, item.file_path);
    await refresh();
    onChange();
  }

  async function openInNewTab(item: ProjectActivityAttachment) {
    const url =
      previews[item.id] ?? (await getAttachmentSignedUrl(item.file_path));
    window.open(url, "_blank", "noreferrer");
  }

  return (
    <section className="rounded-[26px] border border-stone-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500 dark:text-slate-400">
            Proof of activity
          </p>
          <h3 className="mt-2 text-base font-semibold text-foreground">
            Upload evidence for this task
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Screenshots, PDFs, spreadsheets, and documents help validate progress before completion.
          </p>
        </div>
        <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-[10px] font-semibold text-stone-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
          {items.length} {items.length === 1 ? "item" : "items"}
        </span>
      </div>

      {canUpload && (
        <label
          className={cn(
            "mt-4 flex cursor-pointer flex-col items-center justify-center rounded-[22px] border border-dashed border-stone-300 bg-stone-50 px-5 py-6 text-center transition hover:border-srsf-green-400 hover:bg-srsf-green-50/60 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-srsf-green-700 dark:hover:bg-srsf-green-950/20",
            uploading && "cursor-wait opacity-70",
          )}
        >
          <div className="rounded-2xl bg-white p-3 text-srsf-green-700 shadow-sm dark:bg-slate-900 dark:text-srsf-green-300">
            <UploadCloud className="h-5 w-5" />
          </div>
          <div className="mt-3 text-sm font-semibold text-foreground">
            {uploading ? "Uploading proof..." : "Drop files here or click to upload"}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Accepted: images, PDF, DOCX, XLSX up to 25 MB each
          </div>
          <input
            type="file"
            multiple
            className="hidden"
            accept="image/*,application/pdf,.docx,.xlsx"
            disabled={uploading}
            onChange={(e) => void handleFiles(e.target.files)}
          />
        </label>
      )}

      {error && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <div className="mt-4 rounded-[22px] border border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-center dark:border-slate-700 dark:bg-slate-950">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-stone-500 shadow-sm dark:bg-slate-900 dark:text-slate-300">
            <FileText className="h-5 w-5" />
          </div>
          <div className="mt-3 text-sm font-semibold text-foreground">
            No proof uploaded yet
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Leaf tasks need proof before they can be marked done.
          </p>
        </div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          {items.map((item) => {
            const isImage = !!previews[item.id];

            return (
              <div
                key={item.id}
                className="overflow-hidden rounded-[22px] border border-stone-200 bg-stone-50/80 dark:border-slate-800 dark:bg-slate-950/70"
              >
                {isImage ? (
                  <div className="relative h-36 w-full">
                    <Image
                      src={previews[item.id]}
                      alt={item.caption ?? item.file_name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="flex h-36 items-center justify-center bg-white dark:bg-slate-900">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      {item.mime_type.startsWith("image/") ? (
                        <ImageIcon className="h-8 w-8" />
                      ) : (
                        <FileText className="h-8 w-8" />
                      )}
                      <span className="rounded-full border border-stone-200 bg-stone-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] dark:border-slate-700 dark:bg-slate-950">
                        {item.file_name.split(".").pop() ?? "FILE"}
                      </span>
                    </div>
                  </div>
                )}

                <div className="space-y-3 px-4 py-4">
                  <div>
                    <p
                      className="truncate text-sm font-semibold text-foreground"
                      title={item.file_name}
                    >
                      {item.file_name}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatBytes(item.size_bytes)} • {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void openInNewTab(item)}
                      className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:border-stone-300 hover:text-foreground dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                    >
                      View
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => void handleDelete(item)}
                        className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:border-red-300 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
                      >
                        Delete
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

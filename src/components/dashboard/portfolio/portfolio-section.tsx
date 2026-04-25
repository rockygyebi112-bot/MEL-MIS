"use client";

import { ReactNode } from "react";

interface Props {
  title: string;
  children: ReactNode;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  /** Optional skeleton to render while loading. Defaults to a generic block. */
  skeleton?: ReactNode;
}

export function PortfolioSection({
  title,
  children,
  loading,
  error,
  onRetry,
  skeleton,
}: Props) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold mb-3">{title}</h2>
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex items-center justify-between">
          <span>{error}</span>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="text-xs font-semibold underline"
            >
              Retry
            </button>
          )}
        </div>
      ) : loading ? (
        skeleton ?? (
          <div className="h-32 rounded-lg border border-border bg-muted/40 animate-pulse" />
        )
      ) : (
        children
      )}
    </section>
  );
}

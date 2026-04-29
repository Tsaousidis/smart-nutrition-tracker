"use client";

import { useTranslations } from "next-intl";

export default function Loading() {
  const t = useTranslations("Dashboard");

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 animate-pulse rounded bg-surface-soft" />
        <div className="h-8 w-20 animate-pulse rounded bg-surface-soft" />
      </div>

      {/* Today's summary cards skeleton */}
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-surface p-4">
            <div className="mb-2 h-4 w-16 animate-pulse rounded bg-surface-soft" />
            <div className="h-8 w-20 animate-pulse rounded bg-surface-soft" />
          </div>
        ))}
      </div>

      {/* Progress bars skeleton */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="mb-4 h-5 w-24 animate-pulse rounded bg-surface-soft" />
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i}>
              <div className="mb-1 flex justify-between text-sm">
                <div className="h-4 w-16 animate-pulse rounded bg-surface-soft" />
                <div className="h-4 w-12 animate-pulse rounded bg-surface-soft" />
              </div>
              <div className="h-3 w-full animate-pulse rounded-full bg-surface-soft" />
            </div>
          ))}
        </div>
      </div>

      {/* Meals section skeleton */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="mb-4 h-5 w-32 animate-pulse rounded bg-surface-soft" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-surface-soft p-4">
              <div className="mb-2 h-5 w-24 animate-pulse rounded bg-surface" />
              <div className="space-y-1">
                <div className="h-4 w-full animate-pulse rounded bg-surface" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-surface" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
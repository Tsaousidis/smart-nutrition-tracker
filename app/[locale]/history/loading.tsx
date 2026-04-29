"use client";

import { useTranslations } from "next-intl";

export default function Loading() {
  const t = useTranslations("History");

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-7 w-24 animate-pulse rounded bg-surface-soft" />
        <div className="h-7 w-20 animate-pulse rounded bg-surface-soft" />
      </div>

      {/* Date picker skeleton */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 animate-pulse rounded-lg bg-surface-soft" />
          <div className="flex-1">
            <div className="mb-2 h-5 w-32 animate-pulse rounded bg-surface-soft" />
            <div className="h-4 w-48 animate-pulse rounded bg-surface-soft" />
          </div>
          <div className="h-10 w-20 animate-pulse rounded-lg bg-surface-soft" />
        </div>
      </div>

      {/* Day selector skeleton */}
      <div className="flex gap-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 flex-1 animate-pulse rounded-lg bg-surface-soft" />
        ))}
      </div>

      {/* Selected day skeleton */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="mb-1 h-6 w-32 animate-pulse rounded bg-surface-soft" />
            <div className="h-4 w-20 animate-pulse rounded bg-surface-soft" />
          </div>
          <div className="flex gap-4">
            <div className="h-5 w-16 animate-pulse rounded bg-surface-soft" />
            <div className="h-5 w-16 animate-pulse rounded bg-surface-soft" />
            <div className="h-5 w-16 animate-pulse rounded bg-surface-soft" />
            <div className="h-5 w-16 animate-pulse rounded bg-surface-soft" />
          </div>
        </div>

        {/* Meals list skeleton */}
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-surface-soft p-4">
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <div className="mb-1 h-5 w-24 animate-pulse rounded bg-surface" />
                  <div className="h-3 w-32 animate-pulse rounded bg-surface" />
                </div>
                <div className="h-6 w-16 animate-pulse rounded bg-surface" />
              </div>
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
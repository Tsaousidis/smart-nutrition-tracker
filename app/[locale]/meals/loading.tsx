"use client";

import { useTranslations } from "next-intl";

export default function Loading() {
  const t = useTranslations("Meals");

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-7 w-24 animate-pulse rounded bg-surface-soft" />
        <div className="h-7 w-20 animate-pulse rounded bg-surface-soft" />
      </div>

      {/* Form skeleton */}
      <div className="rounded-xl border border-border bg-surface p-6">
        {/* Title input skeleton */}
        <div className="mb-4">
          <div className="mb-1 h-4 w-20 animate-pulse rounded bg-surface-soft" />
          <div className="h-10 w-full animate-pulse rounded-lg bg-surface-soft" />
        </div>

        {/* Date picker skeleton */}
        <div className="mb-4">
          <div className="mb-1 h-4 w-24 animate-pulse rounded bg-surface-soft" />
          <div className="flex gap-2">
            <div className="h-10 flex-1 animate-pulse rounded-lg bg-surface-soft" />
            <div className="h-10 w-24 animate-pulse rounded-lg bg-surface-soft" />
          </div>
        </div>

        {/* Textarea skeleton */}
        <div className="mb-4">
          <div className="mb-1 h-4 w-32 animate-pulse rounded bg-surface-soft" />
          <div className="h-40 w-full animate-pulse rounded-lg bg-surface-soft" />
        </div>

        {/* Button skeleton */}
        <div className="h-10 w-32 animate-pulse rounded-lg bg-surface-soft" />
      </div>

      {/* Parsed items skeleton */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="mb-4 h-5 w-40 animate-pulse rounded bg-surface-soft" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-surface-soft p-4">
              <div className="mb-2 flex gap-2">
                <div className="h-8 flex-1 animate-pulse rounded bg-surface" />
                <div className="h-8 w-20 animate-pulse rounded bg-surface" />
                <div className="h-8 w-16 animate-pulse rounded bg-surface" />
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div className="h-6 animate-pulse rounded bg-surface" />
                <div className="h-6 animate-pulse rounded bg-surface" />
                <div className="h-6 animate-pulse rounded bg-surface" />
                <div className="h-6 animate-pulse rounded bg-surface" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
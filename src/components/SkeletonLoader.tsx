"use client";

/**
 * Skeleton loader that mimics the UpdateList layout while data is loading.
 * Provides a visual placeholder instead of a bare spinner.
 */
export function SkeletonLoader() {
  return (
    <div className="space-y-8 animate-pulse" aria-busy="true" aria-label="Loading results">
      {/* Stat cards skeleton */}
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl p-3 bg-gray-100 dark:bg-gray-800"
          >
            <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
            <div className="h-6 w-8 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        ))}
      </div>

      {/* Section header skeleton */}
      <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded" />

      {/* Card skeletons */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3"
        >
          {/* Title */}
          <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
          {/* Subtitle */}
          <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
          {/* Body lines */}
          <div className="space-y-2">
            <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded" />
            <div className="h-3 w-5/6 bg-gray-100 dark:bg-gray-800 rounded" />
            <div className="h-3 w-2/3 bg-gray-100 dark:bg-gray-800 rounded" />
          </div>
          {/* Tags */}
          <div className="flex gap-2">
            <div className="h-5 w-16 bg-gray-100 dark:bg-gray-800 rounded-full" />
            <div className="h-5 w-20 bg-gray-100 dark:bg-gray-800 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

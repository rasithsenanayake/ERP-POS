import React from 'react';
import { Skeleton } from '../ui/Skeleton';

/** Shown for the split second while a page's code loads. */
export function PageSkeleton() {
  return (
    <div role="status" aria-label="Loading page">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-8 w-28" />
      </div>
      <div className="rounded-lg border border-line bg-surface shadow-card">
        <div className="flex gap-2 border-b border-line p-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="divide-y divide-line">
          {Array.from({ length: 6 }, (_, i) =>
          <div key={i} className="flex items-center gap-4 px-4 py-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-20" />
            </div>
          )}
        </div>
      </div>
    </div>);

}
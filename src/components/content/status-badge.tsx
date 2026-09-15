'use client';

import { ContentStatus, STATUS_LABELS, STATUS_COLORS } from '@/lib/constants';

export function StatusBadge({ status }: { status: ContentStatus }) {
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

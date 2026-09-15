'use client';

import { Priority, PRIORITY_LABELS, PRIORITY_COLORS } from '@/lib/constants';

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${PRIORITY_COLORS[priority]}`}>
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

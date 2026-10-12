import React from 'react';
import { TicketUrgency } from '@/lib/types';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

interface UrgencyBadgeProps {
  urgency: TicketUrgency | string;
  size?: 'sm' | 'md';
}

export function UrgencyBadge({ urgency, size = 'md' }: UrgencyBadgeProps) {
  const isUrgent = urgency === 'Urgente';

  return (
    <span
      className={`inline-flex items-center rounded-md font-medium border ${
        size === 'sm' ? 'text-[11px] px-2 py-0.5 gap-1' : 'text-xs px-2.5 py-1 gap-1.5'
      } ${
        isUrgent
          ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50'
          : 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700'
      }`}
    >
      {isUrgent ? (
        <AlertTriangle size={13} className="text-rose-600 dark:text-rose-400 shrink-0" />
      ) : (
        <ShieldCheck size={13} className="text-zinc-500 shrink-0" />
      )}
      <span>{urgency}</span>
    </span>
  );
}

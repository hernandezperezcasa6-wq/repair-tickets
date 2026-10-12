import React from 'react';
import { TicketStatus } from '@/lib/types';
import { Clock, PlayCircle, CheckCircle2, Archive } from 'lucide-react';

interface StatusBadgeProps {
  status: TicketStatus | string;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  let config = {
    bg: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-400/10 dark:text-amber-400 dark:border-amber-400/20',
    icon: Clock,
    label: status,
    dot: 'bg-amber-500',
  };

  switch (status) {
    case 'Pendiente':
      config = {
        bg: 'bg-amber-500/10 text-amber-700 border-amber-500/30 dark:bg-amber-400/10 dark:text-amber-300 dark:border-amber-400/20',
        icon: Clock,
        label: 'Pendiente',
        dot: 'bg-amber-500',
      };
      break;
    case 'En proceso':
      config = {
        bg: 'bg-blue-500/10 text-blue-700 border-blue-500/30 dark:bg-blue-400/10 dark:text-blue-300 dark:border-blue-400/20',
        icon: PlayCircle,
        label: 'En proceso',
        dot: 'bg-blue-500',
      };
      break;
    case 'Completado':
      config = {
        bg: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:bg-emerald-400/10 dark:text-emerald-300 dark:border-emerald-400/20',
        icon: CheckCircle2,
        label: 'Completado',
        dot: 'bg-emerald-500',
      };
      break;
    case 'Cerrado':
      config = {
        bg: 'bg-zinc-500/10 text-zinc-700 border-zinc-500/30 dark:bg-zinc-400/10 dark:text-zinc-300 dark:border-zinc-400/20',
        icon: Archive,
        label: 'Cerrado',
        dot: 'bg-zinc-500',
      };
      break;
  }

  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3 py-1.5 gap-2 font-medium',
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border transition-colors ${config.bg} ${sizeClasses[size]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot} animate-pulse`} />
      <Icon size={iconSizes[size]} className="shrink-0" />
      <span>{config.label}</span>
    </span>
  );
}

import React from 'react';
import { TicketStatusHistory } from '@/lib/types';
import { formatDate } from '@/lib/utils/formatters';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CircleDot, UserCheck, Clock } from 'lucide-react';

interface TicketTimelineProps {
  history: TicketStatusHistory[];
}

export function TicketTimeline({ history }: TicketTimelineProps) {
  if (!history || history.length === 0) {
    return (
      <div className="text-sm text-zinc-500 py-4 text-center">
        No hay registros de historial aún.
      </div>
    );
  }

  // Ordenar cronológicamente (más antiguo primero para ver la evolución o más reciente arriba)
  const sortedHistory = [...history].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-zinc-200 dark:before:bg-zinc-800">
      {sortedHistory.map((item, index) => {
        const isLast = index === sortedHistory.length - 1;

        return (
          <div key={item.id} className="relative group">
            {/* Timeline dot */}
            <div
              className={`absolute -left-6 top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 bg-white dark:bg-zinc-900 ${
                isLast
                  ? 'border-blue-600 text-blue-600 shadow-xs shadow-blue-500/50'
                  : 'border-zinc-300 dark:border-zinc-700 text-zinc-400'
              }`}
            >
              <CircleDot size={10} className={isLast ? 'text-blue-600' : 'text-zinc-400'} />
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-lg p-3.5 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <StatusBadge status={item.new_status} size="sm" />
                  {item.old_status && (
                    <span className="text-xs text-zinc-400">
                      (Anterior: {item.old_status})
                    </span>
                  )}
                </div>
                <time className="text-xs text-zinc-400 flex items-center gap-1">
                  <Clock size={12} />
                  {formatDate(item.created_at)}
                </time>
              </div>

              {item.notes && (
                <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-1 whitespace-pre-wrap leading-relaxed">
                  {item.notes}
                </p>
              )}

              {item.changer && (
                <div className="mt-2 text-xs text-zinc-400 flex items-center gap-1">
                  <UserCheck size={12} />
                  <span>Por: {item.changer.full_name}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

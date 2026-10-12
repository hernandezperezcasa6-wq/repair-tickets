import React from 'react';
import { PhotoChannel } from '@/lib/types';
import { Send, MessageCircle } from 'lucide-react';
import { getWhatsAppUrl, getTelegramUrl } from '@/lib/utils/formatters';

interface ChannelBadgeProps {
  channel: PhotoChannel | string;
  phone?: string;
  ticketNumber?: string;
  location?: string;
  clickable?: boolean;
}

export function ChannelBadge({
  channel,
  phone,
  ticketNumber,
  location,
  clickable = true,
}: ChannelBadgeProps) {
  const isWhatsApp = channel === 'WhatsApp' || channel === 'Ambos';
  const isTelegram = channel === 'Telegram' || channel === 'Ambos';

  return (
    <div className="inline-flex items-center gap-1.5 flex-wrap">
      {isWhatsApp && (
        phone && clickable ? (
          <a
            href={getWhatsAppUrl(phone, ticketNumber, location)}
            target="_blank"
            rel="noopener noreferrer"
            title={`Abrir WhatsApp para fotos (${phone})`}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
          >
            <MessageCircle size={13} className="text-emerald-600 dark:text-emerald-400" />
            <span>WhatsApp</span>
          </a>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
            <MessageCircle size={12} />
            <span>WhatsApp</span>
          </span>
        )
      )}

      {isTelegram && (
        phone && clickable ? (
          <a
            href={getTelegramUrl(phone)}
            target="_blank"
            rel="noopener noreferrer"
            title={`Abrir Telegram para fotos (${phone})`}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 transition-colors dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800"
          >
            <Send size={13} className="text-sky-600 dark:text-sky-400" />
            <span>Telegram</span>
          </a>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800">
            <Send size={12} />
            <span>Telegram</span>
          </span>
        )
      )}
    </div>
  );
}

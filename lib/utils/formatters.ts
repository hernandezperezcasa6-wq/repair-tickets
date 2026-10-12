/**
 * Formateador de fechas para uso en la interfaz en español
 */
export function formatDate(dateString?: string | null): string {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Limpia números telefónicos eliminando espacios, guiones y paréntesis
 */
export function sanitizePhone(phone?: string | null): string {
  if (!phone) return '';
  return phone.replace(/[^\d+]/g, '');
}

/**
 * Genera el enlace directo a WhatsApp para coordinar fotografías de un ticket
 */
export function getWhatsAppUrl(phone: string, ticketNumber?: string, location?: string): string {
  const cleanPhone = sanitizePhone(phone).replace(/^\+/, '');
  const message = ticketNumber
    ? `Hola, me comunico de soporte técnico respecto al ticket *${ticketNumber}*${location ? ` (${location})` : ''}. ¿Podrías enviarme fotografías del equipo y la falla reportada?`
    : `Hola, me comunico respecto al servicio técnico de su equipo.`;
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Genera el enlace directo a Telegram
 */
export function getTelegramUrl(contact: string): string {
  const clean = contact.replace(/[@+]/g, '').trim();
  return `https://t.me/${clean}`;
}

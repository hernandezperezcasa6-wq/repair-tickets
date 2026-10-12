import { formatDate } from './formatters';
import { Ticket } from '@/lib/types';

/**
 * Escapa un campo para formato CSV estándar (RFC 4180)
 */
function escapeCSVField(value: unknown): string {
  if (value === null || value === undefined) return '""';
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
}

export interface CSVExportOptions {
  filename?: string;
  includeClientDetails?: boolean;
  includeTechnician?: boolean;
  includeInternalNotes?: boolean;
}

/**
 * Exporta una lista de tickets a un archivo CSV con BOM UTF-8 (\uFEFF)
 * asegurando compatibilidad nativa con Microsoft Excel sin distorsión de caracteres.
 */
export function exportTicketsToCSV(tickets: Ticket[], options: CSVExportOptions = {}) {
  const headers = [
    'Nº Ticket',
    'Fecha Creación',
    'Local / Sucursal',
    'Dirección',
    'Contacto en Sitio',
    'Teléfono',
    'Tipo de Equipo',
    'Urgencia',
    'Estado',
    'Fotos Disponibles',
    'Canal Fotos',
    'Descripción del Problema',
  ];

  if (options.includeClientDetails) {
    headers.push('Cliente Registrado', 'Correo Cliente');
  }

  if (options.includeTechnician) {
    headers.push('Técnico Asignado');
  }

  headers.push('Última Actualización');

  const rows: string[] = [headers.join(',')];

  for (const t of tickets) {
    const row = [
      escapeCSVField(t.ticket_number),
      escapeCSVField(formatDate(t.created_at)),
      escapeCSVField(t.location),
      escapeCSVField(t.address),
      escapeCSVField(t.contact_name),
      escapeCSVField(t.contact_phone),
      escapeCSVField(t.equipment_type),
      escapeCSVField(t.urgency),
      escapeCSVField(t.status),
      escapeCSVField(t.photo_available ? 'Sí' : 'No'),
      escapeCSVField(t.preferred_photo_channel),
      escapeCSVField(t.description),
    ];

    if (options.includeClientDetails) {
      row.push(
        escapeCSVField(t.client?.full_name || '—'),
        escapeCSVField(t.client?.email || '—')
      );
    }

    if (options.includeTechnician) {
      row.push(escapeCSVField(t.assigned_technician || 'Sin asignar'));
    }

    row.push(escapeCSVField(formatDate(t.updated_at)));

    rows.push(row.join(','));
  }

  // BOM UTF-8 para garantizar que Excel abra tildes y caracteres en español correctamente
  const csvContent = '\uFEFF' + rows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  const nowStr = new Date().toISOString().slice(0, 10);
  link.setAttribute('download', options.filename || `reporte_tickets_${nowStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

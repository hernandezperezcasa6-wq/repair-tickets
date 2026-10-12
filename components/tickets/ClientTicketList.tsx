'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Ticket } from '@/lib/types';
import { FilterBar } from './FilterBar';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { UrgencyBadge } from '@/components/ui/UrgencyBadge';
import { formatDate } from '@/lib/utils/formatters';
import { exportTicketsToCSV } from '@/lib/utils/csv';
import { Eye, PlusCircle, MapPin, Inbox } from 'lucide-react';

interface ClientTicketListProps {
  initialTickets: Ticket[];
}

export function ClientTicketList({ initialTickets }: ClientTicketListProps) {
  const [tickets] = useState<Ticket[]>(initialTickets);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      // 1. Buscador textual
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchesNumber = t.ticket_number?.toLowerCase().includes(query);
        const matchesLocation = t.location?.toLowerCase().includes(query);
        const matchesContact = t.contact_name?.toLowerCase().includes(query);
        const matchesDesc = t.description?.toLowerCase().includes(query);
        const matchesEquip = t.equipment_type?.toLowerCase().includes(query);
        if (!matchesNumber && !matchesLocation && !matchesContact && !matchesDesc && !matchesEquip) {
          return false;
        }
      }

      // 2. Filtro de estado
      if (statusFilter !== 'ALL' && t.status !== statusFilter) {
        return false;
      }

      // 3. Rango de fechas
      if (startDate) {
        const created = new Date(t.created_at).toISOString().slice(0, 10);
        if (created < startDate) return false;
      }
      if (endDate) {
        const created = new Date(t.created_at).toISOString().slice(0, 10);
        if (created > endDate) return false;
      }

      return true;
    });
  }, [tickets, searchTerm, statusFilter, startDate, endDate]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setStartDate('');
    setEndDate('');
  };

  const handleExportCSV = () => {
    exportTicketsToCSV(filteredTickets, {
      filename: `mis_tickets_${new Date().toISOString().slice(0, 10)}.csv`,
      includeClientDetails: false,
      includeTechnician: true,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header con botón para nuevo ticket */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Mis Solicitudes y Tickets
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Consulte el progreso técnico y estatus en tiempo real de sus requerimientos.
          </p>
        </div>

        <Link
          href="/dashboard/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-sm transition-all shadow-md shadow-blue-500/20"
        >
          <PlusCircle size={18} />
          <span>Nueva Solicitud</span>
        </Link>
      </div>

      {/* Barra de Filtros */}
      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        startDate={startDate}
        onStartDateChange={setStartDate}
        endDate={endDate}
        onEndDateChange={setEndDate}
        onResetFilters={handleResetFilters}
        onExportCSV={handleExportCSV}
        totalFiltered={filteredTickets.length}
      />

      {/* Tabla y vista responsive de tickets */}
      {filteredTickets.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
          <div className="inline-flex p-4 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mb-3">
            <Inbox size={32} />
          </div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            No se encontraron tickets
          </h3>
          <p className="text-sm text-zinc-500 mt-1 max-w-sm mx-auto">
            {tickets.length === 0
              ? 'Aún no ha registrado ningún ticket de servicio. Cree uno nuevo para recibir atención técnica.'
              : 'Ningún ticket coincide con los filtros aplicados. Intente limpiar los filtros.'}
          </p>
          {tickets.length === 0 && (
            <Link
              href="/dashboard/new"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
            >
              <PlusCircle size={14} />
              <span>Crear mi primer ticket</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  <th className="py-3.5 px-4">Nº Ticket</th>
                  <th className="py-3.5 px-4">Fecha</th>
                  <th className="py-3.5 px-4">Local / Sucursal</th>
                  <th className="py-3.5 px-4">Equipo / Resumen</th>
                  <th className="py-3.5 px-4">Urgencia</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {filteredTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    {/* Número */}
                    <td className="py-3.5 px-4 font-mono font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                      {ticket.ticket_number}
                    </td>

                    {/* Fecha */}
                    <td className="py-3.5 px-4 text-zinc-500 dark:text-zinc-400 whitespace-nowrap text-xs">
                      {formatDate(ticket.created_at)}
                    </td>

                    {/* Local */}
                    <td className="py-3.5 px-4 font-medium text-zinc-900 dark:text-zinc-100">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={13} className="text-zinc-400 shrink-0" />
                        <span>{ticket.location}</span>
                      </div>
                    </td>

                    {/* Resumen */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-medium text-xs text-zinc-700 dark:text-zinc-300">
                        {ticket.equipment_type}
                      </div>
                      <div className="text-xs text-zinc-500 truncate" title={ticket.description}>
                        {ticket.description.length > 50
                          ? `${ticket.description.slice(0, 50)}...`
                          : ticket.description}
                      </div>
                    </td>

                    {/* Urgencia */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <UrgencyBadge urgency={ticket.urgency} size="sm" />
                    </td>

                    {/* Estado */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={ticket.status} size="sm" />
                    </td>

                    {/* Acción */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Link
                        href={`/dashboard/ticket/${ticket.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40 transition-colors"
                      >
                        <Eye size={14} />
                        <span>Ver detalle</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

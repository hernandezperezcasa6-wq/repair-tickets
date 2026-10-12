'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Ticket, TicketStatus } from '@/lib/types';
import { FilterBar } from './FilterBar';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { UrgencyBadge } from '@/components/ui/UrgencyBadge';
import { ChannelBadge } from '@/components/ui/ChannelBadge';
import { formatDate } from '@/lib/utils/formatters';
import { exportTicketsToCSV } from '@/lib/utils/csv';
import {
  Settings,
  MapPin,
  CheckSquare,
  Square,
  ClipboardList,
  Layers,
} from 'lucide-react';

interface AdminTicketListProps {
  initialTickets: Ticket[];
}

export function AdminTicketList({ initialTickets }: AdminTicketListProps) {
  const router = useRouter();
  const supabase = createClient();

  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selección en lote (Batch actions)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchStatus, setBatchStatus] = useState<TicketStatus>('En proceso');
  const [batchLoading, setBatchLoading] = useState(false);

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchesNumber = t.ticket_number?.toLowerCase().includes(query);
        const matchesClient = t.client?.full_name?.toLowerCase().includes(query) || t.client?.email?.toLowerCase().includes(query);
        const matchesLocation = t.location?.toLowerCase().includes(query);
        const matchesContact = t.contact_name?.toLowerCase().includes(query);
        const matchesPhone = t.contact_phone?.toLowerCase().includes(query);
        const matchesDesc = t.description?.toLowerCase().includes(query);
        const matchesTech = t.assigned_technician?.toLowerCase().includes(query);
        if (!matchesNumber && !matchesClient && !matchesLocation && !matchesContact && !matchesPhone && !matchesDesc && !matchesTech) {
          return false;
        }
      }

      if (statusFilter !== 'ALL' && t.status !== statusFilter) {
        return false;
      }

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

  const handleSelectAll = () => {
    if (selectedIds.length === filteredTickets.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTickets.map((t) => t.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Cambio masivo de estado
  const handleBatchStatusChange = async () => {
    if (selectedIds.length === 0) return;
    if (
      !confirm(
        `¿Desea cambiar el estado de ${selectedIds.length} tickets seleccionados a "${batchStatus}"?`
      )
    ) {
      return;
    }

    setBatchLoading(true);
    try {
      const { error } = await supabase
        .from('tickets')
        .update({
          status: batchStatus,
          client_feedback: `Actualización masiva de estado a ${batchStatus}`,
        })
        .in('id', selectedIds);

      if (error) throw error;

      setTickets((prev) =>
        prev.map((t) =>
          selectedIds.includes(t.id) ? { ...t, status: batchStatus } : t
        )
      );
      setSelectedIds([]);
      router.refresh();
    } catch (err: unknown) {
      alert((err as Error)?.message || 'Error en la actualización masiva.');
    } finally {
      setBatchLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setStartDate('');
    setEndDate('');
  };

  const handleExportCSV = () => {
    const dataToExport = selectedIds.length > 0
      ? tickets.filter((t) => selectedIds.includes(t.id))
      : filteredTickets;

    exportTicketsToCSV(dataToExport, {
      filename: `reporte_general_tickets_${new Date().toISOString().slice(0, 10)}.csv`,
      includeClientDetails: true,
      includeTechnician: true,
    });
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <ClipboardList size={26} className="text-blue-600" />
            Control Central de Tickets
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Gestión operativa, asignación de técnicos y trazabilidad en tiempo real.
          </p>
        </div>
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

      {/* Barra de Acciones en Lote (Batch Actions) */}
      {selectedIds.length > 0 && (
        <div className="p-4 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-sm font-semibold text-blue-900 dark:text-blue-200">
            <Layers size={18} className="text-blue-600" />
            <span>
              {selectedIds.length} ticket(s) seleccionado(s)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-600 dark:text-zinc-300">Cambiar estado a:</span>
            <select
              value={batchStatus}
              onChange={(e) => setBatchStatus(e.target.value as TicketStatus)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-medium text-zinc-900 dark:text-zinc-100 outline-hidden"
            >
              <option value="Pendiente">Pendiente</option>
              <option value="En proceso">En proceso</option>
              <option value="Completado">Completado</option>
              <option value="Cerrado">Cerrado</option>
            </select>

            <button
              onClick={handleBatchStatusChange}
              disabled={batchLoading}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 cursor-pointer shadow-xs transition-colors"
            >
              {batchLoading ? 'Aplicando...' : 'Aplicar a seleccionados'}
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:underline cursor-pointer"
            >
              Deseleccionar
            </button>
          </div>
        </div>
      )}

      {/* Tabla de Tickets del Administrador */}
      {filteredTickets.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
          <div className="inline-flex p-4 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mb-3">
            <ClipboardList size={32} />
          </div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            No hay tickets registrados
          </h3>
          <p className="text-sm text-zinc-500 mt-1 max-w-sm mx-auto">
            No se encontraron tickets con los criterios de búsqueda actuales.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  <th className="py-3.5 px-3 w-10 text-center">
                    <button
                      onClick={handleSelectAll}
                      className="cursor-pointer text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                    >
                      {selectedIds.length === filteredTickets.length &&
                      filteredTickets.length > 0 ? (
                        <CheckSquare size={16} className="text-blue-600" />
                      ) : (
                        <Square size={16} />
                      )}
                    </button>
                  </th>
                  <th className="py-3.5 px-4">Nº Ticket</th>
                  <th className="py-3.5 px-4">Cliente</th>
                  <th className="py-3.5 px-4">Local</th>
                  <th className="py-3.5 px-4">Teléfono / Fotos</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4">Urgencia</th>
                  <th className="py-3.5 px-4">Fecha</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {filteredTickets.map((ticket) => {
                  const isSelected = selectedIds.includes(ticket.id);

                  return (
                    <tr
                      key={ticket.id}
                      className={`hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors ${
                        isSelected ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-3 text-center">
                        <button
                          onClick={() => handleToggleSelect(ticket.id)}
                          className="cursor-pointer text-zinc-400 hover:text-blue-600"
                        >
                          {isSelected ? (
                            <CheckSquare size={16} className="text-blue-600" />
                          ) : (
                            <Square size={16} />
                          )}
                        </button>
                      </td>

                      {/* Nº Ticket */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                        <Link
                          href={`/admin/ticket/${ticket.id}`}
                          className="hover:underline"
                        >
                          {ticket.ticket_number}
                        </Link>
                      </td>

                      {/* Cliente */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs">
                          {ticket.client?.full_name || 'Cliente'}
                        </div>
                        <div className="text-[11px] text-zinc-500 truncate max-w-[140px]">
                          {ticket.client?.email || '—'}
                        </div>
                      </td>

                      {/* Local */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                          <MapPin size={12} className="text-zinc-400 shrink-0" />
                          <span>{ticket.location}</span>
                        </div>
                        <div className="text-[11px] text-zinc-500 truncate max-w-[160px]">
                          {ticket.equipment_type}
                        </div>
                      </td>

                      {/* Teléfono y Canal Fotos */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono text-xs text-zinc-700 dark:text-zinc-300 mb-1">
                          {ticket.contact_phone}
                        </div>
                        <ChannelBadge
                          channel={ticket.preferred_photo_channel}
                          phone={ticket.contact_phone}
                          ticketNumber={ticket.ticket_number}
                          location={ticket.location}
                        />
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge status={ticket.status} size="sm" />
                      </td>

                      {/* Urgencia */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <UrgencyBadge urgency={ticket.urgency} size="sm" />
                      </td>

                      {/* Fecha */}
                      <td className="py-3.5 px-4 text-xs text-zinc-500 whitespace-nowrap">
                        {formatDate(ticket.created_at)}
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <Link
                          href={`/admin/ticket/${ticket.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition-colors"
                        >
                          <Settings size={13} />
                          <span>Gestionar</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

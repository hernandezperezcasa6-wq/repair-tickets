'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { exportTicketsToCSV } from '@/lib/utils/csv';
import { Ticket } from '@/lib/types';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Filter,
  CheckCircle2,
  AlertCircle,
  Layers,
} from 'lucide-react';

type DatePreset = 'thisMonth' | 'lastMonth' | 'all' | 'custom';
type StatusFilterType = 'all' | 'completed' | 'active';

export function DataExporter() {
  const supabase = createClient();

  // Opciones de exportación
  const [datePreset, setDatePreset] = useState<DatePreset>('thisMonth');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('all');

  // Campos opcionales
  const [includeClient, setIncludeClient] = useState(true);
  const [includeTechnician, setIncludeTechnician] = useState(true);

  const [exporting, setExporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setExporting(true);
    setStatusMessage(null);

    try {
      let query = supabase
        .from('tickets')
        .select('*, client:profiles(*)')
        .order('created_at', { ascending: false });

      // Filtro de fechas según preset
      const now = new Date();
      if (datePreset === 'thisMonth') {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        query = query.gte('created_at', firstDay);
      } else if (datePreset === 'lastMonth') {
        const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
        const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();
        query = query.gte('created_at', firstDayLastMonth).lte('created_at', lastDayLastMonth);
      } else if (datePreset === 'custom') {
        if (customStart) {
          query = query.gte('created_at', new Date(customStart).toISOString());
        }
        if (customEnd) {
          const endDate = new Date(customEnd);
          endDate.setHours(23, 59, 59, 999);
          query = query.lte('created_at', endDate.toISOString());
        }
      }

      // Filtro de estados
      if (statusFilter === 'completed') {
        query = query.in('status', ['Completado', 'Cerrado']);
      } else if (statusFilter === 'active') {
        query = query.in('status', ['Pendiente', 'En proceso']);
      }

      const { data: tickets, error } = await query;

      if (error) throw error;

      if (!tickets || tickets.length === 0) {
        setStatusMessage({
          type: 'error',
          text: 'No se encontraron tickets con los parámetros seleccionados.',
        });
        setExporting(false);
        return;
      }

      const filename = `exportacion_tickets_${datePreset}_${new Date().toISOString().slice(0, 10)}.csv`;

      exportTicketsToCSV(tickets as Ticket[], {
        filename,
        includeClientDetails: includeClient,
        includeTechnician: includeTechnician,
      });

      setStatusMessage({
        type: 'success',
        text: `¡Exportación exitosa! Se descargaron ${tickets.length} tickets en formato CSV compatible con Excel.`,
      });
    } catch (err: unknown) {
      console.error('Error exporting data:', err);
      setStatusMessage({
        type: 'error',
        text: (err as Error)?.message || 'Error al generar la exportación.',
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Cabecera */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
          <FileSpreadsheet size={26} className="text-emerald-600" />
          Exportación Masiva de Datos
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Genere reportes descargables en formato CSV con codificación UTF-8 BOM para apertura directa en Microsoft Excel sin pérdida de tildes ni acentos.
        </p>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl border text-sm flex items-start gap-2.5 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900'
              : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
          ) : (
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Formulario de Exportación */}
      <form
        onSubmit={handleExport}
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6"
      >
        {/* Rango de Fechas */}
        <div className="space-y-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
            <Calendar size={15} className="text-blue-600" />
            1. Período de Tiempo
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { id: 'thisMonth', label: 'Este mes' },
              { id: 'lastMonth', label: 'Mes pasado' },
              { id: 'all', label: 'Todo el historial' },
              { id: 'custom', label: 'Personalizado' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setDatePreset(p.id as DatePreset)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  datePreset === p.id
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-zinc-50 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {datePreset === 'custom' && (
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div>
                <span className="text-[11px] text-zinc-500 block mb-1">Fecha inicial</span>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 outline-hidden"
                />
              </div>
              <div>
                <span className="text-[11px] text-zinc-500 block mb-1">Fecha final</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 outline-hidden"
                />
              </div>
            </div>
          )}
        </div>

        <hr className="border-zinc-100 dark:border-zinc-800" />

        {/* Filtro de Estado */}
        <div className="space-y-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
            <Filter size={15} className="text-blue-600" />
            2. Filtrar por Estado de Ticket
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {[
              { id: 'all', label: 'Todos los estados' },
              { id: 'completed', label: 'Completados y Cerrados' },
              { id: 'active', label: 'Pendientes y En proceso' },
            ].map((s) => (
              <label
                key={s.id}
                className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                  statusFilter === s.id
                    ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20'
                    : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900'
                }`}
              >
                <input
                  type="radio"
                  name="statusFilter"
                  checked={statusFilter === s.id}
                  onChange={() => setStatusFilter(s.id as StatusFilterType)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                  {s.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        <hr className="border-zinc-100 dark:border-zinc-800" />

        {/* Campos a Incluir */}
        <div className="space-y-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
            <Layers size={15} className="text-blue-600" />
            3. Campos a Incluir en el Archivo
          </label>

          <div className="space-y-2 text-xs">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeClient}
                onChange={(e) => setIncludeClient(e.target.checked)}
                className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                Incluir datos del cliente registrado (Nombre completo y Correo electrónico)
              </span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeTechnician}
                onChange={(e) => setIncludeTechnician(e.target.checked)}
                className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                Incluir técnico responsable asignado
              </span>
            </label>
          </div>
        </div>

        {/* Botón de Descarga */}
        <div className="pt-4 flex items-center justify-end">
          <button
            type="submit"
            disabled={exporting}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-sm shadow-md shadow-emerald-500/20 disabled:opacity-50 cursor-pointer transition-all"
          >
            <Download size={16} />
            <span>{exporting ? 'Generando CSV...' : 'Generar y Descargar CSV'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

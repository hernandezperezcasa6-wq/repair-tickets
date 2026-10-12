'use client';

import React from 'react';
import { Search, Filter, Download, RotateCcw, Calendar } from 'lucide-react';

interface FilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  startDate: string;
  onStartDateChange: (date: string) => void;
  endDate: string;
  onEndDateChange: (date: string) => void;
  onResetFilters: () => void;
  onExportCSV: () => void;
  totalFiltered: number;
}

export function FilterBar({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  onResetFilters,
  onExportCSV,
  totalFiltered,
}: FilterBarProps) {
  const statuses: Array<{ value: string; label: string }> = [
    { value: 'ALL', label: 'Todos los estados' },
    { value: 'Pendiente', label: 'Pendiente' },
    { value: 'En proceso', label: 'En proceso' },
    { value: 'Completado', label: 'Completado' },
    { value: 'Cerrado', label: 'Cerrado' },
  ];

  const hasActiveFilters =
    Boolean(searchTerm) ||
    statusFilter !== 'ALL' ||
    Boolean(startDate) ||
    Boolean(endDate);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-2xs space-y-3">
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por Nº ticket, local, contacto o síntoma..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/60 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden transition-all"
          />
        </div>

        {/* Status Dropdown */}
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-zinc-400 shrink-0 hidden sm:block" />
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full md:w-auto px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/60 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:border-blue-500 outline-hidden"
          >
            {statuses.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Export to CSV Button */}
        <button
          onClick={onExportCSV}
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs shrink-0 cursor-pointer"
        >
          <Download size={15} />
          <span>Exportar CSV</span>
        </button>
      </div>

      {/* Date filter row & clear filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-zinc-500 flex items-center gap-1 font-medium">
            <Calendar size={13} />
            Fechas:
          </span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            title="Fecha inicial"
            className="px-2.5 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 text-xs outline-hidden"
          />
          <span className="text-zinc-400">al</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            title="Fecha final"
            className="px-2.5 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 text-xs outline-hidden"
          />

          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="inline-flex items-center gap-1 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ml-1 cursor-pointer"
            >
              <RotateCcw size={12} />
              Limpiar filtros
            </button>
          )}
        </div>

        <div className="text-zinc-500 font-medium">
          Resultados: <span className="text-zinc-900 dark:text-zinc-100 font-bold">{totalFiltered}</span> tickets
        </div>
      </div>
    </div>
  );
}

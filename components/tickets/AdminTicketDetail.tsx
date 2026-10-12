'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Ticket, TicketStatus, TicketStatusHistory, TicketNote } from '@/lib/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { UrgencyBadge } from '@/components/ui/UrgencyBadge';
import { ChannelBadge } from '@/components/ui/ChannelBadge';
import { TicketTimeline } from './TicketTimeline';
import { TicketNotesList } from './TicketNotesList';
import { formatDate } from '@/lib/utils/formatters';
import {
  MapPin,
  User,
  Wrench,
  ArrowLeft,
  Save,
  MessageCircle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  UserCheck,
} from 'lucide-react';
import Link from 'next/link';

interface AdminTicketDetailProps {
  initialTicket: Ticket;
  initialHistory: TicketStatusHistory[];
  initialNotes: TicketNote[];
}

export function AdminTicketDetail({
  initialTicket,
  initialHistory,
  initialNotes,
}: AdminTicketDetailProps) {
  const router = useRouter();
  const supabase = createClient();

  const [ticket, setTicket] = useState<Ticket>(initialTicket);
  const [history, setHistory] = useState<TicketStatusHistory[]>(initialHistory);
  const [notes, setNotes] = useState<TicketNote[]>(initialNotes);

  // Formulario de gestión técnica
  const [status, setStatus] = useState<TicketStatus>(ticket.status);
  const [assignedTechnician, setAssignedTechnician] = useState(
    ticket.assigned_technician || ''
  );
  const [statusNotes, setStatusNotes] = useState('');
  const [contactLog, setContactLog] = useState('');

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Guardar cambios de estado y técnico
  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(null);
    setErrorMsg(null);

    try {
      const updates: Record<string, unknown> = {
        status,
        assigned_technician: assignedTechnician.trim() || null,
        client_feedback: statusNotes.trim() || undefined,
      };

      const { data: updated, error } = await supabase
        .from('tickets')
        .update(updates)
        .eq('id', ticket.id)
        .select('*, client:profiles(*)')
        .single();

      if (error) throw error;

      // Si se anotó registro de contacto, añadir como nota interna automática
      if (contactLog.trim()) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: contactNote } = await supabase
            .from('ticket_notes')
            .insert({
              ticket_id: ticket.id,
              author_id: user.id,
              content: `📞 BITÁCORA DE CONTACTO (FOTOS): ${contactLog.trim()}`,
              is_internal: true,
            })
            .select('*, author:profiles(*)')
            .single();

          if (contactNote) {
            setNotes((prev) => [...prev, contactNote as TicketNote]);
          }
        }
        setContactLog('');
      }

      setTicket(updated as Ticket);

      // Recargar historial
      const { data: refreshedHistory } = await supabase
        .from('ticket_status_history')
        .select('*, changer:profiles(*)')
        .eq('ticket_id', ticket.id)
        .order('created_at', { ascending: true });

      if (refreshedHistory) {
        setHistory(refreshedHistory as TicketStatusHistory[]);
      }

      setSaveSuccess('Cambios técnicos guardados exitosamente.');
      setStatusNotes('');
      router.refresh();
    } catch (err: unknown) {
      setErrorMsg((err as Error)?.message || 'Error al guardar los cambios.');
    } finally {
      setSaving(false);
    }
  };

  // Añadir notas desde el listado
  const handleAddNote = async (content: string, isInternal: boolean): Promise<boolean> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: newNote, error } = await supabase
      .from('ticket_notes')
      .insert({
        ticket_id: ticket.id,
        author_id: user.id,
        content,
        is_internal: isInternal,
      })
      .select('*, author:profiles(*)')
      .single();

    if (error) {
      console.error('Error inserting note:', error);
      return false;
    }

    setNotes((prev) => [...prev, newNote as TicketNote]);
    return true;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Botón Volver y Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/tickets"
            className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-xl font-bold text-blue-600 dark:text-blue-400">
                {ticket.ticket_number}
              </span>
              <StatusBadge status={ticket.status} size="md" />
              <UrgencyBadge urgency={ticket.urgency} size="sm" />
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Cliente: <span className="font-semibold text-zinc-700 dark:text-zinc-200">{ticket.client?.full_name || 'Desconocido'}</span> ({ticket.client?.email || 'sin correo'}) &bull; Creado el {formatDate(ticket.created_at)}
            </p>
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 text-sm flex items-center gap-2">
          <CheckCircle2 size={18} className="shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-sm flex items-center gap-2">
          <AlertCircle size={18} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Grid Principal: 2 Columnas (Izquierda: Detalle y Notas, Derecha: Gestión Técnica e Historial) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda: Información Técnica y Comentarios (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Tarjeta de Información del Requerimiento */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xs space-y-5">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Equipo Afectado
              </span>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 mt-1">
                <Wrench size={18} className="text-blue-600" />
                {ticket.equipment_type}
              </h2>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Descripción reportada por el cliente
              </label>
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap">
                {ticket.description}
              </div>
            </div>

            <hr className="border-zinc-100 dark:border-zinc-800" />

            {/* Datos de Contacto y Ubicación */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-zinc-400 font-medium">Ubicación física</span>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm mt-0.5">
                  {ticket.location}
                </p>
                <p className="text-zinc-500 mt-0.5 flex items-start gap-1">
                  <MapPin size={13} className="shrink-0 mt-0.5 text-zinc-400" />
                  <span>{ticket.address}</span>
                </p>
              </div>

              <div>
                <span className="text-zinc-400 font-medium">Contacto en Sitio</span>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm mt-0.5 flex items-center gap-1">
                  <User size={13} className="text-zinc-400" />
                  <span>{ticket.contact_name}</span>
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-zinc-600 dark:text-zinc-300 font-mono">
                    {ticket.contact_phone}
                  </span>
                  <ChannelBadge
                    channel={ticket.preferred_photo_channel}
                    phone={ticket.contact_phone}
                    ticketNumber={ticket.ticket_number}
                    location={ticket.location}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Comentarios y Notas Técnicas */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xs space-y-4">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
              <span>Notas y Comunicaciones</span>
              <span className="text-xs font-normal text-zinc-400">
                Públicas e internas para técnicos
              </span>
            </h3>
            <TicketNotesList
              notes={notes}
              ticketId={ticket.id}
              userRole="admin"
              onAddNote={handleAddNote}
            />
          </div>
        </div>

        {/* Columna Derecha: Panel de Gestión y Timeline (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Panel de Gestión del Administrador */}
          <div className="bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-900/60 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <ShieldCheck size={18} className="text-blue-600" />
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Panel de Gestión Técnica
              </h3>
            </div>

            <form onSubmit={handleSaveChanges} className="space-y-4">
              {/* Desplegable de Estado */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Estado del Ticket
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TicketStatus)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-medium focus:border-blue-500 outline-hidden"
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="En proceso">En proceso</option>
                  <option value="Completado">Completado</option>
                  <option value="Cerrado">Cerrado</option>
                </select>
              </div>

              {/* Asignar Técnico */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Técnico Responsable
                </label>
                <div className="relative">
                  <UserCheck
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                  />
                  <input
                    type="text"
                    value={assignedTechnician}
                    onChange={(e) => setAssignedTechnician(e.target.value)}
                    placeholder="Ej. Ing. Carlos Ramírez"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:border-blue-500 outline-hidden"
                  />
                </div>
              </div>

              {/* Bitácora de contacto para fotos */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <MessageCircle size={13} className="text-emerald-600" />
                  <span>Bitácora de contacto para fotos</span>
                </label>
                <input
                  type="text"
                  value={contactLog}
                  onChange={(e) => setContactLog(e.target.value)}
                  placeholder="Ej. Fotos solicitadas por WhatsApp a las 11:30"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:border-blue-500 outline-hidden"
                />
                <p className="text-[10.5px] text-zinc-500">
                  Se guardará automáticamente como nota interna con marca de tiempo.
                </p>
              </div>

              {/* Nota o motivo del cambio de estado */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Motivo o detalle del cambio de estado
                </label>
                <textarea
                  rows={2}
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="Ej. Se coordina visita técnica para mañana a las 09:00 hrs..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:border-blue-500 outline-hidden"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 cursor-pointer transition-all shadow-md shadow-blue-500/20"
              >
                <Save size={14} />
                <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
              </button>
            </form>
          </div>

          {/* Línea de Tiempo del Estado */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Clock size={16} className="text-zinc-400" />
                Historial de Estados
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Auditoría automática de modificaciones
              </p>
            </div>

            <TicketTimeline history={history} />
          </div>
        </div>
      </div>
    </div>
  );
}

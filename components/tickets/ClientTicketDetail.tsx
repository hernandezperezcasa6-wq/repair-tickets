'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Ticket, TicketStatusHistory, TicketNote } from '@/lib/types';
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
  CheckCircle2,
  RefreshCcw,
  ArrowLeft,
  UserCheck,
  MessageCircle,
} from 'lucide-react';
import Link from 'next/link';

interface ClientTicketDetailProps {
  initialTicket: Ticket;
  initialHistory: TicketStatusHistory[];
  initialNotes: TicketNote[];
}

export function ClientTicketDetail({
  initialTicket,
  initialHistory,
  initialNotes,
}: ClientTicketDetailProps) {
  const router = useRouter();
  const supabase = createClient();

  const [ticket, setTicket] = useState<Ticket>(initialTicket);
  const [history] = useState<TicketStatusHistory[]>(initialHistory);
  const [notes, setNotes] = useState<TicketNote[]>(initialNotes);
  const [actionLoading, setActionLoading] = useState(false);
  const [reworkFeedback, setReworkFeedback] = useState('');
  const [showReworkModal, setShowReworkModal] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  // Agregar comentario público del cliente
  const handleAddNote = async (content: string): Promise<boolean> => {
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
        is_internal: false, // Cliente siempre crea notas públicas
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

  // Confirmar finalización
  const handleConfirmCompletion = async () => {
    if (!confirm('¿Confirma que el servicio técnico fue concluido a entera satisfacción?')) {
      return;
    }
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('tickets')
        .update({
          status: 'Cerrado',
          client_feedback: 'El cliente confirmó la finalización y conformidad del servicio.',
        })
        .eq('id', ticket.id);

      if (error) throw error;
      setTicket((prev) => ({ ...prev, status: 'Cerrado', client_feedback: 'Confirmado por cliente' }));
      setFeedbackSuccess('¡Gracias! El ticket ha sido cerrado satisfactoriamente.');
      router.refresh();
    } catch (err: unknown) {
      alert((err as Error)?.message || 'Error al confirmar finalización.');
    } finally {
      setActionLoading(false);
    }
  };

  // Solicitar retrabajo
  const handleRequestRework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reworkFeedback.trim()) return;

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('tickets')
        .update({
          status: 'En proceso',
          client_feedback: `Solicitud de retrabajo: ${reworkFeedback.trim()}`,
        })
        .eq('id', ticket.id);

      if (error) throw error;

      // Insertar nota explicativa
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('ticket_notes').insert({
          ticket_id: ticket.id,
          author_id: user.id,
          content: `⚠️ SOLICITUD DE RETRABAJO: ${reworkFeedback.trim()}`,
          is_internal: false,
        });
      }

      setTicket((prev) => ({ ...prev, status: 'En proceso' }));
      setShowReworkModal(false);
      setFeedbackSuccess('Se ha notificado al equipo técnico sobre su solicitud de retrabajo.');
      router.refresh();
    } catch (err: unknown) {
      alert((err as Error)?.message || 'Error al solicitar retrabajo.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Botón Volver y Cabecera de Ticket */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
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
              Registrado el {formatDate(ticket.created_at)}
            </p>
          </div>
        </div>

        {/* Acciones del cliente si el ticket está en "Completado" */}
        {ticket.status === 'Completado' && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleConfirmCompletion}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer transition-all"
            >
              <CheckCircle2 size={15} />
              <span>Confirmar Finalización</span>
            </button>
            <button
              onClick={() => setShowReworkModal(true)}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs cursor-pointer transition-all"
            >
              <RefreshCcw size={15} />
              <span>Solicitar Retrabajo</span>
            </button>
          </div>
        )}
      </div>

      {feedbackSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 text-sm flex items-center gap-2">
          <CheckCircle2 size={18} className="shrink-0" />
          <span>{feedbackSuccess}</span>
        </div>
      )}

      {/* Grid Principal: Izquierda (Detalle) + Derecha (Timeline y Comentarios) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda: Información Detallada del Ticket */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tarjeta de Datos Técnicos */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xs space-y-5">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Equipo y Síntoma
              </span>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 mt-1">
                <Wrench size={18} className="text-blue-600" />
                {ticket.equipment_type}
              </h2>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Descripción del Problema
              </label>
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap">
                {ticket.description}
              </div>
            </div>

            {/* Técnico Asignado */}
            <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-medium text-blue-900 dark:text-blue-200">
                <UserCheck size={16} className="text-blue-600 dark:text-blue-400" />
                <span>Especialista asignado:</span>
              </div>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                {ticket.assigned_technician || 'Pendiente de asignación'}
              </span>
            </div>

            <hr className="border-zinc-100 dark:border-zinc-800" />

            {/* Datos de Ubicación y Contacto */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-zinc-400 font-medium">Sucursal / Local</span>
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

            {/* Aviso informativo de fotos externas */}
            <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 text-[11.5px] text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
              <MessageCircle size={15} className="text-emerald-600 shrink-0" />
              <span>
                Para enviar fotografías del equipo o recibir fotos de evidencia de reparación, utilice los botones directos de WhatsApp o Telegram arriba indicados.
              </span>
            </div>
          </div>

          {/* Comentarios y Notas Públicas */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xs space-y-4">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Comentarios y Actualizaciones
            </h3>
            <TicketNotesList
              notes={notes}
              ticketId={ticket.id}
              userRole="client"
              onAddNote={handleAddNote}
            />
          </div>
        </div>

        {/* Columna Derecha: Línea de Tiempo del Estado */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Línea de Tiempo del Servicio
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Trazabilidad oficial de cambios de estado.
              </p>
            </div>

            <TicketTimeline history={history} />
          </div>
        </div>
      </div>

      {/* Modal para Solicitar Retrabajo */}
      {showReworkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold">
              <RefreshCcw size={18} />
              <span>Solicitar Retrabajo</span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Explique el motivo por el cual la reparación requiere revisión adicional o el síntoma que persiste:
            </p>
            <form onSubmit={handleRequestRework} className="space-y-4">
              <textarea
                required
                rows={4}
                value={reworkFeedback}
                onChange={(e) => setReworkFeedback(e.target.value)}
                placeholder="Detalle qué síntoma persiste o qué punto requiere revisión..."
                className="w-full text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950 p-3 text-zinc-900 dark:text-zinc-100 outline-hidden focus:border-amber-500"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReworkModal(false)}
                  className="px-3.5 py-2 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !reworkFeedback.trim()}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? 'Enviando...' : 'Confirmar Retrabajo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

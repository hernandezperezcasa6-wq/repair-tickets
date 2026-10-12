import React from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminTicketDetail } from '@/components/tickets/AdminTicketDetail';
import { Ticket, TicketStatusHistory, TicketNote } from '@/lib/types';


export default async function AdminTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Obtener ticket con datos del cliente asociado
  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .select('*, client:profiles(*)')
    .eq('id', id)
    .single();

  if (ticketError || !ticket) {
    notFound();
  }

  // 2. Obtener historial de auditoría
  const { data: history } = await supabase
    .from('ticket_status_history')
    .select('*, changer:profiles(*)')
    .eq('ticket_id', id)
    .order('created_at', { ascending: true });

  // 3. Obtener todas las notas (públicas e internas)
  const { data: notes } = await supabase
    .from('ticket_notes')
    .select('*, author:profiles(*)')
    .eq('ticket_id', id)
    .order('created_at', { ascending: true });

  return (
    <AdminTicketDetail
      initialTicket={ticket as Ticket}
      initialHistory={(history as TicketStatusHistory[]) || []}
      initialNotes={(notes as TicketNote[]) || []}
    />
  );
}

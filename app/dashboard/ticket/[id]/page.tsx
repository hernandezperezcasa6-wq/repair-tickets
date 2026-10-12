import React from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ClientTicketDetail } from '@/components/tickets/ClientTicketDetail';
import { Ticket, TicketStatusHistory, TicketNote } from '@/lib/types';


export default async function TicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Obtener ticket (RLS asegura que solo ve si client_id = auth.uid())
  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', id)
    .single();

  if (ticketError || !ticket) {
    notFound();
  }

  // 2. Obtener historial de estados
  const { data: history } = await supabase
    .from('ticket_status_history')
    .select('*, changer:profiles(*)')
    .eq('ticket_id', id)
    .order('created_at', { ascending: true });

  // 3. Obtener notas públicas para el cliente
  const { data: notes } = await supabase
    .from('ticket_notes')
    .select('*, author:profiles(*)')
    .eq('ticket_id', id)
    .eq('is_internal', false)
    .order('created_at', { ascending: true });

  return (
    <ClientTicketDetail
      initialTicket={ticket as Ticket}
      initialHistory={(history as TicketStatusHistory[]) || []}
      initialNotes={(notes as TicketNote[]) || []}
    />
  );
}

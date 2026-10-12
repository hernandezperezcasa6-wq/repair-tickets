import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { ClientTicketList } from '@/components/tickets/ClientTicketList';
import { Ticket } from '@/lib/types';


export default async function ClientDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: tickets, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('client_id', user?.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching client tickets:', error);
  }

  return <ClientTicketList initialTickets={(tickets as Ticket[]) || []} />;
}

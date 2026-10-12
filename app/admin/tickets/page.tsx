import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { AdminTicketList } from '@/components/tickets/AdminTicketList';
import { Ticket } from '@/lib/types';


export default async function AdminTicketsPage() {
  const supabase = await createClient();

  const { data: tickets, error } = await supabase
    .from('tickets')
    .select('*, client:profiles(*)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching admin tickets:', error);
  }

  return <AdminTicketList initialTickets={(tickets as Ticket[]) || []} />;
}

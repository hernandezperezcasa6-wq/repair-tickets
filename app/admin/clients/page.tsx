import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { ClientsManager } from '@/components/admin/ClientsManager';
import { Profile } from '@/lib/types';


export default async function AdminClientsPage() {
  const supabase = await createClient();

  // Obtener perfiles de clientes y el conteo de sus tickets
  const { data: clients, error } = await supabase
    .from('profiles')
    .select('*, tickets(id)')
    .eq('role', 'client')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching clients:', error);
  }

  const formattedClients: Profile[] = (clients || []).map((c) => {
    const clientWithTickets = c as Profile & { tickets?: { id: string }[] };
    return {
      ...clientWithTickets,
      ticket_count: Array.isArray(clientWithTickets.tickets)
        ? clientWithTickets.tickets.length
        : 0,
    };
  });

  return <ClientsManager initialClients={formattedClients} />;
}

import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, role, account_status')
    .eq('id', user.id)
    .single();

  if (profile?.account_status === 'inactive') {
    redirect('/login?error=inactive');
  }

  if (profile?.role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-100/60 dark:bg-zinc-950 font-sans">
      <Navbar
        userRole="admin"
        userName={profile?.full_name || 'Administrador'}
        userEmail={user.email || ''}
      />
      <div className="flex-1 flex flex-col md:flex-row">
        <Sidebar userRole="admin" />
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

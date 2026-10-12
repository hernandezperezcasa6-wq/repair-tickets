'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Wrench, LogOut, User } from 'lucide-react';

interface NavbarProps {
  userRole?: 'admin' | 'client';
  userName?: string;
  userEmail?: string;
}

export function Navbar({ userRole = 'client', userName, userEmail }: NavbarProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 px-4 md:px-8 backdrop-blur-md">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
          <Wrench size={20} className="stroke-[2.5]" />
        </div>
        <div>
          <span className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            TecniFix
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
              Soporte
            </span>
          </span>
          <p className="text-[11px] text-zinc-500 hidden sm:block">Plataforma de Trazabilidad Técnica</p>
        </div>
      </div>

      {/* User profile & actions */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 font-semibold text-xs">
            {userName ? userName.charAt(0).toUpperCase() : <User size={14} />}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
              {userName || 'Usuario'}
            </div>
            <div className="text-[11px] text-zinc-500 leading-tight">
              {userEmail}
            </div>
          </div>
          <span
            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ml-1 ${
              userRole === 'admin'
                ? 'bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800'
                : 'bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
            }`}
          >
            {userRole === 'admin' ? 'Admin' : 'Cliente'}
          </span>
        </div>

        <button
          onClick={handleSignOut}
          title="Cerrar sesión"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Inbox,
  PlusCircle,
  ClipboardList,
  Users,
  FileSpreadsheet,
  MessageCircle,
} from 'lucide-react';

interface SidebarProps {
  userRole: 'admin' | 'client';
}

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();

  const clientLinks = [
    {
      href: '/dashboard',
      label: 'Mis Tickets',
      icon: Inbox,
      exact: true,
    },
    {
      href: '/dashboard/new',
      label: 'Nueva Solicitud',
      icon: PlusCircle,
      exact: true,
    },
  ];

  const adminLinks = [
    {
      href: '/admin/tickets',
      label: 'Todos los Tickets',
      icon: ClipboardList,
      exact: false,
    },
    {
      href: '/admin/clients',
      label: 'Clientes',
      icon: Users,
      exact: true,
    },
    {
      href: '/admin/export',
      label: 'Exportar Datos',
      icon: FileSpreadsheet,
      exact: true,
    },
  ];

  const links = userRole === 'admin' ? adminLinks : clientLinks;

  return (
    <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950 p-4 flex flex-col justify-between shrink-0">
      <div className="space-y-6">
        <div>
          <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            {userRole === 'admin' ? 'Panel de Administración' : 'Panel de Cliente'}
          </div>
          <nav className="space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = link.exact
                ? pathname === link.href
                : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30 dark:bg-blue-600 dark:text-white'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  <Icon size={18} className="shrink-0" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Banner informativo de arquitectura zero-image */}
        <div className="rounded-xl border border-blue-200/60 bg-blue-50/70 dark:border-blue-900/40 dark:bg-blue-950/30 p-3.5 text-xs">
          <div className="flex items-center gap-2 font-semibold text-blue-900 dark:text-blue-200 mb-1">
            <MessageCircle size={15} className="text-blue-600 dark:text-blue-400 shrink-0" />
            <span>Evidencias y Fotos</span>
          </div>
          <p className="text-zinc-600 dark:text-zinc-300 text-[11.5px] leading-relaxed">
            Las fotografías del equipo y visitas se gestionan por <strong>WhatsApp</strong> o <strong>Telegram</strong>. La plataforma registra la trazabilidad formal de estados.
          </p>
        </div>
      </div>

      <div className="pt-4 border-t border-zinc-200/80 dark:border-zinc-800 text-[11px] text-zinc-400 text-center">
        TecniFix Support v1.0 &bull; Cloud Free Plan
      </div>
    </aside>
  );
}

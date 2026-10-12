'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/lib/types';
import { formatDate } from '@/lib/utils/formatters';
import { Modal } from '@/components/ui/Modal';
import { ChannelBadge } from '@/components/ui/ChannelBadge';
import {
  Users,
  UserPlus,
  Search,
  CheckCircle2,
  Trash2,
  Power,
  Mail,
  Phone,
  Lock,
  User,
  AlertTriangle,
} from 'lucide-react';

interface ClientsManagerProps {
  initialClients: Profile[];
}

export function ClientsManager({ initialClients }: ClientsManagerProps) {
  const router = useRouter();
  const supabase = createClient();

  const [clients, setClients] = useState<Profile[]>(initialClients);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal de Nuevo Cliente
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [preferredChannel, setPreferredChannel] = useState<'WhatsApp' | 'Telegram' | 'Ambos'>('WhatsApp');
  const [creating, setCreating] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Filtrado de clientes (excluye borrados lógicos y aplica búsqueda)
  const filteredClients = clients.filter((c) => {
    if (c.deleted_at) return false;
    if (!searchTerm) return true;
    const query = searchTerm.toLowerCase();
    return (
      c.full_name?.toLowerCase().includes(query) ||
      c.email?.toLowerCase().includes(query) ||
      c.contact_phone?.toLowerCase().includes(query)
    );
  });

  // Habilitar / Deshabilitar cuenta
  const handleToggleStatus = async (client: Profile) => {
    const newStatus = client.account_status === 'active' ? 'inactive' : 'active';
    const actionText = newStatus === 'active' ? 'activar' : 'desactivar';

    if (!confirm(`¿Está seguro de que desea ${actionText} la cuenta de ${client.full_name}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ account_status: newStatus })
        .eq('id', client.id);

      if (error) throw error;

      setClients((prev) =>
        prev.map((c) => (c.id === client.id ? { ...c, account_status: newStatus } : c))
      );
      setSuccessBanner(`Cuenta de ${client.full_name} ${newStatus === 'active' ? 'activada' : 'desactivada'}.`);
      router.refresh();
    } catch (err: unknown) {
      alert((err as Error)?.message || 'Error al actualizar el estado de la cuenta.');
    }
  };

  // Borrado lógico del cliente
  const handleDeleteClient = async (client: Profile) => {
    if (
      !confirm(
        `¿Desea eliminar la cuenta de ${client.full_name}? El historial de tickets se conservará intacto pero el cliente no podrá acceder.`
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          deleted_at: new Date().toISOString(),
          account_status: 'inactive',
        })
        .eq('id', client.id);

      if (error) throw error;

      setClients((prev) => prev.filter((c) => c.id !== client.id));
      setSuccessBanner(`Cliente ${client.full_name} eliminado.`);
      router.refresh();
    } catch (err: unknown) {
      alert((err as Error)?.message || 'Error al eliminar cliente.');
    }
  };

  // Crear nuevo cliente
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setModalError(null);

    try {
      const res = await fetch('/api/admin/create-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          password,
          preferredPhotoChannel: preferredChannel,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al crear cliente.');
      }

      setSuccessBanner(`¡Cliente ${fullName} registrado exitosamente!`);
      setIsModalOpen(false);
      setFullName('');
      setEmail('');
      setPhone('');
      setPassword('');

      // Recargar datos
      router.refresh();
    } catch (err: unknown) {
      setModalError((err as Error)?.message || 'Error al crear el cliente.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <Users size={26} className="text-blue-600" />
            Gestión de Clientes y Cuentas
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Administre accesos, estados de cuenta y canales de contacto para sucursales.
          </p>
        </div>

        <button
          onClick={() => {
            setModalError(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-sm transition-all shadow-md shadow-blue-500/20 cursor-pointer"
        >
          <UserPlus size={18} />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      {successBanner && (
        <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button
            onClick={() => setSuccessBanner(null)}
            className="text-xs text-emerald-600 hover:underline cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Buscador y Métricas */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, correo o teléfono..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/60 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-blue-500 outline-hidden"
          />
        </div>

        <div className="text-xs text-zinc-500 font-medium">
          Total Clientes Activos: <span className="font-bold text-zinc-900 dark:text-zinc-100">{filteredClients.length}</span>
        </div>
      </div>

      {/* Tabla de Clientes */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <th className="py-3.5 px-4">Cliente / Sucursal</th>
                <th className="py-3.5 px-4">Correo</th>
                <th className="py-3.5 px-4">Teléfono / Fotos</th>
                <th className="py-3.5 px-4">Registro</th>
                <th className="py-3.5 px-4 text-center">Nº Tickets</th>
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {filteredClients.map((client) => {
                const isActive = client.account_status === 'active';

                return (
                  <tr
                    key={client.id}
                    className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    {/* Nombre */}
                    <td className="py-3.5 px-4 font-semibold text-zinc-900 dark:text-zinc-100">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-xs font-bold">
                          {client.full_name?.charAt(0).toUpperCase()}
                        </div>
                        <span>{client.full_name}</span>
                      </div>
                    </td>

                    {/* Correo */}
                    <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400 text-xs font-mono">
                      {client.email || '—'}
                    </td>

                    {/* Teléfono */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-mono text-xs text-zinc-700 dark:text-zinc-300 mb-1">
                        {client.contact_phone || 'Sin registrar'}
                      </div>
                      {client.contact_phone && (
                        <ChannelBadge
                          channel={client.preferred_photo_channel}
                          phone={client.contact_phone}
                        />
                      )}
                    </td>

                    {/* Fecha de Registro */}
                    <td className="py-3.5 px-4 text-zinc-500 text-xs whitespace-nowrap">
                      {formatDate(client.created_at)}
                    </td>

                    {/* Nº Tickets */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center justify-center h-6 min-w-6 px-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        {client.ticket_count ?? 0}
                      </span>
                    </td>

                    {/* Estado de Cuenta */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                            : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isActive ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                        <span>{isActive ? 'Activa' : 'Inactiva'}</span>
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1">
                      <button
                        onClick={() => handleToggleStatus(client)}
                        title={isActive ? 'Deshabilitar cuenta' : 'Habilitar cuenta'}
                        className={`p-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                          isActive
                            ? 'border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-900/50 dark:hover:bg-amber-950/30'
                            : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900/50 dark:hover:bg-emerald-950/30'
                        }`}
                      >
                        <Power size={14} />
                      </button>

                      <button
                        onClick={() => handleDeleteClient(client)}
                        title="Eliminar cliente (borrado lógico)"
                        className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Nuevo Cliente */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Crear Nueva Cuenta de Cliente"
        description="El cliente podrá ingresar con su correo y contraseña para crear tickets de su sucursal."
      >
        {modalError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-xs flex items-start gap-2">
            <AlertTriangle size={15} className="shrink-0 mt-0.5" />
            <span>{modalError}</span>
          </div>
        )}

        <form onSubmit={handleCreateClient} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Nombre Completo o Razón Social <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej. Roberto Gómez / Sucursal Centro"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:border-blue-500 outline-hidden"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Correo Electrónico de Acceso <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cliente@sucursal.com"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:border-blue-500 outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Teléfono de Contacto
              </label>
              <div className="relative">
                <Phone
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+52 55 1234 5678"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:border-blue-500 outline-hidden"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Canal Preferido para Fotos
              </label>
              <select
                value={preferredChannel}
                onChange={(e) =>
                  setPreferredChannel(e.target.value as 'WhatsApp' | 'Telegram' | 'Ambos')
                }
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:border-blue-500 outline-hidden"
              >
                <option value="WhatsApp">WhatsApp</option>
                <option value="Telegram">Telegram</option>
                <option value="Ambos">Ambos</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Contraseña Inicial <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:border-blue-500 outline-hidden"
              />
            </div>
            <p className="text-[11px] text-zinc-500">
              El cliente podrá cambiarla más adelante o usar el enlace de restablecimiento.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-50 cursor-pointer shadow-xs transition-colors"
            >
              <UserPlus size={14} />
              <span>{creating ? 'Creando cuenta...' : 'Crear Cuenta'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Wrench,
  MapPin,
  User,
  Phone,
  AlertTriangle,
  MessageCircle,
  ArrowLeft,
  Send,
  HelpCircle,
  Building2,
} from 'lucide-react';
import Link from 'next/link';

export default function NewTicketPage() {
  const router = useRouter();
  const supabase = createClient();

  // Estados del formulario
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [equipmentType, setEquipmentType] = useState('Aire acondicionado');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState<'Normal' | 'Urgente'>('Normal');
  const [photoAvailable, setPhotoAvailable] = useState<boolean>(true);
  const [preferredPhotoChannel, setPreferredPhotoChannel] = useState<'WhatsApp' | 'Telegram' | 'Ambos'>('WhatsApp');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Cargar datos por defecto del perfil del usuario
  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, contact_phone, preferred_photo_channel')
          .eq('id', user.id)
          .single();

        if (profile) {
          if (profile.full_name) setContactName(profile.full_name);
          if (profile.contact_phone) setContactPhone(profile.contact_phone);
          if (profile.preferred_photo_channel)
            setPreferredPhotoChannel(profile.preferred_photo_channel);
        }
      }
    }
    loadProfile();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Debe iniciar sesión para registrar una solicitud.');
      }

      const { data, error } = await supabase
        .from('tickets')
        .insert({
          client_id: user.id,
          location: location.trim(),
          address: address.trim(),
          contact_name: contactName.trim(),
          contact_phone: contactPhone.trim(),
          equipment_type: equipmentType,
          description: description.trim(),
          urgency,
          status: 'Pendiente',
          photo_available: photoAvailable,
          preferred_photo_channel: preferredPhotoChannel,
        })
        .select()
        .single();

      if (error) throw error;

      // Redirigir al detalle del ticket recién creado o al dashboard
      if (data?.id) {
        router.push(`/dashboard/ticket/${data.id}`);
      } else {
        router.push('/dashboard');
      }
      router.refresh();
    } catch (err: unknown) {
      console.error('Error creating ticket:', err);
      setErrorMsg((err as Error)?.message || 'Error al guardar la solicitud. Intente nuevamente.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Botón Volver y Título */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Nueva Solicitud de Reparación
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Complete los datos técnicos para asignación y visita de un especialista.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-sm flex items-start gap-2">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Formulario */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6"
      >
        {/* Sección: Ubicación y Contacto */}
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-4 flex items-center gap-2">
            <Building2 size={16} />
            1. Ubicación y Contacto en Sitio
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nombre del local / sucursal */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Nombre del local / sucursal <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ej. Sucursal Centro, Planta Norte, Bodega 3"
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:border-blue-500 outline-hidden"
              />
            </div>

            {/* Dirección completa */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Dirección completa de la reparación <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <MapPin
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                />
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Calle, número, colonia, piso o referencia física"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:border-blue-500 outline-hidden"
                />
              </div>
            </div>

            {/* Nombre del contacto */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Persona de contacto en sitio <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                />
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Nombre de quien recibe al técnico"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:border-blue-500 outline-hidden"
                />
              </div>
            </div>

            {/* Teléfono de contacto */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Teléfono de contacto (WhatsApp/Telegram) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                />
                <input
                  type="tel"
                  required
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="Ej. +52 55 1234 5678"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:border-blue-500 outline-hidden"
                />
              </div>
              <p className="text-[11px] text-zinc-500">
                Clave: por este número el técnico solicitará fotos o videos de la falla.
              </p>
            </div>
          </div>
        </div>

        <hr className="border-zinc-100 dark:border-zinc-800" />

        {/* Sección: Detalles Técnicos de la Falla */}
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-4 flex items-center gap-2">
            <Wrench size={16} />
            2. Detalles Técnicos del Requerimiento
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tipo de equipo */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Tipo de equipo o especialidad <span className="text-rose-500">*</span>
                </label>
                <select
                  value={equipmentType}
                  onChange={(e) => setEquipmentType(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:border-blue-500 outline-hidden"
                >
                  <option value="Aire acondicionado">Aire acondicionado</option>
                  <option value="Electricidad">Electricidad</option>
                  <option value="Fontanería">Fontanería</option>
                  <option value="Otro">Otro equipo / Instalación</option>
                </select>
              </div>

              {/* Urgencia */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Nivel de urgencia <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-3 pt-1">
                  <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="urgency"
                      value="Normal"
                      checked={urgency === 'Normal'}
                      onChange={() => setUrgency('Normal')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-zinc-700 dark:text-zinc-300">Normal</span>
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="urgency"
                      value="Urgente"
                      checked={urgency === 'Urgente'}
                      onChange={() => setUrgency('Urgente')}
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    <span className="text-rose-600 dark:text-rose-400 font-medium">
                      Urgente (Paro de operación)
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Descripción del problema */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Descripción detallada del problema <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describa marca, modelo, síntomas específicos, si genera ruidos, fugas, códigos de error en pantalla o tiempo que lleva presentando la falla..."
                className="w-full p-3 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-blue-500 outline-hidden"
              />
              {/* Texto de ayuda obligatorio según requerimiento */}
              <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50/60 dark:bg-blue-950/30 text-blue-900 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/50 text-xs">
                <HelpCircle size={15} className="text-blue-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Describa con el mayor detalle posible: qué equipo falla, qué síntoma presenta, desde cuándo ocurre y qué impacto tiene en la operación. El técnico le pedirá fotografías por WhatsApp o Telegram al teléfono indicado.
                </p>
              </div>
            </div>
          </div>
        </div>

        <hr className="border-zinc-100 dark:border-zinc-800" />

        {/* Sección: Coordinación Fotográfica Externa */}
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-4 flex items-center gap-2">
            <MessageCircle size={16} />
            3. Evidencia Visual Externa (WhatsApp / Telegram)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Disponibilidad de fotos */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                ¿Disponible para enviar fotos por WhatsApp/Telegram?
              </label>
              <div className="flex items-center gap-4 pt-1">
                <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="photoAvailable"
                    checked={photoAvailable === true}
                    onChange={() => setPhotoAvailable(true)}
                    className="text-blue-600"
                  />
                  <span>Sí, cuento con fotos/videos</span>
                </label>
                <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="photoAvailable"
                    checked={photoAvailable === false}
                    onChange={() => setPhotoAvailable(false)}
                    className="text-blue-600"
                  />
                  <span>No por el momento</span>
                </label>
              </div>
            </div>

            {/* Canal preferido */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Canal preferido para fotos
              </label>
              <select
                value={preferredPhotoChannel}
                onChange={(e) =>
                  setPreferredPhotoChannel(e.target.value as 'WhatsApp' | 'Telegram' | 'Ambos')
                }
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:border-blue-500 outline-hidden"
              >
                <option value="WhatsApp">WhatsApp</option>
                <option value="Telegram">Telegram</option>
                <option value="Ambos">Ambos canales</option>
              </select>
            </div>
          </div>
        </div>

        {/* Botón Guardar */}
        <div className="pt-4 flex items-center justify-end gap-3">
          <Link
            href="/dashboard"
            className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold shadow-md shadow-blue-500/20 disabled:opacity-60 cursor-pointer transition-all"
          >
            <Send size={16} />
            <span>{loading ? 'Registrando Ticket...' : 'Crear Requerimiento'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

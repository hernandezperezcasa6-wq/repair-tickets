'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Wrench, Lock, Mail, ArrowRight, AlertCircle, CheckCircle2, Shield } from 'lucide-react';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(() =>
    searchParams.get('error') === 'inactive'
      ? 'Su cuenta ha sido desactivada por el administrador. Contacte a soporte.'
      : null
  );
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isResetMode, setIsResetMode] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        throw new Error(
          error.message === 'Invalid login credentials'
            ? 'Credenciales incorrectas. Verifique su correo y contraseña.'
            : error.message
        );
      }

      if (data?.user) {
        // Consultar el rol del usuario en la tabla profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, account_status')
          .eq('id', data.user.id)
          .single();

        if (profile?.account_status === 'inactive') {
          await supabase.auth.signOut();
          setErrorMsg('Su cuenta está desactivada.');
          setLoading(false);
          return;
        }

        const role = profile?.role || 'client';
        if (role === 'admin') {
          router.push('/admin/tickets');
        } else {
          router.push('/dashboard');
        }
        router.refresh();
      }
    } catch (err: unknown) {
      setErrorMsg((err as Error)?.message || 'Error al iniciar sesión.');
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Por favor ingrese su correo electrónico.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setSuccessMsg('Se ha enviado un enlace de restablecimiento a su correo electrónico.');
      setIsResetMode(false);
    } catch (err: unknown) {
      setErrorMsg((err as Error)?.message || 'No se pudo enviar el correo de restablecimiento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-xl space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/30">
          <Wrench size={28} className="stroke-[2.5]" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          TecniFix Reparaciones
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {isResetMode
            ? 'Recuperación de contraseña de acceso'
            : 'Portal de tickets técnicos y trazabilidad de servicio'}
        </p>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-xs">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 text-xs">
          <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Forms */}
      {!isResetMode ? (
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Correo Electrónico
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
                placeholder="cliente@empresa.com"
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Contraseña
              </label>
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setIsResetMode(true);
                }}
                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline cursor-pointer"
              >
                ¿Olvidó su contraseña?
              </button>
            </div>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-500/20 cursor-pointer"
          >
            <span>{loading ? 'Verificando...' : 'Iniciar Sesión'}</span>
            <ArrowRight size={16} />
          </button>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Correo Electrónico Registrado
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
                placeholder="cliente@empresa.com"
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-blue-500 outline-hidden"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsResetMode(false)}
              className="w-1/2 py-2.5 px-3 rounded-lg text-xs font-semibold text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 cursor-pointer transition-colors"
            >
              Volver al Login
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-1/2 py-2.5 px-3 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 cursor-pointer transition-colors"
            >
              {loading ? 'Enviando...' : 'Enviar Enlace'}
            </button>
          </div>
        </form>
      )}

      {/* Footer Info */}
      <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 text-center space-y-2">
        <p className="text-[11px] text-zinc-500">
          ¿No tienes una cuenta aún? Contacta al administrador para que registre tu sucursal.
        </p>
        <div className="inline-flex items-center gap-1.5 text-[11px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 px-2.5 py-1 rounded-full">
          <Shield size={12} className="text-zinc-400" />
          <span>Acceso seguro cifrado con Supabase Auth</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950 font-sans">
      <Suspense fallback={<div className="text-zinc-500">Cargando plataforma...</div>}>
        <LoginFormContent />
      </Suspense>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Lock, CheckCircle2, AlertCircle, Wrench } from 'lucide-react';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2500);
    } catch (err: unknown) {
      setErrorMsg((err as Error)?.message || 'Error al actualizar contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950 font-sans">
      <div className="w-full max-w-md p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
            <Wrench size={24} />
          </div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            Establecer Nueva Contraseña
          </h1>
          <p className="text-xs text-zinc-500">
            Ingrese su nueva contraseña de acceso a la plataforma.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {success ? (
          <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 text-sm text-center space-y-2">
            <CheckCircle2 size={24} className="mx-auto text-emerald-600" />
            <p className="font-semibold">¡Contraseña actualizada con éxito!</p>
            <p className="text-xs text-emerald-700">Redirigiendo a la pantalla de inicio de sesión...</p>
          </div>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Nueva Contraseña
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
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 outline-hidden focus:border-blue-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Confirmar Contraseña
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
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita la contraseña"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 outline-hidden focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Actualizando...' : 'Guardar Nueva Contraseña'}
            </button>

            <div className="text-center pt-2">
              <Link
                href="/login"
                className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              >
                Cancelar y volver al login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

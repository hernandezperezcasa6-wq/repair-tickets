'use client';

import React, { useState } from 'react';
import { TicketNote } from '@/lib/types';
import { formatDate } from '@/lib/utils/formatters';
import { MessageSquare, Lock, Globe, Send, User } from 'lucide-react';

interface TicketNotesListProps {
  notes: TicketNote[];
  ticketId?: string;
  userRole: 'admin' | 'client';
  onAddNote: (content: string, isInternal: boolean) => Promise<boolean>;
}

export function TicketNotesList({
  notes,
  userRole,
  onAddNote,
}: TicketNotesListProps) {
  const [content, setContent] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const success = await onAddNote(content.trim(), userRole === 'admin' ? isInternal : false);
      if (success) {
        setContent('');
        setIsInternal(false);
      } else {
        setError('No se pudo guardar la nota.');
      }
    } catch (err: unknown) {
      setError((err as Error)?.message || 'Error inesperado al guardar');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Lista de notas */}
      <div className="space-y-3">
        {notes.length === 0 ? (
          <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-center text-xs text-zinc-500 border border-zinc-200/60 dark:border-zinc-800">
            No hay comentarios o notas registradas aún.
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className={`rounded-lg p-3.5 border transition-all ${
                note.is_internal
                  ? 'bg-amber-50/60 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/40'
                  : 'bg-white border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                    <User size={12} />
                  </div>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {note.author?.full_name || 'Usuario'}
                  </span>
                  <span className="text-zinc-400">&bull;</span>
                  <span className="text-zinc-400">{formatDate(note.created_at)}</span>
                </div>

                {note.is_internal ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
                    <Lock size={10} />
                    Nota Interna (Admin)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                    <Globe size={10} />
                    Visible para Cliente
                  </span>
                )}
              </div>

              <p className="text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed">
                {note.content}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Formulario para añadir nueva nota */}
      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3.5 shadow-2xs space-y-3"
      >
        <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          <span className="flex items-center gap-1.5">
            <MessageSquare size={14} className="text-blue-600" />
            {userRole === 'admin' ? 'Añadir nota o seguimiento' : 'Añadir comentario'}
          </span>

          {userRole === 'admin' && (
            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-normal text-amber-700 dark:text-amber-400">
              <input
                type="checkbox"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                className="rounded border-zinc-300 text-amber-600 focus:ring-amber-500 h-3.5 w-3.5"
              />
              <span className="flex items-center gap-1">
                <Lock size={11} />
                Nota solo interna (oculta para cliente)
              </span>
            </label>
          )}
        </div>

        <textarea
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={
            userRole === 'admin'
              ? isInternal
                ? 'Escriba una nota técnica interna, registro de visita o diagnóstico confidencial...'
                : 'Escriba una actualización o indicación visible para el cliente...'
              : 'Escriba un comentario o consulta sobre el avance de su ticket...'
          }
          className="w-full text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950 p-2.5 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden transition-all"
        />

        {error && <p className="text-xs text-rose-600">{error}</p>}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting || !content.trim()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs"
          >
            <Send size={12} />
            {submitting ? 'Enviando...' : 'Publicar Nota'}
          </button>
        </div>
      </form>
    </div>
  );
}

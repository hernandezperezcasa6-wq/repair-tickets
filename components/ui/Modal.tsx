'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, description, children }: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 z-10 animate-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
            {description && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

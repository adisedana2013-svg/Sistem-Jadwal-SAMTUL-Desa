import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  subMessage?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full px-4 pointer-events-none no-print">
      {toasts.map((toast) => {
        const bgStyles = {
          success: 'bg-emerald-900/95 text-emerald-50 border-emerald-700',
          error: 'bg-rose-900/95 text-rose-50 border-rose-700',
          warning: 'bg-amber-900/95 text-amber-50 border-amber-700',
          info: 'bg-slate-900/95 text-slate-50 border-slate-700'
        }[toast.type];

        const IconComponent = {
          success: CheckCircle2,
          error: XCircle,
          warning: AlertTriangle,
          info: Info
        }[toast.type];

        const iconColor = {
          success: 'text-emerald-400',
          error: 'text-rose-400',
          warning: 'text-amber-400',
          info: 'text-sky-400'
        }[toast.type];

        return (
          <div
            key={toast.id}
            id={`toast-${toast.id}`}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-2xl backdrop-blur-sm transition-all duration-300 transform translate-y-0 ${bgStyles}`}
          >
            <IconComponent className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-snug">{toast.message}</p>
              {toast.subMessage && (
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">{toast.subMessage}</p>
              )}
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-slate-400 hover:text-white p-1 -mr-1 -mt-1 rounded-md transition-colors"
              aria-label="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

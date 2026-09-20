import React from 'react';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

/**
 * Shared confirmation modal used across all staff dashboards.
 *
 * Props:
 *   isOpen        {boolean}
 *   title         {string}
 *   message       {string}
 *   confirmText   {string}  default "Confirm"
 *   cancelText    {string}  default "Cancel"
 *   variant       {'default'|'warning'|'danger'}
 *   onConfirm     {function}
 *   onCancel      {function}
 *   loading       {boolean}  optional — disables confirm while in-flight
 */
export default function ConfirmModal({
  isOpen,
  title         = 'Are you sure?',
  message       = '',
  confirmText   = 'Confirm',
  cancelText    = 'Cancel',
  variant       = 'default',
  onConfirm,
  onCancel,
  loading       = false,
}) {
  if (!isOpen) return null;

  const config = {
    default: {
      icon:       <Info className="w-5 h-5 text-blue-600" />,
      iconBg:     'bg-blue-50 border border-blue-200',
      confirmCls: 'bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-500',
    },
    warning: {
      icon:       <AlertTriangle className="w-5 h-5 text-amber-600" />,
      iconBg:     'bg-amber-50 border border-amber-200',
      confirmCls: 'bg-amber-600 hover:bg-amber-700 focus-visible:ring-amber-500',
    },
    danger: {
      icon:       <AlertCircle className="w-5 h-5 text-red-600" />,
      iconBg:     'bg-red-50 border border-red-200',
      confirmCls: 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-500',
    },
  }[variant] ?? {};

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget && !loading) onCancel?.(); }}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
      >
        {/* Close button */}
        {!loading && (
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Icon + Title */}
        <div className="flex items-center gap-3">
          <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${config.iconBg}`}>
            {config.icon}
          </div>
          <h2 id="confirm-title" className="text-sm font-bold text-slate-900 leading-tight">
            {title}
          </h2>
        </div>

        {/* Message */}
        {message && (
          <p className="text-xs text-slate-500 leading-relaxed pl-12 -mt-1">
            {message}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1 pl-12">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-2 text-xs font-semibold rounded-lg text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-50 ${config.confirmCls}`}
          >
            {loading ? 'Please wait…' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

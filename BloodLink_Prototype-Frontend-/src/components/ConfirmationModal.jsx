import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmationModal({
  isOpen,
  title = "Are you sure?",
  message = "This action can't be undone. Please confirm if you want to proceed.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger", // 'danger' | 'success' | 'warning' | 'info'
  onConfirm,
  onCancel
}) {
  if (!isOpen) return null;

  const colorStyles = {
    danger: {
      outerBorder: 'border-red-200',
      innerBg: 'bg-[#E11D48]',
      confirmBg: 'bg-[#E11D48] hover:bg-red-700 text-white'
    },
    warning: {
      outerBorder: 'border-amber-200',
      innerBg: 'bg-amber-500',
      confirmBg: 'bg-amber-500 hover:bg-amber-600 text-white'
    },
    success: {
      outerBorder: 'border-emerald-200',
      innerBg: 'bg-emerald-600',
      confirmBg: 'bg-emerald-600 hover:bg-emerald-700 text-white'
    },
    info: {
      outerBorder: 'border-blue-200',
      innerBg: 'bg-blue-600',
      confirmBg: 'bg-blue-600 hover:bg-blue-700 text-white'
    }
  };

  const style = colorStyles[variant] || colorStyles.danger;
  const showCancel = cancelText && cancelText.trim() !== '';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm modal-in">
      <div className="bg-white rounded-3xl w-full max-w-sm p-7 text-center relative shadow-2xl border border-slate-100">
        {/* Close X button — only shown when cancel is available */}
        {showCancel && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition cursor-pointer p-1 rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Outer & Inner Concentric Icon Badge */}
        <div className="flex justify-center mb-1 mt-1">
          <div className={`p-1.5 border ${style.outerBorder} rounded-full inline-flex items-center justify-center`}>
            <div className={`w-14 h-14 ${style.innerBg} rounded-full flex items-center justify-center text-white shadow-sm`}>
              <AlertTriangle className="w-7 h-7 stroke-[2.5]" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-[#0F172A] font-extrabold text-2xl tracking-tight mt-4 mb-2">
          {title}
        </h3>

        {/* Message */}
        <p className="text-slate-500 text-sm font-medium leading-relaxed mb-7 px-1">
          {message}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {showCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-300 bg-white text-slate-800 font-bold text-sm hover:bg-slate-50 transition cursor-pointer"
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 py-3 px-4 rounded-xl ${style.confirmBg} font-bold text-sm transition cursor-pointer shadow-sm`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

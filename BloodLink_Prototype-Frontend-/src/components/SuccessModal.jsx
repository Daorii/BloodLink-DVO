import React from 'react';
import { Check, X } from 'lucide-react';

export default function SuccessModal({
  isOpen,
  title = "Successfully Completed!",
  message = "The operation has been processed successfully.",
  confirmText = "Confirm",
  details = null,
  customFooter = null,
  onClose
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm modal-in">
      <div className="bg-white rounded-3xl w-full max-w-sm p-7 text-center relative shadow-2xl border border-slate-100">
        {/* Close X button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition cursor-pointer p-1 rounded-full hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Concentric Green Circle Badge */}
        <div className="flex justify-center mb-1 mt-1">
          <div className="p-1.5 border border-emerald-200 rounded-full inline-flex items-center justify-center">
            <div className="w-14 h-14 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-sm">
              <Check className="w-7 h-7 stroke-[3]" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-[#0F172A] font-extrabold text-2xl tracking-tight mt-4 mb-2">
          {title}
        </h3>

        {/* Message */}
        <p className="text-slate-500 text-sm font-medium leading-relaxed mb-5 px-1">
          {message}
        </p>

        {/* Optional Structured Metadata Details Card */}
        {details && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-6 text-left text-xs font-medium text-slate-700 space-y-1.5">
            {Array.isArray(details) ? (
              details.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center py-0.5">
                  <span className="text-slate-400 text-[11px] font-semibold">{item.label}</span>
                  <span className="font-bold text-slate-900 font-mono">{item.value}</span>
                </div>
              ))
            ) : (
              details
            )}
          </div>
        )}

        {/* Footer/Action Buttons */}
        <div className="mt-6">
          {customFooter ? (
            customFooter
          ) : (
            onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 px-4 rounded-xl bg-[#E11D48] hover:bg-red-700 text-white font-bold text-sm transition cursor-pointer shadow-sm"
              >
                {confirmText}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

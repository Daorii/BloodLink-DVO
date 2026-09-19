import { useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * The standard table footer used throughout BloodLink. It intentionally
 * mirrors the Registry Donation Records pager so every portal behaves alike.
 */
export default function TablePagination({ total, page, pageSize = 10, onPageChange, label = 'entries', className = '' }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);

  // A search or filter can reduce the result set while the user is on a later
  // page. Move back to the final valid page instead of showing an empty table.
  useEffect(() => {
    if (page > totalPages) onPageChange(totalPages);
  }, [page, totalPages, onPageChange]);

  if (total <= pageSize) return null;

  return (
    <div className={`bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-500 ${className}`}>
      <span>Showing {start} to {end} of {total} {label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          aria-label="Previous page"
          className="p-1 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-slate-700 font-bold">Page {page} of {totalPages}</span>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          aria-label="Next page"
          className="p-1 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

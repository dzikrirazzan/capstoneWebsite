export default function TablePagination({ pagination, onPageChange }) {
  if (!pagination) return null;
  const { page, totalPages, total, limit } = pagination;

  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-4 text-sm text-[var(--text-muted)] md:flex-row md:items-center md:justify-between">
      <div>
        Halaman {page} dari {totalPages}
        <span className="ml-1 text-[var(--text-secondary)]">
          • Total {total} data (limit {limit})
        </span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!canPrev}
          className="rounded-lg border border-[var(--border-color)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition enabled:hover:border-[var(--accent)]/60 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Sebelumnya
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!canNext}
          className="rounded-lg border border-[var(--border-color)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition enabled:hover:border-[var(--accent)]/60 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Selanjutnya
        </button>
      </div>
    </div>
  );
}

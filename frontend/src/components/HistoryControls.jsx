import { Download, Filter, RefreshCw, Trash2 } from "lucide-react";

const LIMIT_OPTIONS = [20, 50, 100, 200];

export default function HistoryControls({ filters, onChange, onApply, onResetFilters, onRefresh, onExport, onResetData, isLoading, isExporting, isResetting }) {
  const handleDateChange = (field) => (event) => {
    onChange({ [field]: event.target.value });
  };

  const handleLimitChange = (event) => {
    onChange({ limit: Number(event.target.value) });
  };

  return (
    <section className="card-container p-6 space-y-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Manajemen Data</h2>
          <p className="text-sm text-[var(--text-muted)]">Kontrol penyaringan, ekspor, dan pembersihan data sensor secara terpusat.</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition enabled:hover:border-[var(--accent)]/60 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={onExport}
            disabled={isExporting || isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-transparent bg-[var(--accent-soft)] px-4 py-2 text-sm font-medium text-[var(--accent)] transition enabled:hover:bg-[var(--accent)] enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            {isExporting ? "Mengekspor..." : "Ekspor Excel"}
          </button>
          <button
            onClick={onResetData}
            disabled={isResetting}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-transparent bg-[rgba(239,68,68,0.12)] px-4 py-2 text-sm font-medium text-[#f87171] transition enabled:hover:bg-[#ef4444] enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" />
            {isResetting ? "Menghapus..." : "Hapus Data"}
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[var(--text-muted)]">Mulai</label>
          <input
            type="datetime-local"
            value={filters.start}
            onChange={handleDateChange("start")}
            className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-secondary)] outline-none focus:border-[var(--accent)] focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[var(--text-muted)]">Selesai</label>
          <input
            type="datetime-local"
            value={filters.end}
            onChange={handleDateChange("end")}
            className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-secondary)] outline-none focus:border-[var(--accent)] focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[var(--text-muted)]">Jumlah per halaman</label>
          <select value={filters.limit} onChange={handleLimitChange} className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-secondary)] outline-none focus:border-[var(--accent)]">
            {LIMIT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option} data
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <button onClick={onApply} disabled={isLoading} className="flex-1 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
            <span className="inline-flex items-center justify-center gap-2">
              <Filter className="h-4 w-4" />
              Terapkan Filter
            </span>
          </button>
          <button
            onClick={onResetFilters}
            disabled={isLoading}
            className="rounded-lg border border-[var(--border-color)] px-4 py-2 text-sm font-medium text-[var(--text-muted)] transition hover:border-[var(--accent)]/60 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Reset
          </button>
        </div>
      </div>
    </section>
  );
}

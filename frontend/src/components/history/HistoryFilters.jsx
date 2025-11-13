import { useState } from "react";
import { Download, RefreshCw, Filter, Trash2, X } from "lucide-react";

const LIMIT_OPTIONS = [20, 50, 100, 200];

export default function HistoryFilters({ filters, onChange, onApply, onResetFilters, onRefresh, onExport, onResetData, isLoading, isExporting, isResetting }) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [modalRange, setModalRange] = useState({ start: "", end: "" });

  const handleDateChange = (field) => (event) => {
    onChange({ [field]: event.target.value });
  };

  const handleLimitChange = (event) => {
    onChange({ limit: Number(event.target.value) });
  };

  const openDeleteModal = () => {
    if (isResetting) return;
    setModalRange({ start: filters.start ?? "", end: filters.end ?? "" });
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    if (isResetting) return;
    setShowDeleteModal(false);
  };

  const submitDeleteByRange = () => {
    onResetData({ mode: "range", range: modalRange });
    setShowDeleteModal(false);
  };

  const submitDeleteAll = () => {
    onResetData({ mode: "all" });
    setShowDeleteModal(false);
  };

  return (
    <div className="card-container space-y-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Riwayat Data</h1>
          <p className="text-sm text-[var(--text-muted)]">Atur rentang waktu, jumlah entri, dan kelola data sensor di sini.</p>
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
                    <button onClick={onExport} disabled={isExporting} className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
            <Download className="h-4 w-4" />
            {isExporting ? "Mengekspor..." : "Ekspor Excel"}
          </button>
          <button
            onClick={openDeleteModal}
            disabled={isResetting}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-transparent bg-[rgba(239,68,68,0.12)] px-4 py-2 text-sm font-medium text-[#ef4444] transition enabled:hover:bg-[#ef4444] enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" />
            {isResetting ? "Menghapus..." : "Hapus Data"}
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
        <div className="flex flex-col justify-center gap-1 rounded-lg bg-[var(--bg-muted)] px-4 py-3 text-xs text-[var(--text-muted)] sm:text-sm">
          <p className="font-medium text-[var(--text-secondary)]">Status</p>
          <p>{isResetting ? "Menghapus data..." : "Data tersimpan secara lokal."}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <button
          onClick={onApply}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Filter className="h-4 w-4" /> Terapkan Filter
        </button>
        <button
          onClick={onResetFilters}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border-color)] px-4 py-2 text-sm font-medium text-[var(--text-muted)] transition hover:border-[var(--accent)]/60 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Reset
        </button>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">Hapus Data Sensor</h3>
                <p className="text-sm text-[var(--text-muted)]">Pilih rentang tanggal untuk menghapus sebagian data, atau hapus semua data.</p>
              </div>
              <button onClick={closeDeleteModal} className="rounded-md p-1 text-[var(--text-muted)] transition hover:bg-[var(--bg-muted)]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm text-[var(--text-muted)]">
                <span>Mulai</span>
                <input
                  type="datetime-local"
                  value={modalRange.start}
                  onChange={(event) => setModalRange((prev) => ({ ...prev, start: event.target.value }))}
                  className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-secondary)] outline-none focus:border-[var(--accent)]"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-[var(--text-muted)]">
                <span>Selesai</span>
                <input
                  type="datetime-local"
                  value={modalRange.end}
                  onChange={(event) => setModalRange((prev) => ({ ...prev, end: event.target.value }))}
                  className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-secondary)] outline-none focus:border-[var(--accent)]"
                />
              </label>
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                onClick={submitDeleteByRange}
                disabled={isResetting}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-transparent bg-[rgba(239,68,68,0.12)] px-4 py-2 text-sm font-medium text-[#ef4444] transition enabled:hover:bg-[#ef4444] enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                {isResetting ? "Menghapus..." : "Hapus Berdasarkan Rentang"}
              </button>
              <button
                onClick={submitDeleteAll}
                disabled={isResetting}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-transparent bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition enabled:hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isResetting ? "Menghapus..." : "Hapus Semua"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

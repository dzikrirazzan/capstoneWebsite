import { formatDate, formatNumber } from "../lib/utils.js";

export default function HistoryTable({ data, pagination, isLoading, error, onPageChange }) {
  const currentPage = pagination?.page ?? 1;
  const totalPages = pagination?.totalPages ?? 1;

  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return (
    <div className="card-container p-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Riwayat Pembacaan Sensor</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Daftar data sensor terbaru yang tersimpan di database.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/40 bg-[rgba(239,68,68,0.12)] px-4 py-3 text-sm text-[#fca5a5]">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-6 text-center text-sm text-[var(--text-muted)]">
          Memuat data histori...
        </div>
      ) : data.length === 0 ? (
        <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-6 text-center text-sm text-[var(--text-muted)]">
          Belum ada data tersimpan.
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((item) => (
            <article
              key={item.id}
              className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-4 transition hover:border-[var(--accent)]/60"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Timestamp</p>
                  <p className="text-sm font-medium text-[var(--text-secondary)]">{formatDate(item.timestamp)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={item.alertStatus ? "chip chip-alert" : "chip chip-normal"}>
                    {item.alertStatus ? "Alert" : "Normal"}
                  </span>
                </div>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-[var(--text-muted)] md:grid-cols-4">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-[var(--text-muted)]">RPM</dt>
                  <dd className="text-base font-semibold text-[var(--text-secondary)]">{formatNumber(item.rpm, 0)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Torque</dt>
                  <dd className="text-[var(--text-secondary)]">{formatNumber(item.torque, 1)} Nm</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-[var(--text-muted)]">MAF</dt>
                  <dd className="text-[var(--text-secondary)]">{formatNumber(item.maf, 1)} g/s</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Temperature</dt>
                  <dd className="text-[var(--text-secondary)]">{formatNumber(item.temperature, 1)} °C</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Fuel</dt>
                  <dd className="text-[var(--text-secondary)]">{formatNumber(item.fuelConsumption, 2)} L/h</dd>
                </div>
                {item.customSensor !== null && item.customSensor !== undefined && (
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Custom</dt>
                    <dd className="text-[var(--text-secondary)]">{formatNumber(item.customSensor, 1)}</dd>
                  </div>
                )}
              </dl>
            </article>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3 text-sm text-[var(--text-muted)] md:flex-row md:items-center md:justify-between">
        <div>
          Halaman {currentPage} dari {totalPages}
          {pagination && (
            <span>
              {" "}
              • Total {pagination.total} data (limit {pagination.limit})
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={!canGoPrevious || isLoading}
            className="rounded-lg border border-[var(--border-color)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition enabled:hover:border-[var(--accent)]/60 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Sebelumnya
          </button>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={!canGoNext || isLoading}
            className="rounded-lg border border-[var(--border-color)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition enabled:hover:border-[var(--accent)]/60 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Selanjutnya
          </button>
        </div>
      </div>
    </div>
  );
}

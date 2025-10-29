import Header from "../Header";
import HistoryFilters from "./HistoryFilters";
import HistoryTable from "./HistoryTable";
import TablePagination from "./TablePagination";

export default function HistoryPage({
  theme,
  onToggleTheme,
  onSendTestData,
  history,
  historyLoading,
  historyError,
  historyPagination,
  onHistoryPageChange,
  historyFilters,
  onHistoryFiltersChange,
  onApplyHistoryFilters,
  onResetHistoryFilters,
  onExportHistory,
  onResetHistory,
  isExportingHistory,
  isResettingHistory,
  isDummyMode = false,
}) {
  return (
    <div className="min-h-screen">
      <Header isConnected={!isDummyMode} theme={theme} onToggleTheme={onToggleTheme} onSendTestData={onSendTestData} />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
        <HistoryFilters
          filters={historyFilters}
          onChange={onHistoryFiltersChange}
          onApply={onApplyHistoryFilters}
          onResetFilters={onResetHistoryFilters}
          onRefresh={onHistoryPageChange.bind(null, historyPagination?.page ?? 1)}
          onExport={onExportHistory}
          onResetData={onResetHistory}
          isLoading={historyLoading}
          isExporting={isExportingHistory}
          isResetting={isResettingHistory}
        />

        {historyError && (
          <div className="rounded-lg border border-red-500/40 bg-[rgba(239,68,68,0.12)] px-4 py-3 text-sm text-[#fca5a5]">
            {historyError}
          </div>
        )}

        {historyLoading ? (
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-8 text-center text-sm text-[var(--text-muted)]">
            Memuat data...
          </div>
        ) : history.length === 0 ? (
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-8 text-center text-sm text-[var(--text-muted)]">
            Belum ada data sensor.
          </div>
        ) : (
          <HistoryTable data={history} />
        )}

        <TablePagination pagination={historyPagination} onPageChange={onHistoryPageChange} />
      </main>
    </div>
  );
}

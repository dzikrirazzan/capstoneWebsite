import Header from "./Header";
import SensorChart from "./SensorChart";
import StatsPanel from "./StatsPanel";
import SummaryCards from "./SummaryCards";

export default function Dashboard({
  sensorData,
  theme,
  onToggleTheme,
  stats,
  statsError,
  statsRange,
  onStatsRangeChange,
  onCustomDateChange,
  customStartDate,
  customEndDate,
  statsLoading,
  chartData,
  chartLoading,
  chartError,
  summaryCounts,
  currentUser,
  onLogout,
  canExportData,
  onExportData,
  isExportingData,
}) {
  return (
    <div className="min-h-screen">
      <Header theme={theme} onToggleTheme={onToggleTheme} currentUser={currentUser} onLogout={onLogout} />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 lg:gap-10">
        <section className="space-y-6">
          <SensorChart
            data={chartData}
            isLoading={chartLoading}
            error={chartError}
            selectedRange={statsRange}
            onRangeChange={onStatsRangeChange}
            onCustomDateChange={onCustomDateChange}
            customStartDate={customStartDate}
            customEndDate={customEndDate}
            canExportData={canExportData}
            onExportData={onExportData}
            isExporting={isExportingData}
          />

          <SummaryCards summaryCounts={summaryCounts} />

          <StatsPanel sensorData={sensorData} stats={stats} statsError={statsError} statsRange={statsRange} onRangeChange={onStatsRangeChange} isLoading={statsLoading} />
        </section>
      </main>
    </div>
  );
}

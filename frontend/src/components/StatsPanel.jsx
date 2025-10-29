import { useMemo } from "react";
import { Activity, Clock, Droplet, Gauge, Thermometer, TrendingUp } from "lucide-react";
import { cn, formatDate, formatNumber } from "../lib/utils.js";

const RANGE_OPTIONS = [
  { label: "1 Jam", value: "1h" },
  { label: "24 Jam", value: "24h" },
  { label: "7 Hari", value: "7d" },
  { label: "30 Hari", value: "30d" },
];

const CURRENT_METRICS = [
  {
    label: "RPM",
    colorClass: "text-[#f97316]",
    icon: Gauge,
    key: "rpm",
    unit: "RPM",
    format: (value) => `${value.toFixed(0)} RPM`,
  },
  {
    label: "Suhu",
    colorClass: "text-[#f59e0b]",
    icon: Thermometer,
    key: "temperature",
    unit: "°C",
    format: (value) => `${formatNumber(value, 1)} °C`,
  },
  {
    label: "Konsumsi BBM",
    colorClass: "text-[#22c55e]",
    icon: Droplet,
    key: "fuelConsumption",
    unit: "L/h",
    format: (value) => `${formatNumber(value, 2)} L/h`,
  },
];

const AGGREGATE_METRICS = [
  { key: "rpm", label: "RPM", unit: "RPM", decimals: 0 },
  { key: "torque", label: "Torsi", unit: "Nm", decimals: 1 },
  { key: "maf", label: "MAF", unit: "g/s", decimals: 1 },
  { key: "temperature", label: "Suhu", unit: "°C", decimals: 1 },
  { key: "fuelConsumption", label: "Konsumsi BBM", unit: "L/h", decimals: 2 },
];

export default function StatsPanel({ sensorData, stats, statsError, statsRange, onRangeChange, isLoading }) {
  const lastUpdate = sensorData ? formatDate(sensorData.timestamp) : "Belum ada data";
  const periodLabel =
    stats?.period && (stats.period.start || stats.period.end)
      ? `${stats.period.start ? formatDate(stats.period.start) : "—"} → ${stats.period.end ? formatDate(stats.period.end) : "—"}`
      : null;

  const currentMetrics = useMemo(
    () => [
      ...CURRENT_METRICS.map(({ label, icon: Icon, key, colorClass, format }) => ({
        label,
        colorClass: sensorData ? colorClass : "text-[var(--text-muted)]",
        icon: Icon,
        value: sensorData ? format(sensorData[key]) : "—",
      })),
      {
        label: "Last Update",
        colorClass: "text-[var(--text-muted)]",
        icon: Clock,
        value: lastUpdate,
      },
    ],
    [sensorData, lastUpdate]
  );

  return (
    <div className="card-container space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-[var(--accent-soft)] p-2">
            <TrendingUp className="h-6 w-6 text-[var(--accent)]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Ringkasan Performa</h2>
            <p className="text-sm text-[var(--text-muted)]">Rekap data sensor dan kondisi terbaru</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onRangeChange(option.value)}
              disabled={isLoading && option.value === statsRange}
              className={cn(
                "rounded-lg px-4 py-2 text-sm transition",
                option.value === statsRange
                  ? "bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/30"
                  : "border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:border-[var(--accent)]/60",
                isLoading && option.value === statsRange ? "opacity-80" : ""
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {currentMetrics.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="flex items-center gap-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] p-4"
            >
              <Icon className={cn("h-8 w-8", stat.colorClass)} />
              <div>
                <p className="text-sm text-[var(--text-muted)]">{stat.label}</p>
                <p className="text-lg font-semibold text-[var(--text-secondary)]">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {sensorData?.alertStatus && (
        <div className="rounded-lg border border-transparent bg-[rgba(239,68,68,0.18)] p-4">
          <p className="font-medium text-[#fca5a5]">⚠️ Alert Status: Active</p>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-[var(--text-muted)]" />
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Statistik Rentang Waktu</h3>
          </div>
          {stats && (
            <div className="flex flex-col text-xs text-[var(--text-muted)] sm:items-end">
              <span className="uppercase tracking-wide">
                {stats.count} data • Rentang {stats.timeRange.toUpperCase()}
              </span>
              {periodLabel && <span className="mt-1 text-[11px]">{periodLabel}</span>}
            </div>
          )}
        </div>

        {statsError && (
          <div className="rounded-lg border border-red-500/40 bg-[rgba(239,68,68,0.12)] px-4 py-3 text-sm text-[#fca5a5]">
            {statsError}
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-[var(--text-muted)]">Mengambil data statistik...</p>
        ) : stats && stats.count > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {AGGREGATE_METRICS.map((metric) => (
              <div
                key={metric.key}
                className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] p-4"
              >
                <p className="text-sm text-[var(--text-muted)]">{metric.label}</p>
                <div className="mt-3 grid grid-cols-3 gap-3 text-center text-xs text-[var(--text-muted)]">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Min</p>
                    <p className="text-base font-semibold text-[var(--text-secondary)]">
                      {formatNumber(stats[metric.key].min, metric.decimals)} {metric.unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Avg</p>
                    <p className="text-base font-semibold text-[var(--text-secondary)]">
                      {formatNumber(stats[metric.key].avg, metric.decimals)} {metric.unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Max</p>
                    <p className="text-base font-semibold text-[var(--text-secondary)]">
                      {formatNumber(stats[metric.key].max, metric.decimals)} {metric.unit}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-6 text-center text-sm text-[var(--text-muted)]">
            Belum ada data pada rentang waktu ini.
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatDate, formatNumber } from "../lib/utils.js";
import { ChartLine, AlertCircle, Calendar } from "lucide-react";

const METRICS = [
  { key: "rpm", label: "RPM", color: "#f97316", unit: "RPM" },
  { key: "torque", label: "Torque", color: "#10b981", unit: "Nm" },
  { key: "maf", label: "MAF", color: "#0ea5e9", unit: "g/s" },
  { key: "temperature", label: "Temp", color: "#facc15", unit: "°C" },
  { key: "fuelConsumption", label: "Fuel", color: "#a855f7", unit: "L/h" },
];

const DEFAULT_VISIBLE = METRICS.map((metric) => metric.key);
const RANGE_OPTIONS = [
  { label: "1 Jam", value: "1h" },
  { label: "24 Jam", value: "24h" },
  { label: "7 Hari", value: "7d" },
  { label: "30 Hari", value: "30d" },
  { label: "Semua Data", value: "all" },
];

export default function SensorChart({ data, isLoading, error, selectedRange, onRangeChange, onCustomDateChange, customStartDate, customEndDate }) {
  const [visibleMetrics, setVisibleMetrics] = useState(DEFAULT_VISIBLE);
  const [viewMode, setViewMode] = useState("combined");
  const [singleMetric, setSingleMetric] = useState(METRICS[0].key);
  const [showCustomDate, setShowCustomDate] = useState(false);
  const activeRange = selectedRange ?? "all";

  const chartData = useMemo(
    () =>
      data.map((item) => ({
        ...item,
        timestampLabel: formatDate(item.timestamp),
      })),
    [data]
  );

  useEffect(() => {
    if (viewMode === "combined" && visibleMetrics.length === 0) {
      setVisibleMetrics(DEFAULT_VISIBLE);
    }
  }, [viewMode, visibleMetrics.length]);

  useEffect(() => {
    if (viewMode === "single") {
      if (!METRICS.find((metric) => metric.key === singleMetric)) {
        setSingleMetric(METRICS[0].key);
      }
    }
  }, [viewMode, singleMetric]);

  const toggleMetric = (metric) => {
    if (viewMode === "single") {
      setSingleMetric(metric);
      return;
    }

    setVisibleMetrics((current) => {
      if (current.includes(metric)) {
        if (current.length === 1) return current;
        return current.filter((key) => key !== metric);
      }
      return [...current, metric];
    });
  };

  const metricsToRender = useMemo(() => {
    if (viewMode === "single") {
      return METRICS.filter((metric) => metric.key === singleMetric);
    }
    return METRICS.filter((metric) => visibleMetrics.includes(metric.key));
  }, [singleMetric, viewMode, visibleMetrics]);

  const handleRangeClick = (value) => {
    if (value === "custom") {
      setShowCustomDate(true);
    } else {
      setShowCustomDate(false);
      onRangeChange?.(value);
    }
  };

  const handleCustomDateApply = () => {
    if (customStartDate || customEndDate) {
      onRangeChange?.("custom");
      setShowCustomDate(false);
    }
  };

  const handleCustomDateClear = () => {
    onCustomDateChange?.({ start: "", end: "" });
    onRangeChange?.("all");
    setShowCustomDate(false);
  };

  return (
    <section className="card-container p-6">
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-[var(--accent-soft)] p-2">
            <ChartLine className="h-6 w-6 text-[var(--accent)]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Tren Sensor</h2>
            <p className="text-sm text-[var(--text-muted)]">Pilih rentang waktu dan metrik untuk melihat tren performa mesin.</p>
          </div>
        </div>

        <div className="flex w-full flex-wrap items-center gap-3 lg:ml-auto lg:w-auto lg:justify-end">
          <div className="flex flex-wrap gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] px-2 py-1 text-xs">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleRangeClick(option.value)}
                className={`rounded-md px-3 py-1 font-semibold transition ${activeRange === option.value ? "bg-[var(--accent)] text-white" : "text-[var(--text-muted)] hover:bg-[var(--accent-soft)]"}`}
              >
                {option.label}
              </button>
            ))}
            <button
              onClick={() => setShowCustomDate(!showCustomDate)}
              className={`flex items-center gap-1 rounded-md px-3 py-1 font-semibold transition ${activeRange === "custom" ? "bg-[var(--accent)] text-white" : "text-[var(--text-muted)] hover:bg-[var(--accent-soft)]"}`}
            >
              <Calendar className="h-3 w-3" />
              Custom
            </button>
          </div>

          <div className="flex overflow-hidden rounded-lg border border-[var(--border-color)] text-xs">
            <button
              onClick={() => setViewMode("combined")}
              className={`px-3 py-1 font-semibold transition ${viewMode === "combined" ? "bg-[var(--accent)] text-white" : "bg-[var(--bg-card)] text-[var(--text-muted)] hover:bg-[var(--accent-soft)]"}`}
            >
              Gabungan
            </button>
            <button
              onClick={() => setViewMode("single")}
              className={`px-3 py-1 font-semibold transition ${viewMode === "single" ? "bg-[var(--accent)] text-white" : "bg-[var(--bg-card)] text-[var(--text-muted)] hover:bg-[var(--accent-soft)]"}`}
            >
              Satu Metrik
            </button>
          </div>

          {viewMode === "single" && (
            <select
              value={singleMetric}
              onChange={(event) => setSingleMetric(event.target.value)}
              className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-1 text-xs font-semibold text-[var(--text-secondary)] outline-none focus:border-[var(--accent)]"
            >
              {METRICS.map((metric) => (
                <option key={metric.key} value={metric.key}>
                  {metric.label}
                </option>
              ))}
            </select>
          )}

          <div className="flex flex-wrap gap-2">
            {METRICS.map((metric) => {
              const isActive = viewMode === "single" ? singleMetric === metric.key : visibleMetrics.includes(metric.key);
              return (
                <button
                  key={metric.key}
                  onClick={() => toggleMetric(metric.key)}
                  className={`rounded-lg border px-3 py-1 text-xs font-semibold transition ${
                    isActive ? "border-transparent bg-[var(--accent)] text-white" : "border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:border-[var(--accent)]/60"
                  }`}
                >
                  {metric.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {showCustomDate && (
        <div className="mb-4 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
          <div className="mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[var(--accent)]" />
            <h3 className="font-semibold text-[var(--text-primary)]">Pilih Rentang Tanggal Custom</h3>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">Tanggal Mulai</label>
              <input
                type="date"
                value={customStartDate || ""}
                onChange={(e) => onCustomDateChange?.({ start: e.target.value })}
                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">Tanggal Akhir</label>
              <input
                type="date"
                value={customEndDate || ""}
                onChange={(e) => onCustomDateChange?.({ end: e.target.value })}
                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={handleCustomDateApply} className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90">
                Terapkan
              </button>
              <button onClick={handleCustomDateClear} className="rounded-lg border border-[var(--border-color)] px-4 py-2 text-sm font-semibold text-[var(--text-muted)] transition hover:bg-[var(--accent-soft)]">
                Reset
              </button>
            </div>
          </div>
          {(customStartDate || customEndDate) && (
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              {customStartDate && customEndDate ? `Data dari ${customStartDate} sampai ${customEndDate}` : customStartDate ? `Data dari ${customStartDate}` : `Data sampai ${customEndDate}`}
            </p>
          )}
        </div>
      )}

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/40 bg-[rgba(239,68,68,0.12)] px-4 py-3 text-sm text-[#fca5a5]">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex h-80 items-center justify-center">
          <p className="text-sm text-[var(--text-muted)]">Mengambil data chart...</p>
        </div>
      ) : chartData.length === 0 ? (
        <div className="flex h-80 flex-col items-center justify-center gap-2">
          <AlertCircle className="h-8 w-8 text-[var(--text-muted)]" />
          <p className="text-sm font-medium text-[var(--text-primary)]">Tidak ada data</p>
          <p className="text-xs text-[var(--text-muted)]">{activeRange === "all" ? "Belum ada data sensor yang tersimpan" : `Tidak ada data untuk rentang waktu yang dipilih`}</p>
          <button onClick={() => handleRangeClick("all")} className="mt-2 rounded-lg border border-[var(--border-color)] px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--accent-soft)]">
            Lihat Semua Data
          </button>
        </div>
      ) : (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid stroke="var(--border-color)" strokeDasharray="4 8" />
              <XAxis dataKey="timestampLabel" tick={{ fill: "var(--text-muted)", fontSize: 12 }} minTickGap={32} />
              <YAxis tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--bg-card)",
                  borderColor: "var(--border-color)",
                  color: "var(--text-primary)",
                }}
                formatter={(value, name) => {
                  const metric = METRICS.find((item) => item.label === name);
                  return [`${formatNumber(value, 2)} ${metric?.unit ?? ""}`, name];
                }}
              />
              <Legend />
              {metricsToRender.map((metric) => (
                <Line key={metric.key} type="monotone" dataKey={metric.key} name={metric.label} stroke={metric.color} strokeWidth={2} dot={false} isAnimationActive={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

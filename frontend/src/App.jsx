import { useCallback, useEffect, useRef, useState } from "react";
import { Routes, Route } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import HistoryPage from "./components/history/HistoryPage";
import AnalyticsPage from "./components/analytics/AnalyticsPage";

const METRICS = ["rpm", "torque", "maf", "temperature", "fuelConsumption"];

const defaultStatsState = {
  rpm: { min: 0, max: 0, avg: 0 },
  torque: { min: 0, max: 0, avg: 0 },
  maf: { min: 0, max: 0, avg: 0 },
  temperature: { min: 0, max: 0, avg: 0 },
  fuelConsumption: { min: 0, max: 0, avg: 0 },
  count: 0,
  timeRange: "custom",
  period: { start: null, end: null },
};

const resolveApiBaseUrl = () => {
  const fromEnv = import.meta.env.VITE_BACKEND_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    return import.meta.env.DEV ? "" : window.location.origin;
  }
  return "";
};

const defaultHistoryFilters = {
  start: "",
  end: "",
  limit: 20,
};

const toIsoString = (value) => {
  if (!value) {
    return undefined;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
};

function App() {
  const [apiBaseUrl] = useState(resolveApiBaseUrl);
  const [sensorData, setSensorData] = useState(null);
  const [stats, setStats] = useState(null);
  const [statsError, setStatsError] = useState(null);
  const [statsRange, setStatsRange] = useState("1h");
  const [statsLoading, setStatsLoading] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyError, setHistoryError] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPagination, setHistoryPagination] = useState(null);
  const [historyFilters, setHistoryFilters] = useState(defaultHistoryFilters);
  const [isExportingHistory, setIsExportingHistory] = useState(false);
  const [isResettingHistory, setIsResettingHistory] = useState(false);
  const [summaryCounts, setSummaryCounts] = useState({ total: 0, day: 0, week: 0 });
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") {
      return "dark";
    }
    const stored = window.localStorage.getItem("emsys:theme");
    if (stored === "light" || stored === "dark") {
      return stored;
    }
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)") ?? { matches: true };
    return prefersDark.matches ? "dark" : "light";
  });
  const statsRangeRef = useRef(statsRange);
  const historyPageRef = useRef(1);
  const appliedHistoryFiltersRef = useRef(defaultHistoryFilters);
  const latestSeriesRef = useRef([]);
  const latestRecordIdRef = useRef(null);

  const computePeriodCounts = useCallback((dataset = []) => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const weekMs = 7 * dayMs;
    let day = 0;
    let week = 0;

    dataset.forEach((item) => {
      const ts = new Date(item.timestamp).getTime();
      if (Number.isNaN(ts)) return;
      const diff = now - ts;
      if (diff <= dayMs) day += 1;
      if (diff <= weekMs) week += 1;
    });

    return { day, week };
  }, []);

  const updateSummaryDayWeek = useCallback(
    (dataset) => {
      const { day, week } = computePeriodCounts(dataset);
      setSummaryCounts((prev) => ({ ...prev, day, week }));
    },
    [computePeriodCounts]
  );

  useEffect(() => {
    statsRangeRef.current = statsRange;
  }, [statsRange]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.classList.remove("theme-dark", "theme-light");
    const nextClass = theme === "dark" ? "theme-dark" : "theme-light";
    root.classList.add(nextClass);
    window.localStorage.setItem("emsys:theme", theme);
  }, [theme]);

  const fetchStats = useCallback(
    async (range, filters) => {
      setStatsLoading(true);
      try {
        setStatsError(null);
        const activeFilters = filters ?? appliedHistoryFiltersRef.current;
        const params = new URLSearchParams();
        const startIso = toIsoString(activeFilters.start);
        const endIso = toIsoString(activeFilters.end);

        if (startIso) params.set("start", startIso);
        if (endIso) params.set("end", endIso);

        if (!startIso && !endIso) {
          params.set("range", range);
        } else {
          params.set("range", "custom");
        }

        const response = await fetch(`${apiBaseUrl}/api/sensor-data/stats?${params.toString()}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch stats (${response.status})`);
        }
        const payload = await response.json();
        setStats(payload);
      } catch (error) {
        console.error("Failed to fetch stats", error);
        setStatsError("Tidak bisa mengambil data statistik.");
      } finally {
        setStatsLoading(false);
      }
    },
    [apiBaseUrl]
  );

  const fetchChartData = useCallback(
    async (filters) => {
      setChartLoading(true);
      try {
        setChartError(null);
        const activeFilters = filters ?? appliedHistoryFiltersRef.current;
        const params = new URLSearchParams();
        const startIso = toIsoString(activeFilters.start);
        const endIso = toIsoString(activeFilters.end);

        if (startIso) params.set("start", startIso);
        if (endIso) params.set("end", endIso);

        const limitForSeries = Math.max(activeFilters.limit * 5, 200);
        params.set("limit", limitForSeries.toString());

        const response = await fetch(`${apiBaseUrl}/api/sensor-data/series?${params.toString()}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch chart data (${response.status})`);
        }
        const payload = await response.json();
        setChartData(payload.data);
        latestSeriesRef.current = payload.data ?? [];
        updateSummaryDayWeek(payload.data ?? []);
      } catch (error) {
        console.error("Failed to fetch chart data", error);
        setChartError("Tidak bisa mengambil data chart.");
      } finally {
        setChartLoading(false);
      }
    },
    [apiBaseUrl, updateSummaryDayWeek]
  );

  const fetchHistory = useCallback(
    async (page = 1, filters) => {
      try {
        setHistoryError(null);
        setHistoryLoading(true);
        const activeFilters = filters ?? appliedHistoryFiltersRef.current;
        const params = new URLSearchParams({
          page: page.toString(),
          limit: activeFilters.limit.toString(),
        });
        const startIso = toIsoString(activeFilters.start);
        const endIso = toIsoString(activeFilters.end);

        if (startIso) params.set("start", startIso);
        if (endIso) params.set("end", endIso);

        const response = await fetch(`${apiBaseUrl}/api/sensor-data?${params.toString()}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch history (${response.status})`);
        }
        const payload = await response.json();
        setHistory(payload.data);
        setHistoryPagination(payload.pagination);
        historyPageRef.current = payload.pagination.page;
        if (payload.pagination?.total !== undefined) {
          setSummaryCounts((prev) => ({ ...prev, total: payload.pagination.total }));
        }
        updateSummaryDayWeek(latestSeriesRef.current.length ? latestSeriesRef.current : payload.data ?? []);
      } catch (error) {
        console.error("Failed to fetch history", error);
        setHistoryError("Tidak bisa mengambil data histori.");
      } finally {
        setHistoryLoading(false);
      }
    },
    [apiBaseUrl, updateSummaryDayWeek]
  );

  useEffect(() => {
    fetchHistory(1, appliedHistoryFiltersRef.current).catch(() => null);
    fetchChartData(appliedHistoryFiltersRef.current).catch(() => null);
    fetchStats(statsRangeRef.current, appliedHistoryFiltersRef.current).catch(() => null);
  }, [fetchHistory, fetchChartData, fetchStats]);

  useEffect(() => {
    fetchStats(statsRange, appliedHistoryFiltersRef.current).catch(() => null);
  }, [fetchStats, statsRange]);

  useEffect(() => {
    let intervalId;

    const pollLatest = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/sensor-data/latest`);
        if (response.status === 404) {
          setSensorData(null);
          return;
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch latest data (${response.status})`);
        }

        const payload = await response.json();

        if (!payload) {
          return;
        }

        const latestId = payload.id ?? payload.timestamp;
        if (latestRecordIdRef.current === latestId) {
          return;
        }

        latestRecordIdRef.current = latestId;
        setSensorData(payload);

        await Promise.all([
          fetchStats(statsRangeRef.current, appliedHistoryFiltersRef.current).catch(() => null),
          fetchHistory(historyPageRef.current, appliedHistoryFiltersRef.current).catch(() => null),
          fetchChartData(appliedHistoryFiltersRef.current).catch(() => null),
        ]);
      } catch (error) {
        console.error("Polling latest data failed", error);
      }
    };

    pollLatest();
    if (typeof window !== "undefined") {
      intervalId = window.setInterval(pollLatest, 5000);
    }

    return () => {
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [apiBaseUrl, fetchChartData, fetchHistory, fetchStats]);

  useEffect(() => {
    if (historyPagination) {
      historyPageRef.current = historyPagination.page;
    }
  }, [historyPagination]);

  const handleStatsRangeChange = useCallback((range) => {
    setStatsRange(range);
  }, []);

  const handleHistoryPageChange = useCallback(
    (page) => {
      fetchHistory(page, appliedHistoryFiltersRef.current).catch(() => null);
    },
    [fetchHistory]
  );

  const handleRefreshHistory = useCallback(() => {
    fetchHistory(historyPageRef.current, appliedHistoryFiltersRef.current).catch(() => null);
  }, [fetchHistory]);

  const handleHistoryFiltersChange = useCallback((updates) => {
    setHistoryFilters((previous) => ({
      ...previous,
      ...updates,
    }));
  }, []);

  const applyHistoryFilters = useCallback(() => {
    const normalized = {
      start: historyFilters.start,
      end: historyFilters.end,
      limit: historyFilters.limit || 20,
    };

    appliedHistoryFiltersRef.current = normalized;
    historyPageRef.current = 1;

    fetchHistory(1, normalized).catch(() => null);
    fetchStats(statsRangeRef.current, normalized).catch(() => null);
    fetchChartData(normalized).catch(() => null);
  }, [fetchChartData, fetchHistory, fetchStats, historyFilters]);

  const resetHistoryFilters = useCallback(() => {
    setHistoryFilters(defaultHistoryFilters);
    appliedHistoryFiltersRef.current = defaultHistoryFilters;
    historyPageRef.current = 1;

    fetchHistory(1, defaultHistoryFilters).catch(() => null);
    fetchStats(statsRangeRef.current, defaultHistoryFilters).catch(() => null);
    fetchChartData(defaultHistoryFilters).catch(() => null);
  }, [fetchChartData, fetchHistory, fetchStats]);

  const handleExportHistory = useCallback(async () => {
    try {
      setIsExportingHistory(true);
      const params = new URLSearchParams();
      const { start, end } = appliedHistoryFiltersRef.current;
      const startIso = toIsoString(start);
      const endIso = toIsoString(end);

      if (startIso) params.set("start", startIso);
      if (endIso) params.set("end", endIso);

      const response = await fetch(`${apiBaseUrl}/api/sensor-data/export?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Failed to export data (${response.status})`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = downloadUrl;

      // Generate filename with timestamp
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      const fileTimestamp = `${year}${month}${day}${hours}${minutes}${seconds}`;
      anchor.download = `EMSysData_${fileTimestamp}.xlsx`;

      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Failed to export history", error);
      setHistoryError("Gagal mengekspor data.");
    } finally {
      setIsExportingHistory(false);
    }
  }, [apiBaseUrl]);

  const handleResetHistoryData = useCallback(
    async (options = "range") => {
      const params = typeof options === "string" ? { mode: options } : options || {};
      const mode = params.mode ?? "range";
      const rangeOverride = params.range ?? null;

      const confirmation = window.confirm(mode === "all" ? "Yakin ingin menghapus seluruh data sensor? Tindakan ini tidak dapat dibatalkan." : "Yakin ingin menghapus data berdasarkan rentang yang dipilih?");
      if (!confirmation) {
        return;
      }

      try {
        setIsResettingHistory(true);
        const params = new URLSearchParams();
        if (mode !== "all") {
          const { start, end } = rangeOverride ?? appliedHistoryFiltersRef.current;
          const startIso = toIsoString(start);
          const endIso = toIsoString(end);

          if (startIso) params.set("start", startIso);
          if (endIso) params.set("end", endIso);
        }

        const query = params.toString();
        const target = query && mode !== "all" ? `${apiBaseUrl}/api/sensor-data?${query}` : `${apiBaseUrl}/api/sensor-data`;
        const response = await fetch(target, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error(`Failed to delete data (${response.status})`);
        }

        await fetchHistory(1, appliedHistoryFiltersRef.current);
        await fetchStats(statsRangeRef.current, appliedHistoryFiltersRef.current);
        await fetchChartData(appliedHistoryFiltersRef.current);
      } catch (error) {
        console.error("Failed to delete history", error);
        setHistoryError("Gagal menghapus data.");
      } finally {
        setIsResettingHistory(false);
      }
    },
    [apiBaseUrl, fetchChartData, fetchHistory, fetchStats]
  );

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }, []);

  return (
    <div className="app-shell min-h-screen">
      <Routes>
        <Route
          path="/"
          element={
            <Dashboard
              sensorData={sensorData}
              theme={theme}
              onToggleTheme={toggleTheme}
              stats={stats}
              statsError={statsError}
              statsRange={statsRange}
              onStatsRangeChange={handleStatsRangeChange}
              statsLoading={statsLoading}
              chartData={chartData}
              chartLoading={chartLoading}
              chartError={chartError}
              summaryCounts={summaryCounts}
            />
          }
        />
        <Route
          path="/history"
          element={
            <HistoryPage
              theme={theme}
              onToggleTheme={toggleTheme}
              history={history}
              historyLoading={historyLoading}
              historyError={historyError}
              historyPagination={historyPagination}
              onHistoryPageChange={handleHistoryPageChange}
              historyFilters={historyFilters}
              onHistoryFiltersChange={handleHistoryFiltersChange}
              onApplyHistoryFilters={applyHistoryFilters}
              onResetHistoryFilters={resetHistoryFilters}
              onExportHistory={handleExportHistory}
              onResetHistory={handleResetHistoryData}
              isExportingHistory={isExportingHistory}
              isResettingHistory={isResettingHistory}
            />
          }
        />
        <Route path="/analytics" element={<AnalyticsPage theme={theme} onToggleTheme={toggleTheme} />} />
      </Routes>
    </div>
  );
}

export default App;

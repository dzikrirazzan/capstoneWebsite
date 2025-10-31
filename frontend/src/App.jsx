import { useCallback, useEffect, useRef, useState } from "react";
import { Routes, Route } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import HistoryPage from "./components/history/HistoryPage";

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
  const [isUsingDummyData, setIsUsingDummyData] = useState(false);
  const [summaryCounts, setSummaryCounts] = useState({ total: 0, day: 0, week: 0 });
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") {
      return "dark";
    }
    const stored = window.localStorage.getItem("fuelsense:theme");
    if (stored === "light" || stored === "dark") {
      return stored;
    }
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)") ?? { matches: true };
    return prefersDark.matches ? "dark" : "light";
  });
  const statsRangeRef = useRef(statsRange);
  const historyPageRef = useRef(1);
  const appliedHistoryFiltersRef = useRef(defaultHistoryFilters);
  const [hasBackendError, setHasBackendError] = useState(false);
  const dummyHistoryRef = useRef([]);
  const dummyIdRef = useRef(1);
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

  const computeStatsFromDataset = useCallback((dataset) => {
    if (!dataset || dataset.length === 0) {
      return { ...defaultStatsState };
    }

    const aggregates = {};
    METRICS.forEach((key) => {
      aggregates[key] = { min: Infinity, max: -Infinity, sum: 0 };
    });

    dataset.forEach((record) => {
      METRICS.forEach((key) => {
        const value = Number(record[key] ?? 0);
        const metric = aggregates[key];
        metric.min = Math.min(metric.min, value);
        metric.max = Math.max(metric.max, value);
        metric.sum += value;
      });
    });

    const result = {};
    METRICS.forEach((key) => {
      const metric = aggregates[key];
      result[key] = {
        min: Number(metric.min.toFixed(1)),
        max: Number(metric.max.toFixed(1)),
        avg: Number((metric.sum / dataset.length).toFixed(1)),
      };
    });

    return {
      ...result,
      count: dataset.length,
      timeRange: "custom",
      period: {
        start: dataset[dataset.length - 1]?.timestamp ?? null,
        end: dataset[0]?.timestamp ?? null,
      },
    };
  }, []);

  const updateDisplaysFromDummy = useCallback(
    (page = historyPageRef.current, limit = appliedHistoryFiltersRef.current.limit || 20) => {
      const safeLimit = Math.max(1, limit);
      const total = dummyHistoryRef.current.length;
      const totalPages = Math.max(1, Math.ceil(total / safeLimit));
      const currentPage = Math.min(Math.max(1, page), totalPages);
      historyPageRef.current = currentPage;

      const startIndex = (currentPage - 1) * safeLimit;
      const paged = dummyHistoryRef.current.slice(startIndex, startIndex + safeLimit);

      setHistory(paged);
      setHistoryPagination({
        page: currentPage,
        limit: safeLimit,
        total,
        totalPages,
      });

      setSummaryCounts((prev) => ({ ...prev, total }));

      const statsData = computeStatsFromDataset(dummyHistoryRef.current);
      setStats(statsData);
      setStatsError(null);
      setHistoryError(null);

      const chartSeries = dummyHistoryRef.current
        .slice()
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        .slice(-200);
      setChartData(chartSeries);
      latestSeriesRef.current = chartSeries;
      updateSummaryDayWeek(dummyHistoryRef.current);
      setChartError(null);

      const latest = dummyHistoryRef.current[0] ?? null;
      setSensorData(latest);
    },
    [computeStatsFromDataset]
  );

  const createRandomReading = useCallback((timestamp = Date.now()) => {
    const rpm = Math.round(2800 + Math.random() * 3200);
    const torque = Number((120 + Math.random() * 180).toFixed(1));
    const maf = Number((20 + Math.random() * 80).toFixed(1));
    const temperature = Number((70 + Math.random() * 40).toFixed(1));
    const fuelConsumption = Number((5 + Math.random() * 10).toFixed(2));
    const customSensor = Number((Math.random() * 100).toFixed(1));

    return {
      id: dummyIdRef.current++,
      timestamp: new Date(timestamp).toISOString(),
      rpm,
      torque,
      maf,
      temperature,
      fuelConsumption,
      customSensor,
    };
  }, []);

  const persistSensorReading = useCallback(
    async (reading) => {
      const { id: _omitId, alertStatus: _omitAlert, ...payload } = reading ?? {};

      const response = await fetch(`${apiBaseUrl}/api/sensor-data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to send sensor data (${response.status})`);
      }

      return response.json();
    },
    [apiBaseUrl]
  );

  const applyDummyReading = useCallback(
    (reading) => {
      setIsUsingDummyData(true);
      setHasBackendError(true);

      dummyHistoryRef.current = [reading, ...dummyHistoryRef.current].sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );

      updateDisplaysFromDummy(1, appliedHistoryFiltersRef.current.limit || 20);
      setSensorData(reading);
    },
    [updateDisplaysFromDummy]
  );

  const seedDummyData = useCallback(() => {
    if (dummyHistoryRef.current.length) {
      updateDisplaysFromDummy(1, appliedHistoryFiltersRef.current.limit || 20);
      return;
    }

    const now = Date.now();
    const seeds = Array.from({ length: 6 }, (_, index) =>
      createRandomReading(now - index * 60000)
    );

    dummyHistoryRef.current = seeds.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    setIsUsingDummyData(true);
    setHasBackendError(true);
    updateDisplaysFromDummy(1, appliedHistoryFiltersRef.current.limit || 20);
  }, [createRandomReading, updateDisplaysFromDummy]);

  useEffect(() => {
    statsRangeRef.current = statsRange;
  }, [statsRange]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.classList.remove("theme-dark", "theme-light");
    const nextClass = theme === "dark" ? "theme-dark" : "theme-light";
    root.classList.add(nextClass);
    window.localStorage.setItem("fuelsense:theme", theme);
  }, [theme]);

  const fetchStats = useCallback(async (range, filters) => {
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
      setHasBackendError(false);
      setIsUsingDummyData(false);
    } catch (error) {
      console.error("Failed to fetch stats", error);
      setStatsError("Tidak bisa mengambil data statistik.");
      setHasBackendError(true);
      setIsUsingDummyData(true);
      seedDummyData();
    } finally {
      setStatsLoading(false);
    }
  }, [apiBaseUrl, seedDummyData]);

  const fetchChartData = useCallback(async (filters) => {
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
      setHasBackendError(false);
      setIsUsingDummyData(false);
      latestSeriesRef.current = payload.data ?? [];
      updateSummaryDayWeek(payload.data ?? []);
    } catch (error) {
      console.error("Failed to fetch chart data", error);
      setChartError("Tidak bisa mengambil data chart.");
      setHasBackendError(true);
      setIsUsingDummyData(true);
      seedDummyData();
    } finally {
      setChartLoading(false);
    }
  }, [apiBaseUrl, seedDummyData, updateSummaryDayWeek]);

  const fetchHistory = useCallback(async (page = 1, filters) => {
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
      setHasBackendError(false);
      setIsUsingDummyData(false);
      if (payload.pagination?.total !== undefined) {
        setSummaryCounts((prev) => ({ ...prev, total: payload.pagination.total }));
      }
      updateSummaryDayWeek(latestSeriesRef.current.length ? latestSeriesRef.current : payload.data ?? []);
    } catch (error) {
      console.error("Failed to fetch history", error);
      setHistoryError("Tidak bisa mengambil data histori.");
      setHasBackendError(true);
      setIsUsingDummyData(true);
      seedDummyData();
    } finally {
      setHistoryLoading(false);
    }
  }, [apiBaseUrl, seedDummyData, updateSummaryDayWeek]);

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
          setHasBackendError(false);
          setIsUsingDummyData(false);
          return;
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch latest data (${response.status})`);
        }

        const payload = await response.json();
        setHasBackendError(false);
        setIsUsingDummyData(false);

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
        setHasBackendError(true);
        setIsUsingDummyData(true);
        seedDummyData();
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
  }, [apiBaseUrl, fetchChartData, fetchHistory, fetchStats, seedDummyData]);

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
      if (isUsingDummyData || hasBackendError) {
        historyPageRef.current = page;
        updateDisplaysFromDummy(page, appliedHistoryFiltersRef.current.limit || 20);
        return;
      }

      fetchHistory(page, appliedHistoryFiltersRef.current).catch(() => null);
    },
    [fetchHistory, hasBackendError, isUsingDummyData, updateDisplaysFromDummy]
  );

  const handleRefreshHistory = useCallback(() => {
    if (isUsingDummyData || hasBackendError) {
      updateDisplaysFromDummy(historyPageRef.current, appliedHistoryFiltersRef.current.limit || 20);
      return;
    }

    fetchHistory(historyPageRef.current, appliedHistoryFiltersRef.current).catch(() => null);
  }, [fetchHistory, hasBackendError, isUsingDummyData, updateDisplaysFromDummy]);

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

    if (isUsingDummyData || hasBackendError) {
      updateDisplaysFromDummy(1, normalized.limit || 20);
      return;
    }

    fetchHistory(1, normalized).catch(() => null);
    fetchStats(statsRangeRef.current, normalized).catch(() => null);
    fetchChartData(normalized).catch(() => null);
  }, [fetchChartData, fetchHistory, fetchStats, hasBackendError, historyFilters, isUsingDummyData, updateDisplaysFromDummy]);

  const resetHistoryFilters = useCallback(() => {
    setHistoryFilters(defaultHistoryFilters);
    appliedHistoryFiltersRef.current = defaultHistoryFilters;
    historyPageRef.current = 1;

    if (isUsingDummyData || hasBackendError) {
      updateDisplaysFromDummy(1, defaultHistoryFilters.limit || 20);
      return;
    }

    fetchHistory(1, defaultHistoryFilters).catch(() => null);
    fetchStats(statsRangeRef.current, defaultHistoryFilters).catch(() => null);
    fetchChartData(defaultHistoryFilters).catch(() => null);
  }, [fetchChartData, fetchHistory, fetchStats, hasBackendError, isUsingDummyData, updateDisplaysFromDummy]);

  const handleExportHistory = useCallback(async () => {
    if (isUsingDummyData || hasBackendError) {
      try {
        setIsExportingHistory(true);
        if (!dummyHistoryRef.current.length) {
          throw new Error("No data");
        }

        const headers = ["id", "timestamp", "rpm", "torque", "maf", "temperature", "fuelConsumption", "customSensor"];

        const escapeValue = (value) => {
          if (value === null || value === undefined) return "";
          const stringValue = value instanceof Date ? value.toISOString() : String(value);
          return `"${stringValue.replace(/"/g, '""')}"`;
        };

        const rows = dummyHistoryRef.current
          .slice()
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .map((row) =>
            [
              escapeValue(row.id),
              escapeValue(row.timestamp),
              escapeValue(row.rpm),
              escapeValue(row.torque),
              escapeValue(row.maf),
              escapeValue(row.temperature),
              escapeValue(row.fuelConsumption),
              escapeValue(row.customSensor),
            ].join(",")
          );

        const csv = [headers.join(","), ...rows].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const downloadUrl = window.URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = downloadUrl;
        anchor.download = "sensor-data.csv";
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        window.URL.revokeObjectURL(downloadUrl);
      } catch (error) {
        console.error("Failed to export dummy history", error);
        setHistoryError("Tidak ada data untuk diekspor.");
      } finally {
        setIsExportingHistory(false);
      }
      return;
    }

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
      anchor.download = "sensor-data.csv";
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
  }, [apiBaseUrl, hasBackendError, isUsingDummyData]);

  const handleResetHistoryData = useCallback(async (options = "range") => {
    const params = typeof options === "string" ? { mode: options } : options || {};
    const mode = params.mode ?? "range";
    const rangeOverride = params.range ?? null;

    const confirmation = window.confirm(
      mode === "all"
        ? "Yakin ingin menghapus seluruh data sensor? Tindakan ini tidak dapat dibatalkan."
        : "Yakin ingin menghapus data berdasarkan rentang yang dipilih?"
    );
    if (!confirmation) {
      return;
    }

    if (isUsingDummyData || hasBackendError) {
      setIsResettingHistory(true);
      if (mode === "all") {
        dummyHistoryRef.current = [];
      } else {
        const { start, end } = rangeOverride ?? appliedHistoryFiltersRef.current;
        const startTs = start ? new Date(start).getTime() : Number.NEGATIVE_INFINITY;
        const endTs = end ? new Date(end).getTime() : Number.POSITIVE_INFINITY;

        dummyHistoryRef.current = dummyHistoryRef.current.filter((entry) => {
          const ts = new Date(entry.timestamp).getTime();
          if (Number.isNaN(ts)) return false;
          return ts < startTs || ts > endTs;
        });
      }
      updateDisplaysFromDummy(1, appliedHistoryFiltersRef.current.limit || 20);
      setSensorData(null);
      setIsResettingHistory(false);
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
      const target =
        query && mode !== "all" ? `${apiBaseUrl}/api/sensor-data?${query}` : `${apiBaseUrl}/api/sensor-data`;
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
  }, [apiBaseUrl, fetchChartData, fetchHistory, fetchStats, hasBackendError, isUsingDummyData, updateDisplaysFromDummy]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }, []);

  const handleSendTestData = useCallback(async () => {
    const reading = createRandomReading();
    try {
      const saved = await persistSensorReading(reading);
      latestRecordIdRef.current = saved.id ?? saved.timestamp;
      setSensorData(saved);
      setHasBackendError(false);
      setIsUsingDummyData(false);

      await Promise.all([
        fetchStats(statsRangeRef.current, appliedHistoryFiltersRef.current).catch(() => null),
        fetchHistory(historyPageRef.current, appliedHistoryFiltersRef.current).catch(() => null),
        fetchChartData(appliedHistoryFiltersRef.current).catch(() => null),
      ]);
    } catch (error) {
      console.error("Failed to send test data", error);
      applyDummyReading(reading);
    }
  }, [
    applyDummyReading,
    createRandomReading,
    fetchChartData,
    fetchHistory,
    fetchStats,
    persistSensorReading,
  ]);

  const isDummyMode = isUsingDummyData || hasBackendError;

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
              onSendTestData={handleSendTestData}
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
              onSendTestData={handleSendTestData}
              history={dummyHistoryRef.current.length && isDummyMode ? dummyHistoryRef.current : history}
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
      </Routes>
    </div>
  );
}

export default App;

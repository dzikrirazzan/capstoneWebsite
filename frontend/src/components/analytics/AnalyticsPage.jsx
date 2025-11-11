import { useState, useCallback, useEffect } from "react";
import { ArrowLeft, TrendingUp, Droplet, Heart, Calendar, DollarSign, Gauge, Thermometer, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "../Header";
import { cn, formatDate, formatNumber } from "../../lib/utils";

const COMPARISON_PRESETS = [
  { label: "Hari Ini vs Kemarin", value: "today-yesterday" },
  { label: "Minggu Ini vs Minggu Lalu", value: "week-week" },
  { label: "Bulan Ini vs Bulan Lalu", value: "month-month" },
  { label: "Custom", value: "custom" },
];

const HEALTH_THRESHOLDS = {
  temperature: { ideal: 85, warning: 100, critical: 110 },
  rpm: { idle: 1000, normal: 3500, warning: 5000, critical: 6000 },
  fuelConsumption: { efficient: 8, normal: 12, warning: 15 },
};

function AnalyticsPage({ theme, onToggleTheme }) {
  const navigate = useNavigate();
  const [comparisonMode, setComparisonMode] = useState("today-yesterday");
  const [period1Data, setPeriod1Data] = useState(null);
  const [period2Data, setPeriod2Data] = useState(null);
  const [healthScore, setHealthScore] = useState(null);
  const [fuelMetrics, setFuelMetrics] = useState(null);
  const [loading, setLoading] = useState(false);

  const calculateHealthScore = useCallback((data) => {
    if (!data || data.length === 0) return null;

    let score = 100;
    let issues = [];

    // Temperature analysis
    const avgTemp = data.reduce((sum, d) => sum + d.temperature, 0) / data.length;
    const maxTemp = Math.max(...data.map(d => d.temperature));
    
    if (maxTemp > HEALTH_THRESHOLDS.temperature.critical) {
      score -= 25;
      issues.push({ severity: "critical", message: "Suhu kritikal terdeteksi", icon: Thermometer });
    } else if (maxTemp > HEALTH_THRESHOLDS.temperature.warning) {
      score -= 15;
      issues.push({ severity: "warning", message: "Suhu sering tinggi", icon: Thermometer });
    }

    // RPM analysis
    const avgRpm = data.reduce((sum, d) => sum + d.rpm, 0) / data.length;
    const overRevCount = data.filter(d => d.rpm > HEALTH_THRESHOLDS.rpm.warning).length;
    
    if (overRevCount > data.length * 0.3) {
      score -= 20;
      issues.push({ severity: "warning", message: "Sering over-revving", icon: Gauge });
    }

    // Fuel consumption analysis
    const avgFuel = data.reduce((sum, d) => sum + d.fuelConsumption, 0) / data.length;
    
    if (avgFuel > HEALTH_THRESHOLDS.fuelConsumption.warning) {
      score -= 10;
      issues.push({ severity: "warning", message: "Konsumsi BBM tinggi", icon: Droplet });
    }

    // Stability analysis
    const tempVariance = data.reduce((sum, d) => sum + Math.pow(d.temperature - avgTemp, 2), 0) / data.length;
    const rpmVariance = data.reduce((sum, d) => sum + Math.pow(d.rpm - avgRpm, 2), 0) / data.length;
    
    if (tempVariance > 100 || rpmVariance > 1000000) {
      score -= 10;
      issues.push({ severity: "info", message: "Performa tidak stabil", icon: Activity });
    }

    score = Math.max(0, Math.min(100, score));

    let rating = "Excellent";
    let color = "text-green-500";
    if (score < 90) { rating = "Good"; color = "text-blue-500"; }
    if (score < 75) { rating = "Fair"; color = "text-yellow-500"; }
    if (score < 60) { rating = "Poor"; color = "text-orange-500"; }
    if (score < 40) { rating = "Critical"; color = "text-red-500"; }

    return {
      score: Math.round(score),
      rating,
      color,
      issues,
      metrics: {
        avgTemp: avgTemp.toFixed(1),
        maxTemp: maxTemp.toFixed(1),
        avgRpm: Math.round(avgRpm),
        avgFuel: avgFuel.toFixed(2),
      }
    };
  }, []);

  const calculateFuelMetrics = useCallback((data, fuelPrice = 15000) => {
    if (!data || data.length === 0) return null;

    const totalFuel = data.reduce((sum, d) => sum + d.fuelConsumption, 0);
    const avgFuel = totalFuel / data.length;
    const minFuel = Math.min(...data.map(d => d.fuelConsumption));
    const maxFuel = Math.max(...data.map(d => d.fuelConsumption));

    // Estimate distance (assuming average speed correlates with RPM)
    const avgRpm = data.reduce((sum, d) => sum + d.rpm, 0) / data.length;
    const estimatedSpeed = avgRpm / 100; // Rough estimation: RPM/100 = km/h
    const durationHours = data.length / 12; // Assuming 5-min intervals
    const estimatedDistance = estimatedSpeed * durationHours;

    const fuelPerKm = avgFuel / estimatedSpeed;
    const totalCost = (totalFuel * fuelPrice) / 1000; // Convert L to liters
    const costPerKm = fuelPerKm * fuelPrice / 1000;

    let efficiency = "Excellent";
    let efficiencyColor = "text-green-500";
    if (avgFuel > HEALTH_THRESHOLDS.fuelConsumption.efficient) {
      efficiency = "Good";
      efficiencyColor = "text-blue-500";
    }
    if (avgFuel > HEALTH_THRESHOLDS.fuelConsumption.normal) {
      efficiency = "Fair";
      efficiencyColor = "text-yellow-500";
    }
    if (avgFuel > HEALTH_THRESHOLDS.fuelConsumption.warning) {
      efficiency = "Poor";
      efficiencyColor = "text-red-500";
    }

    return {
      avgConsumption: avgFuel.toFixed(2),
      minConsumption: minFuel.toFixed(2),
      maxConsumption: maxFuel.toFixed(2),
      totalFuel: totalFuel.toFixed(2),
      fuelPerKm: fuelPerKm.toFixed(3),
      estimatedDistance: estimatedDistance.toFixed(1),
      totalCost: totalCost.toFixed(0),
      costPerKm: costPerKm.toFixed(0),
      efficiency,
      efficiencyColor,
    };
  }, []);

  const fetchComparisonData = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      let period1Start, period1End, period2Start, period2End;

      if (comparisonMode === "today-yesterday") {
        period1Start = new Date(now.setHours(0, 0, 0, 0));
        period1End = new Date();
        period2Start = new Date(period1Start.getTime() - 24 * 60 * 60 * 1000);
        period2End = new Date(period1End.getTime() - 24 * 60 * 60 * 1000);
      } else if (comparisonMode === "week-week") {
        const dayOfWeek = now.getDay();
        period1Start = new Date(now.setDate(now.getDate() - dayOfWeek));
        period1Start.setHours(0, 0, 0, 0);
        period1End = new Date();
        period2Start = new Date(period1Start.getTime() - 7 * 24 * 60 * 60 * 1000);
        period2End = new Date(period1End.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      // Fetch period 1 data
      const response1 = await fetch(
        `/api/sensor-data/series?start=${period1Start.toISOString()}&end=${period1End.toISOString()}&limit=500`
      );
      const data1 = await response1.json();
      setPeriod1Data(data1.data || []);

      // Fetch period 2 data
      const response2 = await fetch(
        `/api/sensor-data/series?start=${period2Start.toISOString()}&end=${period2End.toISOString()}&limit=500`
      );
      const data2 = await response2.json();
      setPeriod2Data(data2.data || []);

      // Calculate metrics
      if (data1.data && data1.data.length > 0) {
        setHealthScore(calculateHealthScore(data1.data));
        setFuelMetrics(calculateFuelMetrics(data1.data));
      }
    } catch (error) {
      console.error("Failed to fetch comparison data:", error);
    } finally {
      setLoading(false);
    }
  }, [comparisonMode, calculateHealthScore, calculateFuelMetrics]);

  useEffect(() => {
    fetchComparisonData();
  }, [fetchComparisonData]);

  const calculateComparison = (metric) => {
    if (!period1Data || !period2Data || period1Data.length === 0 || period2Data.length === 0) {
      return { value: "—", change: 0, trend: "neutral" };
    }

    const avg1 = period1Data.reduce((sum, d) => sum + d[metric], 0) / period1Data.length;
    const avg2 = period2Data.reduce((sum, d) => sum + d[metric], 0) / period2Data.length;
    const change = ((avg1 - avg2) / avg2) * 100;
    
    let trend = "neutral";
    if (change > 5) trend = "up";
    if (change < -5) trend = "down";

    return {
      value: avg1.toFixed(metric === "rpm" ? 0 : metric === "fuelConsumption" ? 2 : 1),
      change: change.toFixed(1),
      trend,
    };
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Header theme={theme} onToggleTheme={onToggleTheme} />
      
      <div className="container mx-auto space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="rounded-lg p-2 transition hover:bg-[var(--bg-card)]"
          >
            <ArrowLeft className="h-6 w-6 text-[var(--text-muted)]" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Analisis Performa</h1>
            <p className="text-sm text-[var(--text-muted)]">Analisis mendalam dari data sensor kendaraan</p>
          </div>
        </div>

        {/* Engine Health Score */}
        {healthScore && (
          <div className="card-container p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-lg bg-[var(--accent-soft)] p-2">
                <Heart className="h-6 w-6 text-[var(--accent)]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[var(--text-primary)]">Skor Kesehatan Mesin</h2>
                <p className="text-sm text-[var(--text-muted)]">Evaluasi kondisi mesin berdasarkan data sensor</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Score Display */}
              <div className="flex flex-col items-center justify-center p-6 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)]">
                <div className={cn("text-6xl font-bold mb-2", healthScore.color)}>
                  {healthScore.score}
                </div>
                <div className="text-sm text-[var(--text-muted)] mb-1">out of 100</div>
                <div className={cn("text-lg font-semibold", healthScore.color)}>
                  {healthScore.rating}
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)]">
                  <p className="text-xs text-[var(--text-muted)] mb-1">Avg Temp</p>
                  <p className="text-2xl font-bold text-[var(--text-secondary)]">{healthScore.metrics.avgTemp}°C</p>
                </div>
                <div className="p-4 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)]">
                  <p className="text-xs text-[var(--text-muted)] mb-1">Max Temp</p>
                  <p className="text-2xl font-bold text-[var(--text-secondary)]">{healthScore.metrics.maxTemp}°C</p>
                </div>
                <div className="p-4 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)]">
                  <p className="text-xs text-[var(--text-muted)] mb-1">Avg RPM</p>
                  <p className="text-2xl font-bold text-[var(--text-secondary)]">{healthScore.metrics.avgRpm}</p>
                </div>
                <div className="p-4 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)]">
                  <p className="text-xs text-[var(--text-muted)] mb-1">Avg Fuel</p>
                  <p className="text-2xl font-bold text-[var(--text-secondary)]">{healthScore.metrics.avgFuel} L/h</p>
                </div>
              </div>

              {/* Issues */}
              <div className="p-4 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)]">
                <h3 className="font-semibold text-[var(--text-primary)] mb-3">Temuan</h3>
                {healthScore.issues.length === 0 ? (
                  <p className="text-sm text-green-500">✓ Semua sistem normal</p>
                ) : (
                  <div className="space-y-2">
                    {healthScore.issues.map((issue, index) => {
                      const Icon = issue.icon;
                      return (
                        <div key={index} className="flex items-start gap-2">
                          <Icon className={cn("h-4 w-4 mt-0.5", 
                            issue.severity === "critical" ? "text-red-500" :
                            issue.severity === "warning" ? "text-yellow-500" :
                            "text-blue-500"
                          )} />
                          <span className="text-sm text-[var(--text-muted)]">{issue.message}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Fuel Efficiency */}
        {fuelMetrics && (
          <div className="card-container p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-lg bg-green-500/10 p-2">
                <Droplet className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[var(--text-primary)]">Efisiensi Bahan Bakar</h2>
                <p className="text-sm text-[var(--text-muted)]">Analisis konsumsi dan biaya operasional</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)]">
                <div className="flex items-center gap-2 mb-2">
                  <Droplet className="h-4 w-4 text-[var(--text-muted)]" />
                  <p className="text-xs text-[var(--text-muted)]">Konsumsi Rata-rata</p>
                </div>
                <p className="text-2xl font-bold text-[var(--text-secondary)]">{fuelMetrics.avgConsumption} L/h</p>
                <p className={cn("text-xs mt-1", fuelMetrics.efficiencyColor)}>{fuelMetrics.efficiency}</p>
              </div>

              <div className="p-4 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)]">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-[var(--text-muted)]" />
                  <p className="text-xs text-[var(--text-muted)]">Konsumsi per KM</p>
                </div>
                <p className="text-2xl font-bold text-[var(--text-secondary)]">{fuelMetrics.fuelPerKm} L/km</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">Est. {fuelMetrics.estimatedDistance} km</p>
              </div>

              <div className="p-4 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)]">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-[var(--text-muted)]" />
                  <p className="text-xs text-[var(--text-muted)]">Total Biaya</p>
                </div>
                <p className="text-2xl font-bold text-[var(--text-secondary)]">Rp {fuelMetrics.totalCost}</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">{fuelMetrics.totalFuel} Liter total</p>
              </div>

              <div className="p-4 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)]">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-[var(--text-muted)]" />
                  <p className="text-xs text-[var(--text-muted)]">Biaya per KM</p>
                </div>
                <p className="text-2xl font-bold text-[var(--text-secondary)]">Rp {fuelMetrics.costPerKm}</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">Estimasi</p>
              </div>
            </div>
          </div>
        )}

        {/* Data Comparison */}
        <div className="card-container p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/10 p-2">
                <Calendar className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[var(--text-primary)]">Perbandingan Data</h2>
                <p className="text-sm text-[var(--text-muted)]">Bandingkan performa di periode berbeda</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {COMPARISON_PRESETS.slice(0, 3).map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => setComparisonMode(preset.value)}
                  disabled={loading}
                  className={cn(
                    "rounded-lg px-4 py-2 text-sm transition",
                    preset.value === comparisonMode
                      ? "bg-[var(--accent)] text-white"
                      : "border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:border-[var(--accent)]/60"
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <p className="text-center text-[var(--text-muted)] py-8">Memuat data perbandingan...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { key: "rpm", label: "RPM", unit: "RPM", icon: Gauge },
                { key: "torque", label: "Torsi", unit: "Nm", icon: Activity },
                { key: "temperature", label: "Suhu", unit: "°C", icon: Thermometer },
                { key: "fuelConsumption", label: "Konsumsi BBM", unit: "L/h", icon: Droplet },
              ].map((metric) => {
                const comparison = calculateComparison(metric.key);
                const Icon = metric.icon;
                
                return (
                  <div key={metric.key} className="p-4 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)]">
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className="h-4 w-4 text-[var(--text-muted)]" />
                      <p className="text-sm text-[var(--text-muted)]">{metric.label}</p>
                    </div>
                    
                    <p className="text-3xl font-bold text-[var(--text-secondary)] mb-2">
                      {comparison.value} <span className="text-sm font-normal text-[var(--text-muted)]">{metric.unit}</span>
                    </p>
                    
                    {comparison.change !== 0 && (
                      <div className={cn(
                        "flex items-center gap-1 text-sm",
                        comparison.trend === "up" ? "text-red-500" : 
                        comparison.trend === "down" ? "text-green-500" : 
                        "text-[var(--text-muted)]"
                      )}>
                        <TrendingUp className={cn("h-4 w-4", comparison.trend === "down" && "rotate-180")} />
                        <span>{Math.abs(parseFloat(comparison.change))}% vs periode sebelumnya</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AnalyticsPage;

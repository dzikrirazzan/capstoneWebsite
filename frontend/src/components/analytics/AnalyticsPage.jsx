import { useState, useCallback, useEffect } from "react";
import { TrendingUp, Droplet, Heart, Calendar, DollarSign, Gauge, Thermometer, Activity, Wind, Clock } from "lucide-react";
import Header from "../Header";
import { cn, formatNumber } from "../../lib/utils";

const COMPARISON_PRESETS = [
  { label: "Hari Ini vs Kemarin", value: "today-yesterday" },
  { label: "Minggu Ini vs Minggu Lalu", value: "week-week" },
  { label: "Bulan Ini vs Bulan Lalu", value: "month-month" },
  { label: "Custom", value: "custom" },
];

const HEALTH_THRESHOLDS = {
  temperature: { ideal: 85, warning: 100, critical: 110 },
  rpm: { idle: 1000, normal: 3500, warning: 5000, critical: 6000 },
  torque: { low: 100, normal: 200, high: 300 },
  maf: { low: 20, normal: 50, high: 80 },
  fuelConsumption: { efficient: 8, normal: 12, warning: 15 },
};

function AnalyticsPage({ theme, onToggleTheme }) {
  const [comparisonMode, setComparisonMode] = useState("today-yesterday");
  const [customPeriod1, setCustomPeriod1] = useState({ start: "", end: "" });
  const [customPeriod2, setCustomPeriod2] = useState({ start: "", end: "" });
  const [period1Data, setPeriod1Data] = useState(null);
  const [period2Data, setPeriod2Data] = useState(null);
  const [healthScore, setHealthScore] = useState(null);
  const [fuelMetrics, setFuelMetrics] = useState(null);
  const [loading, setLoading] = useState(false);

  const calculateHealthScore = useCallback((data) => {
    if (!data || data.length === 0) return null;

    let score = 100;
    let issues = [];
    let deductions = []; // Track all deductions for explanation

    // Temperature analysis (20 points max)
    const avgTemp = data.reduce((sum, d) => sum + d.temperature, 0) / data.length;
    const maxTemp = Math.max(...data.map((d) => d.temperature));
    const minTemp = Math.min(...data.map((d) => d.temperature));

    if (maxTemp > HEALTH_THRESHOLDS.temperature.critical) {
      score -= 20;
      deductions.push({ points: 20, reason: "Suhu Mesin" });
      issues.push({ 
        severity: "critical", 
        message: `Suhu kritikal ${maxTemp.toFixed(1)}°C (>110°C) - Risiko overheat, perlu pendinginan segera! [-20 poin]`, 
        icon: Thermometer 
      });
    } else if (maxTemp > HEALTH_THRESHOLDS.temperature.warning) {
      score -= 10;
      deductions.push({ points: 10, reason: "Suhu Mesin" });
      issues.push({ 
        severity: "warning", 
        message: `Suhu tinggi ${maxTemp.toFixed(1)}°C (>100°C) - Periksa sistem pendingin dan radiator [-10 poin]`, 
        icon: Thermometer 
      });
    }

    // RPM analysis (15 points max)
    const avgRpm = data.reduce((sum, d) => sum + d.rpm, 0) / data.length;
    const maxRpm = Math.max(...data.map((d) => d.rpm));
    const overRevCount = data.filter((d) => d.rpm > HEALTH_THRESHOLDS.rpm.warning).length;
    const overRevPercentage = (overRevCount / data.length * 100).toFixed(1);

    if (maxRpm > HEALTH_THRESHOLDS.rpm.critical) {
      score -= 15;
      deductions.push({ points: 15, reason: "RPM Ekstrem" });
      issues.push({ 
        severity: "critical", 
        message: `Over-revving ekstrem ${maxRpm} RPM (>6000) - Risiko kerusakan mesin! [-15 poin]`, 
        icon: Gauge 
      });
    } else if (overRevCount > data.length * 0.2) {
      score -= 10;
      deductions.push({ points: 10, reason: "RPM Tinggi" });
      issues.push({ 
        severity: "warning", 
        message: `RPM sering >5000 (${overRevPercentage}% waktu, max: ${maxRpm}) - Kurangi akselerasi agresif [-10 poin]`, 
        icon: Gauge 
      });
    }

    // Torque analysis (20 points max)
    const avgTorque = data.reduce((sum, d) => sum + d.torque, 0) / data.length;
    const maxTorque = Math.max(...data.map((d) => d.torque));

    if (maxTorque > HEALTH_THRESHOLDS.torque.high) {
      score -= 5;
      deductions.push({ points: 5, reason: "Torsi Tinggi" });
      issues.push({ 
        severity: "info", 
        message: `Torsi tinggi ${maxTorque.toFixed(1)} Nm (>300) - Beban kerja berat, perhatikan transmisi [-5 poin]`, 
        icon: Activity 
      });
    }
    if (avgTorque < HEALTH_THRESHOLDS.torque.low) {
      score -= 10;
      deductions.push({ points: 10, reason: "Performa Torsi" });
      issues.push({ 
        severity: "warning", 
        message: `Torsi rendah ${avgTorque.toFixed(1)} Nm (<100) - Performa lemah, periksa busi & filter udara [-10 poin]`, 
        icon: Activity 
      });
    }

    // MAF analysis (15 points max)
    const avgMaf = data.reduce((sum, d) => sum + d.maf, 0) / data.length;
    const mafVariance = data.reduce((sum, d) => sum + Math.pow(d.maf - avgMaf, 2), 0) / data.length;

    if (mafVariance > 500) {
      score -= 10;
      deductions.push({ points: 10, reason: "Aliran Udara" });
      issues.push({ 
        severity: "warning", 
        message: `Aliran udara tidak stabil (variance: ${mafVariance.toFixed(0)}) - Bersihkan/ganti MAF sensor [-10 poin]`, 
        icon: Wind 
      });
    }

    // Fuel consumption analysis (10 points max)
    const avgFuel = data.reduce((sum, d) => sum + d.fuelConsumption, 0) / data.length;

    if (avgFuel > HEALTH_THRESHOLDS.fuelConsumption.warning) {
      score -= 10;
      deductions.push({ points: 10, reason: "Konsumsi BBM" });
      issues.push({ 
        severity: "warning", 
        message: `Konsumsi BBM boros ${avgFuel.toFixed(2)} L/h (>15) - Periksa injektor & gaya berkendara [-10 poin]`, 
        icon: Droplet 
      });
    }

    score = Math.max(0, Math.min(100, score));

    let rating = "Excellent";
    let color = "text-green-500";
    let explanation = "";
    
    if (score >= 90) {
      rating = "Excellent";
      color = "text-green-500";
      explanation = "Mesin dalam kondisi sangat baik! Semua parameter optimal.";
    } else if (score >= 75) {
      rating = "Good";
      color = "text-blue-500";
      explanation = "Kondisi mesin baik, ada beberapa area yang perlu perhatian.";
    } else if (score >= 60) {
      rating = "Fair";
      color = "text-yellow-500";
      explanation = "Kondisi mesin cukup, perlu perawatan segera.";
    } else if (score >= 40) {
      rating = "Poor";
      color = "text-orange-500";
      explanation = "Kondisi mesin buruk, segera lakukan servis!";
    } else {
      rating = "Critical";
      color = "text-red-500";
      explanation = "Kondisi mesin kritis! Hentikan penggunaan dan servis sekarang!";
    }

    // Calculate total deductions
    const totalDeducted = deductions.reduce((sum, d) => sum + d.points, 0);

    return {
      score: Math.round(score),
      rating,
      color,
      explanation,
      totalDeducted,
      deductions,
      issues,
      metrics: {
        avgTemp: avgTemp.toFixed(1),
        maxTemp: maxTemp.toFixed(1),
        minTemp: minTemp.toFixed(1),
        avgRpm: Math.round(avgRpm),
        maxRpm: Math.round(maxRpm),
        avgTorque: avgTorque.toFixed(1),
        avgMaf: avgMaf.toFixed(1),
        avgFuel: avgFuel.toFixed(2),
      },
    };
  }, []);

  const calculateFuelMetrics = useCallback((data, fuelPrice = 12200) => {
    if (!data || data.length === 0) return null;

    const totalFuel = data.reduce((sum, d) => sum + d.fuelConsumption, 0);
    const avgFuel = totalFuel / data.length;
    const minFuel = Math.min(...data.map((d) => d.fuelConsumption));
    const maxFuel = Math.max(...data.map((d) => d.fuelConsumption));

    // Duration in hours (assuming 5-min intervals)
    const durationHours = (data.length * 5) / 60;
    const totalCost = (totalFuel * fuelPrice) / 1000;
    const costPerHour = totalCost / durationHours;

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
      durationHours: durationHours.toFixed(1),
      totalCost: totalCost.toFixed(0),
      costPerHour: costPerHour.toFixed(0),
      efficiency,
      efficiencyColor,
    };
  }, []);

  const fetchComparisonData = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      let period1Start, period1End, period2Start, period2End;

      if (comparisonMode === "custom") {
        if (!customPeriod1.start || !customPeriod1.end || !customPeriod2.start || !customPeriod2.end) {
          setLoading(false);
          return;
        }
        period1Start = new Date(customPeriod1.start);
        period1End = new Date(customPeriod1.end);
        period2Start = new Date(customPeriod2.start);
        period2End = new Date(customPeriod2.end);
      } else if (comparisonMode === "today-yesterday") {
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
      } else if (comparisonMode === "month-month") {
        period1Start = new Date(now.getFullYear(), now.getMonth(), 1);
        period1End = new Date();
        period2Start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        period2End = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      }

      // Fetch period 1 data
      const response1 = await fetch(`/api/sensor-data/series?start=${period1Start.toISOString()}&end=${period1End.toISOString()}&limit=1000`);
      const data1 = await response1.json();
      setPeriod1Data(data1.data || []);

      // Fetch period 2 data
      const response2 = await fetch(`/api/sensor-data/series?start=${period2Start.toISOString()}&end=${period2End.toISOString()}&limit=1000`);
      const data2 = await response2.json();
      setPeriod2Data(data2.data || []);

      // Calculate metrics from period 1
      if (data1.data && data1.data.length > 0) {
        setHealthScore(calculateHealthScore(data1.data));
        setFuelMetrics(calculateFuelMetrics(data1.data));
      }
    } catch (error) {
      console.error("Failed to fetch comparison data:", error);
    } finally {
      setLoading(false);
    }
  }, [comparisonMode, customPeriod1, customPeriod2, calculateHealthScore, calculateFuelMetrics]);

  useEffect(() => {
    if (comparisonMode !== "custom") {
      fetchComparisonData();
    }
  }, [comparisonMode, fetchComparisonData]);

  const handleCustomCompare = () => {
    if (customPeriod1.start && customPeriod1.end && customPeriod2.start && customPeriod2.end) {
      fetchComparisonData();
    }
  };

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
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Analisis Performa</h1>
          <p className="text-sm text-[var(--text-muted)]">Analisis mendalam dari data sensor kendaraan</p>
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
                <p className="text-sm text-[var(--text-muted)]">Evaluasi kondisi mesin berdasarkan data sensor (Temperature, RPM, Torque, MAF, Fuel)</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Score Display */}
              <div className="flex flex-col items-center justify-center p-6 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)]">
                <div className={cn("text-6xl font-bold mb-2", healthScore.color)}>{healthScore.score}</div>
                <div className="text-sm text-[var(--text-muted)] mb-1">dari 100 poin</div>
                <div className={cn("text-lg font-semibold mb-3", healthScore.color)}>{healthScore.rating}</div>
                <p className="text-xs text-center text-[var(--text-muted)]">{healthScore.explanation}</p>
                {healthScore.totalDeducted > 0 && (
                  <div className="mt-3 pt-3 border-t border-[var(--border-color)] w-full">
                    <p className="text-xs text-center text-[var(--text-muted)]">
                      Total pengurangan: <span className="text-red-500 font-semibold">-{healthScore.totalDeducted} poin</span>
                    </p>
                  </div>
                )}
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
                  <p className="text-xs text-[var(--text-muted)] mb-1">Avg Torque</p>
                  <p className="text-2xl font-bold text-[var(--text-secondary)]">{healthScore.metrics.avgTorque} Nm</p>
                </div>
                <div className="p-4 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)]">
                  <p className="text-xs text-[var(--text-muted)] mb-1">Avg MAF</p>
                  <p className="text-2xl font-bold text-[var(--text-secondary)]">{healthScore.metrics.avgMaf} g/s</p>
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
                          <Icon className={cn("h-4 w-4 mt-0.5", issue.severity === "critical" ? "text-red-500" : issue.severity === "warning" ? "text-yellow-500" : "text-blue-500")} />
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
                <p className="text-sm text-[var(--text-muted)]">Analisis konsumsi dan biaya operasional (Pertamax RON 92 - Rp 12.200/L)</p>
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
                  <Clock className="h-4 w-4 text-[var(--text-muted)]" />
                  <p className="text-xs text-[var(--text-muted)]">Total Durasi</p>
                </div>
                <p className="text-2xl font-bold text-[var(--text-secondary)]">{fuelMetrics.durationHours} jam</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">{fuelMetrics.totalFuel} L total</p>
              </div>

              <div className="p-4 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)]">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-[var(--text-muted)]" />
                  <p className="text-xs text-[var(--text-muted)]">Total Biaya</p>
                </div>
                <p className="text-2xl font-bold text-[var(--text-secondary)]">Rp {fuelMetrics.totalCost}</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">Total periode</p>
              </div>

              <div className="p-4 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)]">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-[var(--text-muted)]" />
                  <p className="text-xs text-[var(--text-muted)]">Biaya per Jam</p>
                </div>
                <p className="text-2xl font-bold text-[var(--text-secondary)]">Rp {fuelMetrics.costPerHour}</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">Rata-rata</p>
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
              {COMPARISON_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => setComparisonMode(preset.value)}
                  disabled={loading}
                  className={cn(
                    "rounded-lg px-4 py-2 text-sm transition",
                    preset.value === comparisonMode ? "bg-[var(--accent)] text-white" : "border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:border-[var(--accent)]/60"
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Picker */}
          {comparisonMode === "custom" && (
            <div className="mb-6 p-4 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Periode 1</h3>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-[var(--text-muted)]">Dari</label>
                      <input
                        type="datetime-local"
                        value={customPeriod1.start}
                        onChange={(e) => setCustomPeriod1({ ...customPeriod1, start: e.target.value })}
                        className="w-full mt-1 px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-secondary)]"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[var(--text-muted)]">Sampai</label>
                      <input
                        type="datetime-local"
                        value={customPeriod1.end}
                        onChange={(e) => setCustomPeriod1({ ...customPeriod1, end: e.target.value })}
                        className="w-full mt-1 px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-secondary)]"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Periode 2</h3>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-[var(--text-muted)]">Dari</label>
                      <input
                        type="datetime-local"
                        value={customPeriod2.start}
                        onChange={(e) => setCustomPeriod2({ ...customPeriod2, start: e.target.value })}
                        className="w-full mt-1 px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-secondary)]"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[var(--text-muted)]">Sampai</label>
                      <input
                        type="datetime-local"
                        value={customPeriod2.end}
                        onChange={(e) => setCustomPeriod2({ ...customPeriod2, end: e.target.value })}
                        className="w-full mt-1 px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-secondary)]"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={handleCustomCompare}
                disabled={loading || !customPeriod1.start || !customPeriod1.end || !customPeriod2.start || !customPeriod2.end}
                className="mt-4 w-full px-4 py-2 rounded-lg bg-[var(--accent)] text-white transition hover:opacity-90 disabled:opacity-50"
              >
                Bandingkan
              </button>
            </div>
          )}

          {loading ? (
            <p className="text-center text-[var(--text-muted)] py-8">Memuat data perbandingan...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { key: "rpm", label: "RPM", unit: "RPM", icon: Gauge },
                { key: "torque", label: "Torsi", unit: "Nm", icon: Activity },
                { key: "temperature", label: "Suhu", unit: "°C", icon: Thermometer },
                { key: "maf", label: "MAF", unit: "g/s", icon: Wind },
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
                      <div className={cn("flex items-center gap-1 text-sm", comparison.trend === "up" ? "text-red-500" : comparison.trend === "down" ? "text-green-500" : "text-[var(--text-muted)]")}>
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

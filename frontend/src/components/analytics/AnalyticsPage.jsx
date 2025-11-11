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
    let positives = []; // Track positive aspects

    // Temperature analysis (20 points max)
    const avgTemp = data.reduce((sum, d) => sum + d.temperature, 0) / data.length;
    const maxTemp = Math.max(...data.map((d) => d.temperature));
    const minTemp = Math.min(...data.map((d) => d.temperature));

    if (maxTemp > HEALTH_THRESHOLDS.temperature.critical) {
      score -= 20;
      deductions.push({ points: 20, reason: "Suhu Mesin Kritikal" });
      issues.push({
        severity: "critical",
        message: `🔴 KRITIS: Suhu ${maxTemp.toFixed(1)}°C melampaui batas aman (>110°C) - Risiko overheat & kerusakan komponen! Segera matikan mesin dan periksa radiator/coolant. [-20 poin dari aspek Suhu]`,
        icon: Thermometer,
      });
    } else if (maxTemp > HEALTH_THRESHOLDS.temperature.warning) {
      score -= 10;
      deductions.push({ points: 10, reason: "Suhu Mesin Tinggi" });
      issues.push({
        severity: "warning",
        message: `🟡 PERINGATAN: Suhu ${maxTemp.toFixed(1)}°C cukup tinggi (>100°C) - Sistem pendingin kurang optimal. Periksa kondisi radiator, water pump, dan thermostat. [-10 dari 20 poin aspek Suhu, tersisa +10 poin]`,
        icon: Thermometer,
      });
      positives.push({ points: 10, reason: "Suhu masih dalam batas toleransi (belum kritikal)" });
    } else if (avgTemp >= HEALTH_THRESHOLDS.temperature.ideal - 10 && avgTemp <= HEALTH_THRESHOLDS.temperature.ideal + 10) {
      positives.push({
        points: 20,
        reason: `Suhu ideal ${avgTemp.toFixed(1)}°C (target: ${HEALTH_THRESHOLDS.temperature.ideal}°C ±10°C) - Sistem pendingin bekerja sempurna!`,
        category: "Suhu Mesin",
      });
    } else {
      positives.push({
        points: 20,
        reason: `Suhu normal ${avgTemp.toFixed(1)}°C (max: ${maxTemp.toFixed(1)}°C, di bawah ${HEALTH_THRESHOLDS.temperature.warning}°C)`,
        category: "Suhu Mesin",
      });
    }

    // RPM analysis (15 points max)
    const avgRpm = data.reduce((sum, d) => sum + d.rpm, 0) / data.length;
    const maxRpm = Math.max(...data.map((d) => d.rpm));
    const overRevCount = data.filter((d) => d.rpm > HEALTH_THRESHOLDS.rpm.warning).length;
    const overRevPercentage = ((overRevCount / data.length) * 100).toFixed(1);

    if (maxRpm > HEALTH_THRESHOLDS.rpm.critical) {
      score -= 15;
      deductions.push({ points: 15, reason: "Over-revving Ekstrem" });
      issues.push({
        severity: "critical",
        message: `🔴 KRITIS: RPM mencapai ${maxRpm} (>6000) - Risiko valve float & kerusakan piston! Ganti oli segera, hindari akselerasi maksimal. [-15 poin dari aspek RPM]`,
        icon: Gauge,
      });
    } else if (overRevCount > data.length * 0.2) {
      score -= 10;
      deductions.push({ points: 10, reason: "RPM Sering Tinggi" });
      issues.push({
        severity: "warning",
        message: `🟡 PERINGATAN: RPM >5000 terjadi ${overRevPercentage}% waktu (max: ${maxRpm}) - Gaya berkendara terlalu agresif, mempercepat keausan mesin. Gunakan gigi lebih tinggi & kurangi akselerasi mendadak. [-10 dari 15 poin aspek RPM, tersisa +5 poin]`,
        icon: Gauge,
      });
      positives.push({ points: 5, reason: "RPM belum mencapai zona berbahaya (masih di bawah 6000)" });
    } else if (avgRpm >= HEALTH_THRESHOLDS.rpm.idle && avgRpm <= HEALTH_THRESHOLDS.rpm.normal) {
      positives.push({
        points: 15,
        reason: `RPM stabil ${avgRpm} (range ideal: ${HEALTH_THRESHOLDS.rpm.idle}-${HEALTH_THRESHOLDS.rpm.normal}) - Gaya berkendara efisien & ekonomis!`,
        category: "Performa RPM",
      });
    } else {
      positives.push({
        points: 15,
        reason: `RPM aman (avg: ${avgRpm}, max: ${maxRpm}, jarang >5000)`,
        category: "Performa RPM",
      });
    }

    // Torque analysis (20 points max)
    const avgTorque = data.reduce((sum, d) => sum + d.torque, 0) / data.length;
    const maxTorque = Math.max(...data.map((d) => d.torque));

    if (maxTorque > HEALTH_THRESHOLDS.torque.high) {
      score -= 5;
      deductions.push({ points: 5, reason: "Torsi Sangat Tinggi" });
      issues.push({
        severity: "info",
        message: `🔵 INFO: Torsi ${maxTorque.toFixed(1)} Nm (>300) - Beban kerja sangat berat terdeteksi (tanjakan/muatan berat). Perhatikan kondisi transmisi & kopling. [-5 dari 20 poin aspek Torsi, tersisa +15 poin]`,
        icon: Activity,
      });
      positives.push({ points: 15, reason: "Mesin mampu menghasilkan torsi tinggi (power reserve baik)" });
    } else if (avgTorque < HEALTH_THRESHOLDS.torque.low) {
      score -= 10;
      deductions.push({ points: 10, reason: "Torsi Lemah" });
      issues.push({
        severity: "warning",
        message: `🟡 PERINGATAN: Torsi rendah ${avgTorque.toFixed(
          1
        )} Nm (<100) - Tenaga mesin kurang, akselerasi lemah. Kemungkinan: busi aus, filter udara kotor, atau masalah injektor. Servis diperlukan. [-10 dari 20 poin aspek Torsi, tersisa +10 poin]`,
        icon: Activity,
      });
      positives.push({ points: 10, reason: "Mesin masih bisa beroperasi meski performa turun" });
    } else if (avgTorque >= HEALTH_THRESHOLDS.torque.normal - 50 && avgTorque <= HEALTH_THRESHOLDS.torque.normal + 50) {
      positives.push({
        points: 20,
        reason: `Torsi optimal ${avgTorque.toFixed(1)} Nm (target: ${HEALTH_THRESHOLDS.torque.normal} Nm ±50) - Performa mesin sangat baik!`,
        category: "Tenaga Torsi",
      });
    } else {
      positives.push({
        points: 20,
        reason: `Torsi normal ${avgTorque.toFixed(1)} Nm (range sehat: ${HEALTH_THRESHOLDS.torque.low}-${HEALTH_THRESHOLDS.torque.high})`,
        category: "Tenaga Torsi",
      });
    }

    // MAF analysis (15 points max)
    const avgMaf = data.reduce((sum, d) => sum + d.maf, 0) / data.length;
    const mafVariance = data.reduce((sum, d) => sum + Math.pow(d.maf - avgMaf, 2), 0) / data.length;
    const mafStdDev = Math.sqrt(mafVariance);

    if (mafVariance > 500) {
      score -= 10;
      deductions.push({ points: 10, reason: "Aliran Udara Tidak Stabil" });
      issues.push({
        severity: "warning",
        message: `🟡 PERINGATAN: Aliran udara fluktuatif (variance: ${mafVariance.toFixed(0)}, std dev: ${mafStdDev.toFixed(
          1
        )}) - MAF sensor kotor/rusak atau ada kebocoran intake. Bersihkan MAF dengan cleaner khusus atau ganti jika perlu. [-10 dari 15 poin aspek MAF, tersisa +5 poin]`,
        icon: Wind,
      });
      positives.push({ points: 5, reason: "Sensor MAF masih memberikan pembacaan (belum mati total)" });
    } else if (mafVariance < 100) {
      positives.push({
        points: 15,
        reason: `Aliran udara sangat stabil (variance: ${mafVariance.toFixed(0)}) - MAF sensor bersih & intake system rapat!`,
        category: "Sistem Udara (MAF)",
      });
    } else {
      positives.push({
        points: 15,
        reason: `Aliran udara stabil (avg: ${avgMaf.toFixed(1)} g/s, variance: ${mafVariance.toFixed(0)} dalam batas normal)`,
        category: "Sistem Udara (MAF)",
      });
    }

    // Fuel consumption analysis (10 points max)
    const avgFuel = data.reduce((sum, d) => sum + d.fuelConsumption, 0) / data.length;

    if (avgFuel > HEALTH_THRESHOLDS.fuelConsumption.warning) {
      score -= 10;
      deductions.push({ points: 10, reason: "Konsumsi BBM Boros" });
      issues.push({
        severity: "warning",
        message: `🟡 PERINGATAN: Konsumsi ${avgFuel.toFixed(
          2
        )} L/h sangat boros (>15 L/h) - Penyebab: injektor kotor, sensor O2 rusak, atau gaya berkendara agresif. Lakukan tuneup & eco-driving. [-10 dari 10 poin aspek Efisiensi BBM, tersisa 0 poin]`,
        icon: Droplet,
      });
    } else if (avgFuel <= HEALTH_THRESHOLDS.fuelConsumption.efficient) {
      positives.push({
        points: 10,
        reason: `Konsumsi sangat efisien ${avgFuel.toFixed(2)} L/h (≤8 L/h) - Injektor bersih, AFR optimal, gaya berkendara ekonomis!`,
        category: "Efisiensi BBM",
      });
    } else if (avgFuel <= HEALTH_THRESHOLDS.fuelConsumption.normal) {
      positives.push({
        points: 10,
        reason: `Konsumsi normal ${avgFuel.toFixed(2)} L/h (8-12 L/h range standar)`,
        category: "Efisiensi BBM",
      });
    } else {
      positives.push({
        points: 10,
        reason: `Konsumsi masih wajar ${avgFuel.toFixed(2)} L/h (di bawah ${HEALTH_THRESHOLDS.fuelConsumption.warning} L/h)`,
        category: "Efisiensi BBM",
      });
    }

    // Additional stability analysis (20 points bonus)
    const tempStability = data.reduce((sum, d) => sum + Math.pow(d.temperature - avgTemp, 2), 0) / data.length;
    const rpmStability = data.reduce((sum, d) => sum + Math.pow(d.rpm - avgRpm, 2), 0) / data.length;

    if (tempStability < 25 && rpmStability < 100000) {
      positives.push({
        points: 20,
        reason: "Mesin sangat stabil - Suhu & RPM konsisten tanpa fluktuasi berlebihan",
        category: "Stabilitas Mesin (Bonus)",
      });
    } else if (tempStability < 50 && rpmStability < 500000) {
      positives.push({
        points: 20,
        reason: "Mesin cukup stabil - Variasi suhu & RPM dalam batas normal",
        category: "Stabilitas Mesin (Bonus)",
      });
    } else {
      // Deduct stability penalty
      score -= 10;
      deductions.push({ points: 10, reason: "Ketidakstabilan Mesin" });
      issues.push({
        severity: "info",
        message: `🔵 INFO: Fluktuasi parameter terdeteksi (suhu variance: ${tempStability.toFixed(1)}, RPM variance: ${rpmStability.toFixed(
          0
        )}) - Mesin kurang stabil, bisa karena kondisi jalan/beban berubah-ubah. [-10 poin stabilitas, tersisa +10 poin bonus]`,
        icon: Activity,
      });
      positives.push({ points: 10, reason: "Mesin tetap beroperasi meski ada fluktuasi" });
    }

    score = Math.max(0, Math.min(100, score));

    let rating = "Excellent";
    let color = "text-green-500";
    let explanation = "";

    if (score >= 90) {
      rating = "Excellent";
      color = "text-green-500";
      explanation = "Mesin dalam kondisi sangat baik! Semua parameter optimal, perawatan rutin terjaga.";
    } else if (score >= 75) {
      rating = "Good";
      color = "text-blue-500";
      explanation = "Kondisi mesin baik, ada beberapa area yang perlu perhatian minor.";
    } else if (score >= 60) {
      rating = "Fair";
      color = "text-yellow-500";
      explanation = "Kondisi mesin cukup, perlu perawatan segera untuk mencegah kerusakan.";
    } else if (score >= 40) {
      rating = "Poor";
      color = "text-orange-500";
      explanation = "Kondisi mesin buruk, segera lakukan servis comprehensive!";
    } else {
      rating = "Critical";
      color = "text-red-500";
      explanation = "Kondisi mesin kritis! Hentikan penggunaan dan servis sekarang juga!";
    }

    // Calculate total deductions and positives
    const totalDeducted = deductions.reduce((sum, d) => sum + d.points, 0);
    const totalPositive = positives.reduce((sum, p) => sum + p.points, 0);
    const maxPossible = 100; // Base score

    // Generate detailed breakdown
    const breakdown = `Skor dihitung dari ${maxPossible} poin maksimal. ${totalDeducted > 0 ? `Dikurangi ${totalDeducted} poin karena masalah yang terdeteksi.` : "Tidak ada pengurangan poin."} ${
      positives.length > 0 ? `Aspek positif: ${totalPositive} poin dari ${positives.length} kategori optimal.` : ""
    }`;

    return {
      score: Math.round(score),
      rating,
      color,
      explanation,
      breakdown,
      totalDeducted,
      totalPositive,
      deductions,
      positives,
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

              {/* Issues & Positives */}
              <div className="p-4 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] max-h-96 overflow-y-auto">
                <h3 className="font-semibold text-[var(--text-primary)] mb-3">Detail Penilaian</h3>

                {/* Positive Aspects */}
                {healthScore.positives && healthScore.positives.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-green-600 dark:text-green-400 mb-2">✅ ASPEK POSITIF ({healthScore.totalPositive} poin)</h4>
                    <div className="space-y-1.5">
                      {healthScore.positives.map((positive, index) => (
                        <div key={index} className="flex items-start gap-2 p-2 rounded bg-green-500/5 border border-green-500/10">
                          <span className="text-green-500 text-xs mt-0.5">+{positive.points}</span>
                          <div className="flex-1">
                            {positive.category && <p className="text-xs font-semibold text-green-600 dark:text-green-400">{positive.category}</p>}
                            <p className="text-xs text-[var(--text-muted)]">{positive.reason}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Issues/Problems */}
                {healthScore.issues.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-green-500 font-semibold">✓ Tidak ada masalah terdeteksi!</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">Semua sistem dalam kondisi optimal</p>
                  </div>
                ) : (
                  <div>
                    <h4 className="text-xs font-semibold text-red-600 dark:text-red-400 mb-2">⚠️ MASALAH TERDETEKSI (-{healthScore.totalDeducted} poin)</h4>
                    <div className="space-y-2">
                      {healthScore.issues.map((issue, index) => {
                        const Icon = issue.icon;
                        return (
                          <div key={index} className="flex items-start gap-2 p-2 rounded bg-red-500/5 border border-red-500/10">
                            <Icon className={cn("h-4 w-4 mt-0.5 flex-shrink-0", issue.severity === "critical" ? "text-red-500" : issue.severity === "warning" ? "text-yellow-500" : "text-blue-500")} />
                            <span className="text-xs text-[var(--text-muted)] leading-relaxed">{issue.message}</span>
                          </div>
                        );
                      })}
                    </div>
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

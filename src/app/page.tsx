'use client';

import { useState, useEffect } from 'react';
import { useRealtime } from './providers';
import {
  Activity,
  Gauge,
  Droplet,
  Clock,
  CheckCircle2,
  RotateCw,
  AlertTriangle,
  LineChart,
  Calendar,
  BarChart3,
  TrendingUp,
  Zap,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function DashboardPage() {
  const { device, latestTelemetry, activeCycle, alerts, settings, todayStats, theme } = useRealtime();
  const [chartMode, setChartMode] = useState<'today' | 'weekly'>('today');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const isFlowing = latestTelemetry.isFlowing;
  const flowRate = latestTelemetry.flowRate;

  // Volume & Percentage Calculation
  const currentVolume = activeCycle ? activeCycle.totalVolume : settings.tankCapacity;
  const fillPercentage = Math.min(100, Math.round((currentVolume / settings.tankCapacity) * 100));

  // Calculate Tank Status
  const getTankStatus = () => {
    if (isFlowing) return { text: 'Mengisi Air', icon: RotateCw, color: 'text-cyan-600 dark:text-cyan-400', animate: 'animate-spin' };
    const hasActiveAlert = alerts.some((a) => a.status === 'ACTIVE');
    if (hasActiveAlert) return { text: 'Perlu Perhatian', icon: AlertTriangle, color: 'text-amber-600 dark:text-amber-400', animate: 'animate-pulse' };
    if (fillPercentage >= 90) return { text: 'Tandon Penuh', icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', animate: '' };
    return { text: 'Standby Normal', icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', animate: '' };
  };

  const tankStatus = getTankStatus();
  const TankIcon = tankStatus.icon;

  // Hourly Data for Today
  const hourlyData = [
    { time: '00:00', volume: 0, flowRate: 0 },
    { time: '03:00', volume: 120, flowRate: 8.5 },
    { time: '06:00', volume: 380, flowRate: 14.2 },
    { time: '09:00', volume: 250, flowRate: 11.0 },
    { time: '12:00', volume: todayStats.todayVolume > 0 ? Math.round(todayStats.todayVolume * 0.4) : 370, flowRate: flowRate > 0 ? flowRate : 12.5 },
    { time: '15:00', volume: isFlowing ? 280 : 0, flowRate: isFlowing ? flowRate : 0 },
    { time: '18:00', volume: 0, flowRate: 0 },
    { time: '21:00', volume: 0, flowRate: 0 },
  ];

  // 7-day Weekly Data
  const weeklyData = [
    { day: 'Senin', volume: 890, cycleCount: 3 },
    { day: 'Selasa', volume: 1050, cycleCount: 4 },
    { day: 'Rabu', volume: 780, cycleCount: 2 },
    { day: 'Kamis', volume: 1120, cycleCount: 4 },
    { day: 'Jumat', volume: 950, cycleCount: 3 },
    { day: 'Sabtu', volume: 1200, cycleCount: 4 },
    { day: 'Minggu', volume: todayStats.todayVolume > 0 ? todayStats.todayVolume : 1147, cycleCount: todayStats.todayCycleCount > 0 ? todayStats.todayCycleCount : 3 },
  ];

  // Theme styling for charts (Light Mode)
  const gridColor = '#e2e8f0';
  const textColor = '#64748b';
  const tooltipBg = '#ffffff';
  const tooltipBorder = '#cbd5e1';
  const tooltipText = '#0f172a';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Overview */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-6">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
          Dashboard Utama
          <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 font-medium">
            Koneksi Terhubung
          </span>
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Pantau sisa air tandon, kondisi mesin pompa, dan grafik pengisian air hari ini.
        </p>
      </div>

      {/* Main KPI Stat Grid (5 Cards Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {/* Status Pompa */}
        <div className={`glass-panel p-5 rounded-2xl border transition-all duration-300 ${isFlowing ? 'border-cyan-500/50 shadow-cyan-950/50 glow-cyan' : 'border-slate-200 dark:border-slate-800'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Status Pompa</span>
            <div className={`w-3 h-3 rounded-full ${isFlowing ? 'bg-cyan-500 dark:bg-cyan-400 animate-ping' : 'bg-slate-400 dark:bg-slate-600'}`} />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-2xl font-black ${isFlowing ? 'text-cyan-600 dark:text-cyan-300' : 'text-slate-700 dark:text-slate-400'}`}>
              {isFlowing ? 'PUMP ON' : 'PUMP OFF'}
            </span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 flex items-center gap-1.5 truncate">
            <Activity className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
            {isFlowing ? 'Air terdeteksi masuk' : 'Inlet Tutup'}
          </p>
        </div>

        {/* Status Tandon */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Status Tandon</span>
            <TankIcon className={`w-4 h-4 ${tankStatus.color} ${tankStatus.animate}`} />
          </div>
          <div className="mt-3">
            <span className={`text-base font-extrabold block whitespace-nowrap ${tankStatus.color}`}>{tankStatus.text}</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-500"
              style={{ width: `${fillPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-400 mt-1">
            <span>Estimasi</span>
            <span className="font-mono text-cyan-600 dark:text-cyan-400 font-semibold">{fillPercentage}% ({currentVolume}L)</span>
          </div>
        </div>

        {/* Debit Air Saat Ini */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Debit Air Saat Ini</span>
            <Gauge className={`w-4 h-4 text-cyan-600 dark:text-cyan-400 ${isFlowing ? 'animate-pulse' : ''}`} />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-cyan-600 dark:text-cyan-300 font-mono">
              {flowRate.toFixed(1)} <span className="text-xs font-normal text-slate-600 dark:text-slate-400">L/mnt</span>
            </span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 flex items-center gap-1.5 truncate">
            <Activity className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
            {isFlowing ? 'Kecepatan aliran air' : 'Sensor standby'}
          </p>
        </div>

        {/* Air Masuk Hari Ini */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Air Masuk Hari Ini</span>
            <Droplet className="w-4 h-4 text-blue-500 dark:text-blue-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {todayStats.todayVolume > 0 ? todayStats.todayVolume : 1147} <span className="text-xs font-normal text-slate-600 dark:text-slate-400">Liter</span>
            </span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 truncate">
            Dari {todayStats.todayCycleCount > 0 ? todayStats.todayCycleCount : 3} siklus pengisian
          </p>
        </div>

        {/* Durasi Pompa Hari Ini */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Durasi Pompa Hari Ini</span>
            <Clock className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {todayStats.todayDurationMinutes > 0 ? todayStats.todayDurationMinutes : 62} <span className="text-xs font-normal text-slate-600 dark:text-slate-400">menit</span>
            </span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 truncate">Waktu aktif pompa hari ini</p>
        </div>
      </div>

      {/* Main Daily Monitoring Chart Section */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6">
        {/* Section Title & View Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              <LineChart className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              Grafik Pengisian Air Tandon
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Melihat jam berapa saja air mengisi tandon dan seberapa deras aliran airnya.
            </p>
          </div>

          {/* Mode Selector Buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 self-start sm:self-auto">
            <button
              onClick={() => setChartMode('today')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                chartMode === 'today'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Hari Ini (Per Jam)
            </button>
            <button
              onClick={() => setChartMode('weekly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                chartMode === 'weekly'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              7 Hari Terakhir
            </button>
          </div>
        </div>

        {/* Chart Visualization */}
        <div className="h-72 w-full pt-2">
          {isClient ? (
            <ResponsiveContainer width="100%" height="100%">
              {chartMode === 'today' ? (
                <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradientVolume" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="gradientFlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="time" stroke={textColor} fontSize={12} tickLine={false} />
                  <YAxis stroke={textColor} fontSize={12} tickLine={false} unit="L" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: tooltipBg,
                      borderColor: tooltipBorder,
                      borderRadius: '0.75rem',
                      color: tooltipText,
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                    }}
                    formatter={(value: any, name: any) => [
                      name === 'volume' ? `${value} Liter` : `${value} L/menit`,
                      name === 'volume' ? 'Volume Air Masuk' : 'Debit Air',
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="volume"
                    stroke="#06b6d4"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#gradientVolume)"
                    name="volume"
                  />
                  <Area
                    type="monotone"
                    dataKey="flowRate"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    fillOpacity={1}
                    fill="url(#gradientFlow)"
                    name="flowRate"
                  />
                </AreaChart>
              ) : (
                <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradientWeeklyVolume" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="day" stroke={textColor} fontSize={12} tickLine={false} />
                  <YAxis stroke={textColor} fontSize={12} tickLine={false} unit="L" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: tooltipBg,
                      borderColor: tooltipBorder,
                      borderRadius: '0.75rem',
                      color: tooltipText,
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                    }}
                    formatter={(value: any, name: any) => [
                      name === 'volume' ? `${value} Liter` : `${value} Siklus`,
                      name === 'volume' ? 'Total Volume Air' : 'Jumlah Siklus',
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="volume"
                    stroke="#06b6d4"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#gradientWeeklyVolume)"
                    name="volume"
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm">
              Memuat grafik monitoring...
            </div>
          )}
        </div>
      </div>

      {/* Active Alerts Summary */}
      {alerts.filter((a) => a.status === 'ACTIVE').length > 0 && (
        <div className="glass-panel p-5 rounded-2xl border border-amber-500/30 glow-amber">
          <h3 className="text-sm font-bold text-amber-700 dark:text-amber-300 flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 animate-pulse" />
            Alert Aktif ({alerts.filter((a) => a.status === 'ACTIVE').length})
          </h3>
          <div className="space-y-2">
            {alerts
              .filter((a) => a.status === 'ACTIVE')
              .slice(0, 3)
              .map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 p-3 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800"
                >
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold mt-0.5 ${
                      alert.level === 'KRITIS'
                        ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300'
                        : alert.level === 'BAHAYA'
                        ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                        : 'bg-sky-500/20 text-sky-700 dark:text-sky-300'
                    }`}
                  >
                    {alert.level === 'KRITIS' ? 'Cek Segera' : alert.level === 'BAHAYA' ? 'Perlu Diperiksa' : 'Catatan'}
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-200">{alert.title}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{alert.message}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}


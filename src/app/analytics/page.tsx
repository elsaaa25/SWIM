'use client';

import { useState, useEffect } from 'react';
import { useRealtime } from '../providers';
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
  ReferenceLine,
} from 'recharts';
import { Download, Calendar, LineChart, Table, AlertTriangle, CheckCircle } from 'lucide-react';
import { FillingCycleData } from '@/lib/types';

export default function AnalyticsPage() {
  const { recentTelemetries, latestTelemetry, theme } = useRealtime();
  const [cycles, setCycles] = useState<FillingCycleData[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterPeriod, setFilterPeriod] = useState<'7days' | '30days'>('7days');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch Filling Cycles from API
  const fetchCycles = async () => {
    setLoading(true);
    try {
      let url = '/api/cycles';
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.cycles) setCycles(data.cycles);
    } catch (e) {
      console.error('Failed to fetch cycles:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCycles();
  }, [startDate, endDate]);

  // Handle Export CSV
  const handleExportCSV = () => {
    let url = '/api/cycles?format=csv';
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;
    window.open(url, '_blank');
  };

  // Format Telemetry Data for Realtime Chart (Ensure non-empty data)
  const realtimeChartData = recentTelemetries.length > 0
    ? recentTelemetries.map((t) => ({
        time: new Date(t.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        flowRate: t.flowRate,
      }))
    : Array.from({ length: 10 }).map((_, i) => ({
        time: `10:0${i}`,
        flowRate: 0,
      }));

  // Format Cycles Data for Bar Chart
  const cyclesChartData = cycles.slice(0, 12).reverse().map((c) => ({
    name: new Date(c.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    volume: c.totalVolume,
    duration: c.durationMinutes,
  }));

  // Daily Consumption Chart Data vs Baseline (7 days average)
  const dailyData = [
    { day: 'Sen', volume: 450, baseline: 420 },
    { day: 'Sel', volume: 410, baseline: 420 },
    { day: 'Rab', volume: 480, baseline: 420 },
    { day: 'Kam', volume: 430, baseline: 420 },
    { day: 'Jum', volume: 510, baseline: 420 },
    { day: 'Sab', volume: 460, baseline: 420 },
    { day: 'Min', volume: 490, baseline: 420 },
  ];

  // Dynamic colors based on Theme (Light Mode)
  const gridColor = '#e2e8f0';
  const textColor = '#475569';
  const tooltipBg = '#ffffff';
  const tooltipBorder = '#cbd5e1';
  const tooltipText = '#0f172a';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <LineChart className="w-7 h-7 text-cyan-600 dark:text-cyan-400" />
            Grafik & Analisis Historis
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Analisis tren debit air real-time, grafik historis pengisian, serta riwayat siklus tandon.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          Export Data CSV
        </button>
      </div>

      {/* Realtime Debit Area Chart */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 dark:bg-cyan-400 animate-ping inline-block" />
              Grafik Debit Air Real-Time (L/menit)
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">Pembaruan otomatis tiap 5 detik dari sensor flow meter</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500 dark:text-slate-400">Debit Terbaru: </span>
            <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold text-base">{latestTelemetry.flowRate.toFixed(1)} L/m</span>
          </div>
        </div>

        <div className="h-64 w-full">
          {isClient ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={realtimeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorFlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="time" stroke={textColor} fontSize={12} tickLine={false} />
                <YAxis stroke={textColor} fontSize={12} tickLine={false} unit=" L/m" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: tooltipBorder,
                    borderRadius: '0.75rem',
                    color: tooltipText,
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                  }}
                  formatter={(value: any) => [`${value} L/menit`, 'Debit Air']}
                />
                <Area type="monotone" dataKey="flowRate" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#colorFlow)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full flex items-center justify-center text-slate-400 text-xs">Memuat Grafik...</div>
          )}
        </div>
      </div>

      {/* Historical Area Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Volume per Cycle Chart */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">Volume Pengisian per Siklus (Liter)</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-6">Akumulasi volume air tiap kali pompa menyala hingga mati</p>

          <div className="h-60 w-full">
            {isClient ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cyclesChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCycleVolume" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="name" stroke={textColor} fontSize={12} tickLine={false} />
                  <YAxis stroke={textColor} fontSize={12} tickLine={false} unit=" L" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: tooltipBg,
                      borderColor: tooltipBorder,
                      borderRadius: '0.75rem',
                      color: tooltipText,
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                    }}
                    formatter={(value: any) => [`${value} Liter`, 'Volume Pengisian']}
                  />
                  <Area type="monotone" dataKey="volume" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#colorCycleVolume)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-slate-400 text-xs">Memuat Grafik...</div>
            )}
          </div>
        </div>

        {/* Daily Consumption vs Baseline Chart */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Konsumsi Air Harian vs Baseline</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">Perbandingan konsumsi vs rata-rata 7 hari terakhir</p>
            </div>
            <div className="flex gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <button
                onClick={() => setFilterPeriod('7days')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${filterPeriod === '7days' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400'}`}
              >
                7 Hari
              </button>
              <button
                onClick={() => setFilterPeriod('30days')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${filterPeriod === '30days' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400'}`}
              >
                30 Hari
              </button>
            </div>
          </div>

          <div className="h-60 w-full">
            {isClient ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorDailyVolume" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="day" stroke={textColor} fontSize={12} tickLine={false} />
                  <YAxis stroke={textColor} fontSize={12} tickLine={false} unit=" L" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: tooltipBg,
                      borderColor: tooltipBorder,
                      borderRadius: '0.75rem',
                      color: tooltipText,
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                    }}
                    formatter={(value: any) => [`${value} Liter`, 'Volume Air']}
                  />
                  <ReferenceLine y={420} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Baseline (420L)', fill: '#f59e0b', fontSize: 10 }} />
                  <Area type="monotone" dataKey="volume" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#colorDailyVolume)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-slate-400 text-xs">Memuat Grafik...</div>
            )}
          </div>
        </div>
      </div>

      {/* Historical Cycles Table & Date Range Filter */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Table className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            Tabel Riwayat Siklus Pengisian
          </h3>

          {/* Date Filter Inputs */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              />
              <span className="text-slate-500">s/d</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              />
            </div>
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-semibold"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-slate-900/80 text-slate-700 dark:text-slate-400 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3">No</th>
                <th className="p-3">Tanggal</th>
                <th className="p-3">Waktu Mulai</th>
                <th className="p-3">Waktu Selesai</th>
                <th className="p-3">Durasi</th>
                <th className="p-3">Volume Air</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-mono">
              {cycles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500 italic">
                    Belum ada data siklus pengisian tandon.
                  </td>
                </tr>
              ) : (
                cycles.map((c, index) => {
                  const start = new Date(c.startTime);
                  const end = c.endTime ? new Date(c.endTime) : null;
                  return (
                    <tr key={c.id} className="hover:bg-slate-100/60 dark:hover:bg-slate-900/40 transition-colors">
                      <td className="p-3 text-slate-500">{index + 1}</td>
                      <td className="p-3 font-semibold text-slate-900 dark:text-slate-200">{start.toISOString().split('T')[0]}</td>
                      <td className="p-3">{start.toLocaleTimeString('id-ID')}</td>
                      <td className="p-3">{end ? end.toLocaleTimeString('id-ID') : <span className="text-cyan-600 dark:text-cyan-400 animate-pulse">Berjalan...</span>}</td>
                      <td className="p-3">{c.durationMinutes} menit</td>
                      <td className="p-3 text-cyan-600 dark:text-cyan-300 font-bold">{c.totalVolume} Liter</td>
                      <td className="p-3">
                        {c.status === 'NORMAL' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-fit">
                            <CheckCircle className="w-3 h-3" /> Normal
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/30 flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3" /> Anomali
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

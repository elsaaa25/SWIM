'use client';

import { useState } from 'react';
import { useRealtime } from '../providers';
import { BellRing, AlertTriangle, AlertCircle, CheckCircle2, ShieldAlert, Filter, Clock } from 'lucide-react';
import { AlertData, AlertLevel } from '@/lib/types';

export default function AlertsPage() {
  const { alerts, resolveAlert } = useRealtime();
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'RESOLVED'>('ALL');
  const [filterLevel, setFilterLevel] = useState<'ALL' | AlertLevel>('ALL');

  const filteredAlerts = alerts.filter((alert) => {
    if (filterStatus !== 'ALL' && alert.status !== filterStatus) return false;
    if (filterLevel !== 'ALL' && alert.level !== filterLevel) return false;
    return true;
  });

  const getLevelBadge = (level: AlertLevel) => {
    switch (level) {
      case 'KRITIS':
        return (
          <span className="px-3 py-1 text-xs font-bold bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/40 rounded-full flex items-center gap-1.5 glow-rose">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" /> KRITIS
          </span>
        );
      case 'BAHAYA':
        return (
          <span className="px-3 py-1 text-xs font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 rounded-full flex items-center gap-1.5 glow-amber">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> BAHAYA
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 text-xs font-bold bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border border-yellow-500/40 rounded-full flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400" /> WASPADA
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <BellRing className="w-7 h-7 text-rose-500 dark:text-rose-400" />
            Pusat Notifikasi & Deteksi Anomali
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Riwayat lengkap alert pelampung rusak, kebocoran dini hari, dan status perangkat offline.
          </p>
        </div>

        {/* Status Count Summary */}
        <div className="flex items-center gap-2">
          <div className="glass-panel px-4 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 border border-rose-500/30">
            {alerts.filter((a) => a.status === 'ACTIVE').length} Alert Aktif
          </div>
          <div className="glass-panel px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400">
            {alerts.filter((a) => a.status === 'RESOLVED').length} Selesai
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${filterStatus === 'ALL' ? 'bg-cyan-600 text-white shadow' : 'text-slate-600 dark:text-slate-400'}`}
          >
            Semua ({alerts.length})
          </button>
          <button
            onClick={() => setFilterStatus('ACTIVE')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${filterStatus === 'ACTIVE' ? 'bg-rose-600 text-white shadow' : 'text-slate-600 dark:text-slate-400'}`}
          >
            Aktif ({alerts.filter((a) => a.status === 'ACTIVE').length})
          </button>
          <button
            onClick={() => setFilterStatus('RESOLVED')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${filterStatus === 'RESOLVED' ? 'bg-emerald-600 text-white shadow' : 'text-slate-600 dark:text-slate-400'}`}
          >
            Resolved ({alerts.filter((a) => a.status === 'RESOLVED').length})
          </button>
        </div>

        {/* Level Dropdown */}
        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <span className="text-slate-600 dark:text-slate-400 font-medium">Tingkat Level:</span>
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value as any)}
            className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer"
          >
            <option value="ALL">Semua Level</option>
            <option value="KRITIS">Kritis (Luber / Parah)</option>
            <option value="BAHAYA">Bahaya (Bocor / Disconnect)</option>
            <option value="WASPADA">Waspada (Pompa Nyala Lama)</option>
          </select>
        </div>
      </div>

      {/* Alert Feed List */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="glass-panel p-12 text-center rounded-2xl border border-slate-200 dark:border-slate-800">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 dark:text-emerald-400 mx-auto mb-3 opacity-80" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Tidak Ada Alert Dalam Kategori Ini</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Sistem tandon bekerja dalam kondisi normal.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isResolved = alert.status === 'RESOLVED';
            return (
              <div
                key={alert.id}
                className={`glass-panel p-6 rounded-2xl border transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isResolved ? 'border-slate-200 dark:border-slate-800 opacity-60' : 'border-slate-300 dark:border-slate-700 shadow-lg'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1">{getLevelBadge(alert.level)}</div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                        {alert.code}
                      </span>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">{alert.title}</h3>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/30">
                        Confidence: {alert.confidenceRate}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 mt-2">{alert.message}</p>

                    <div className="flex items-center gap-4 mt-3 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Ditrigger:{' '}
                        {new Date(alert.createdAt).toLocaleString('id-ID')}
                      </span>
                      {alert.resolvedAt && <span>Selesai: {new Date(alert.resolvedAt).toLocaleString('id-ID')}</span>}
                    </div>
                  </div>
                </div>

                {!isResolved && (
                  <button
                    onClick={() => resolveAlert(alert.id)}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition-all self-end md:self-center"
                  >
                    Tandai Selesai
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

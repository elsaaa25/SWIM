'use client';

import { useState, useEffect } from 'react';
import { Wifi, AlertTriangle, Zap, Clock } from 'lucide-react';
import { DeviceState } from '@/lib/types';
import { useRealtime } from '@/app/providers';

interface NavbarProps {
  device: DeviceState;
  activeAlertCount: number;
}

export default function Navbar({ device, activeAlertCount }: NavbarProps) {
  const [liveTime, setLiveTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLiveTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' WIB'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 glass-panel border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Device Name & Live Real-Time Clock */}
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <span>{device.name}</span>
          </h2>
          <p className="text-xs text-cyan-600 dark:text-cyan-400 font-mono font-semibold flex items-center gap-1.5 mt-0.5">
            <Clock className="w-3.5 h-3.5 animate-pulse text-cyan-500" />
            <span>{liveTime || 'Memuat Waktu...'}</span>
          </p>
        </div>
      </div>

      {/* Right Side Status & Controls */}
      <div className="flex items-center gap-3">
        {/* Active Alerts Badge */}
        {activeAlertCount > 0 && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-500 dark:text-rose-400 animate-pulse" />
            <span className="text-rose-600 dark:text-rose-300 font-semibold">{activeAlertCount} Alert Aktif</span>
          </div>
        )}

        {/* Connection Status */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs">
          <Wifi className={`w-4 h-4 ${device.isOnline ? 'text-cyan-500 dark:text-cyan-400' : 'text-slate-400'}`} />
          <span className={device.isOnline ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-rose-500 font-semibold'}>
            {device.isOnline ? 'Perangkat Online' : 'Perangkat Offline'}
          </span>
        </div>
      </div>
    </header>
  );
}



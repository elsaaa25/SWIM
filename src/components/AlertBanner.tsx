'use client';

import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { AlertData } from '@/lib/types';

interface AlertBannerProps {
  alerts: AlertData[];
  onResolve?: (id: string) => void;
}

export default function AlertBanner({ alerts, onResolve }: AlertBannerProps) {
  const activeAlerts = alerts.filter((a) => a.status === 'ACTIVE');

  if (activeAlerts.length === 0) return null;

  const topAlert = activeAlerts[0];

  const getStyle = (level: string) => {
    switch (level) {
      case 'KRITIS':
        return {
          bg: 'bg-gradient-to-r from-rose-950/90 via-rose-900/80 to-slate-900',
          border: 'border-rose-500/50',
          icon: <AlertCircle className="w-5 h-5 text-rose-400 animate-bounce" />,
          text: 'text-rose-200',
          btn: 'bg-rose-600 hover:bg-rose-500 text-white',
        };
      case 'BAHAYA':
        return {
          bg: 'bg-gradient-to-r from-amber-950/90 via-amber-900/80 to-slate-900',
          border: 'border-amber-500/50',
          icon: <AlertTriangle className="w-5 h-5 text-amber-400 animate-pulse" />,
          text: 'text-amber-200',
          btn: 'bg-amber-600 hover:bg-amber-500 text-white',
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-yellow-950/90 via-yellow-900/80 to-slate-900',
          border: 'border-yellow-500/50',
          icon: <Info className="w-5 h-5 text-yellow-400" />,
          text: 'text-yellow-200',
          btn: 'bg-yellow-600 hover:bg-yellow-500 text-white',
        };
    }
  };

  const style = getStyle(topAlert.level);

  return (
    <div className={`m-6 mb-0 p-4 rounded-2xl border ${style.bg} ${style.border} shadow-lg flex items-center justify-between gap-4 transition-all duration-300 animate-fade-in`}>
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-700/50">{style.icon}</div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-900/90 text-white border border-slate-700">
              {topAlert.code}
            </span>
            <h4 className={`font-bold text-sm ${style.text}`}>{topAlert.title}</h4>
            <span className="text-xs text-slate-400">({topAlert.confidenceRate}% Confidence)</span>
          </div>
          <p className="text-xs text-slate-300 mt-1">{topAlert.message}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {onResolve && (
          <button
            onClick={() => onResolve(topAlert.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md ${style.btn}`}
          >
            Tandai Selesai
          </button>
        )}
      </div>
    </div>
  );
}

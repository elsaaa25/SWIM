'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { AlertData, DeviceState, FillingCycleData, SystemSettingsData, TelemetryData } from '@/lib/types';

interface RealtimeContextType {
  device: DeviceState;
  latestTelemetry: TelemetryData;
  activeCycle: FillingCycleData | null;
  alerts: AlertData[];
  recentTelemetries: TelemetryData[];
  allCycles: FillingCycleData[];
  settings: SystemSettingsData;
  todayStats: {
    todayVolume: number;
    todayDurationMinutes: number;
    todayCycleCount: number;
    lastCompletedCycle: FillingCycleData | null;
  };
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  resolveAlert: (id: string) => Promise<void>;
  updateSettings: (newSettings: Partial<SystemSettingsData>) => Promise<void>;
  refresh: () => void;
}

const defaultDevice: DeviceState = {
  id: 'SWIM-001',
  name: 'Tandon Utama SWIM-01',
  isOnline: false,
  lastSeen: new Date(0).toISOString(),
  wifiRssi: -62,
  systemStatus: 'Normal',
};

const defaultTelemetry: TelemetryData = {
  id: 'tel-init',
  deviceId: 'SWIM-001',
  timestamp: new Date().toISOString(),
  flowRate: 0,
  pulseCount: 145000,
  isFlowing: false,
  wifiRssi: -62,
};

const defaultSettings: SystemSettingsData = {
  id: 'default',
  tankCapacity: 500,
  normalFillTimeMinutes: 25,
  warningPumpMinutes: 50,
  dangerPumpMinutes: 75,
  leakIntervalMinutes: 30,
  consecutiveLeakCycles: 2,
  earlyMorningStart: '01:00',
  earlyMorningEnd: '04:00',
  offlineTimeoutMinutes: 5,
  calibrationFactor: 7.5,
  dataIntervalSeconds: 5,
  notifyBrowser: true,
  notifyEmail: false,
  notifyWhatsApp: false,
  emailAddress: 'admin@tandon-monitoring.com',
  whatsAppNumber: '081234567890',
};

const defaultTodayStats: {
  todayVolume: number;
  todayDurationMinutes: number;
  todayCycleCount: number;
  lastCompletedCycle: FillingCycleData | null;
} = {
  todayVolume: 0,
  todayDurationMinutes: 0,
  todayCycleCount: 0,
  lastCompletedCycle: null,
};

const RealtimeContext = createContext<RealtimeContextType>({
  device: defaultDevice,
  latestTelemetry: defaultTelemetry,
  activeCycle: null,
  alerts: [],
  recentTelemetries: [],
  allCycles: [],
  settings: defaultSettings,
  todayStats: defaultTodayStats,
  theme: 'dark',
  toggleTheme: () => {},
  resolveAlert: async () => {},
  updateSettings: async () => {},
  refresh: () => {},
});

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [device, setDevice] = useState<DeviceState>(defaultDevice);
  const [latestTelemetry, setLatestTelemetry] = useState<TelemetryData>(defaultTelemetry);
  const [activeCycle, setActiveCycle] = useState<FillingCycleData | null>(null);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [recentTelemetries, setRecentTelemetries] = useState<TelemetryData[]>([]);
  const [allCycles, setAllCycles] = useState<FillingCycleData[]>([]);
  const [settings, setSettings] = useState<SystemSettingsData>(defaultSettings);
  const [todayStats, setTodayStats] = useState(defaultTodayStats);
  const [theme, setTheme] = useState<'dark' | 'light'>('light');

  // Theme Initializer - Fixed to Light Mode
  useEffect(() => {
    setTheme('light');
    document.documentElement.classList.remove('dark');
  }, []);

  const toggleTheme = () => {
    // No-op since dark mode is removed
  };

  const fetchSnapshot = async () => {
    try {
      const [alertsRes, settingsRes, cyclesRes] = await Promise.all([
        fetch('/api/alerts').then((r) => r.json()),
        fetch('/api/settings').then((r) => r.json()),
        fetch('/api/cycles').then((r) => r.json()),
      ]);

      if (alertsRes.alerts) setAlerts(alertsRes.alerts);
      if (settingsRes.tankCapacity) setSettings(settingsRes);

      // Compute Today Stats from cycles
      if (cyclesRes.cycles && Array.isArray(cyclesRes.cycles)) {
        const fetchedCycles: FillingCycleData[] = cyclesRes.cycles;
        setAllCycles(fetchedCycles);

        const todayStr = new Date().toISOString().split('T')[0];
        const completedCycles = fetchedCycles.filter((c) => c.endTime);

        const todayCompleted = completedCycles.filter(
          (c) => c.endTime && c.endTime.startsWith(todayStr)
        );

        const totalVol = todayCompleted.reduce((acc, curr) => acc + curr.totalVolume, 0);
        const totalDur = todayCompleted.reduce((acc, curr) => acc + curr.durationMinutes, 0);

        setTodayStats({
          todayVolume: Math.round(totalVol),
          todayDurationMinutes: Math.round(totalDur),
          todayCycleCount: todayCompleted.length,
          lastCompletedCycle: completedCycles[0] || null,
        });
      }
    } catch (e) {
      console.error('Failed to fetch snapshot:', e);
    }
  };

  useEffect(() => {
    fetchSnapshot();

    const eventSource = new EventSource('/api/realtime');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.device) setDevice(data.device);
        if (data.latestTelemetry) setLatestTelemetry(data.latestTelemetry);
        if (data.activeCycle !== undefined) setActiveCycle(data.activeCycle);
        if (data.alerts) setAlerts(data.alerts);
        if (data.recentTelemetries) setRecentTelemetries(data.recentTelemetries);
      } catch (e) {
        console.error('Error parsing SSE data:', e);
      }
    };

    // Timer lokal untuk memastikan status Offline jika tidak ada data baru dalam 60 detik (1 menit)
    const offlineCheckInterval = setInterval(() => {
      setDevice((prev) => {
        const lastSeenMs = new Date(prev.lastSeen).getTime();
        // Hanya ubah ke offline jika perangkat benar-benar tidak mengirim data selama 60 detik
        const isRecentlyActive = (Date.now() - lastSeenMs) < 60000; // 60 detik threshold
        if (prev.isOnline !== isRecentlyActive) {
          return { ...prev, isOnline: isRecentlyActive };
        }
        return prev;
      });
    }, 1000);

    return () => {
      eventSource.close();
      clearInterval(offlineCheckInterval);
    };
  }, []);

  const resolveAlert = async (alertId: string) => {
    try {
      await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId }),
      });
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, status: 'RESOLVED', resolvedAt: new Date().toISOString() } : a))
      );
    } catch (e) {
      console.error('Failed to resolve alert:', e);
    }
  };

  const updateSettingsHandler = async (newSettings: Partial<SystemSettingsData>) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      const data = await res.json();
      if (data.settings) setSettings(data.settings);
    } catch (e) {
      console.error('Failed to update settings:', e);
    }
  };

  return (
    <RealtimeContext.Provider
      value={{
        device,
        latestTelemetry,
        activeCycle,
        alerts,
        recentTelemetries,
        allCycles,
        settings,
        todayStats,
        theme,
        toggleTheme,
        resolveAlert,
        updateSettings: updateSettingsHandler,
        refresh: fetchSnapshot,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
}

export const useRealtime = () => useContext(RealtimeContext);

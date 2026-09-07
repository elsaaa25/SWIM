import {
  AlertData,
  DeviceState,
  FillingCycleData,
  SystemSettingsData,
  TelemetryData,
  IngestionPayload,
} from './types';
import { evaluateAnomalies } from './anomaly-engine';

// Default Settings matching PRD defaults
const DEFAULT_SETTINGS: SystemSettingsData = {
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

// Initial Device State
const DEFAULT_DEVICE: DeviceState = {
  id: 'SWIM-001',
  name: 'Tandon Utama SWIM-01',
  isOnline: false,
  lastSeen: new Date(0).toISOString(), // Belum pernah konek saat awal
  wifiRssi: -62,
  systemStatus: 'Normal',
};

// Seed 7 days of realistic historical filling cycles for rich charts
function generateSeedCycles(): FillingCycleData[] {
  const cycles: FillingCycleData[] = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const dayDate = new Date(now);
    dayDate.setDate(dayDate.getDate() - i);

    // 3 filling cycles per day at 07:00, 13:00, 19:00
    const hours = [7, 13, 19];
    hours.forEach((h, idx) => {
      const startTime = new Date(dayDate);
      startTime.setHours(h, Math.floor(Math.random() * 15), 0);

      const durationMinutes = 20 + Math.floor(Math.random() * 8); // ~20-28 mins
      const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
      const totalVolume = Math.round(durationMinutes * 18.5); // ~370 - 500L

      cycles.push({
        id: `cyc-${i}-${idx}`,
        deviceId: 'SWIM-001',
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        durationMinutes,
        totalVolume,
        status: 'NORMAL',
      });
    });
  }

  return cycles;
}

// In-Memory Global Singleton State
class WaterTankStore {
  private device: DeviceState = { ...DEFAULT_DEVICE };
  private settings: SystemSettingsData = { ...DEFAULT_SETTINGS };
  private telemetries: TelemetryData[] = [];
  private cycles: FillingCycleData[] = generateSeedCycles();
  private alerts: AlertData[] = [];
  private activeCycle: FillingCycleData | null = null;
  private listeners: Set<(data: { device: DeviceState; latestTelemetry: TelemetryData; alerts: AlertData[] }) => void> = new Set();

  constructor() {
    // Generate initial live telemetry point
    const initialTelemetry: TelemetryData = {
      id: 'tel-init',
      deviceId: 'SWIM-001',
      timestamp: new Date().toISOString(),
      flowRate: 0,
      pulseCount: 145200,
      isFlowing: false,
      wifiRssi: -62,
    };
    this.telemetries.push(initialTelemetry);
  }

  public getDevice(): DeviceState {
    // Jika data tidak diterima lebih dari 15 detik, anggap offline secara real-time
    const lastSeenMs = new Date(this.device.lastSeen).getTime();
    const nowMs = Date.now();
    const isRecentlyActive = (nowMs - lastSeenMs) < 15000; // 15 detik threshold
    
    this.device.isOnline = isRecentlyActive;
    return this.device;
  }

  public getSettings(): SystemSettingsData {
    return this.settings;
  }

  public updateSettings(newSettings: Partial<SystemSettingsData>): SystemSettingsData {
    this.settings = { ...this.settings, ...newSettings };
    return this.settings;
  }

  public getLatestTelemetry(): TelemetryData {
    return this.telemetries[this.telemetries.length - 1];
  }

  public getRecentTelemetries(limit: number = 30): TelemetryData[] {
    return this.telemetries.slice(-limit);
  }

  public getCycles(): FillingCycleData[] {
    return this.cycles;
  }

  public getActiveCycle(): FillingCycleData | null {
    return this.activeCycle;
  }

  public getAlerts(): AlertData[] {
    return this.alerts;
  }

  public resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.status = 'RESOLVED';
      alert.resolvedAt = new Date().toISOString();
      this.reevaluateSystemStatus();
      this.notifyListeners();
      return true;
    }
    return false;
  }

  public triggerTestAlert(code: string = 'ALT-003'): AlertData {
    const mockAlerts: Record<string, Omit<AlertData, 'id' | 'createdAt'>> = {
      'ALT-003': {
        deviceId: 'SWIM-001',
        code: 'ALT-003',
        title: 'Air Melebihi Kapasitas',
        message: 'Periksa pelampung otomatis tandon.',
        level: 'KRITIS',
        status: 'ACTIVE',
        confidenceRate: 99,
      },
      'ALT-004': {
        deviceId: 'SWIM-001',
        code: 'ALT-004',
        title: 'Pengisian Dini Hari',
        message: 'Periksa keran yang belum tertutup.',
        level: 'BAHAYA',
        status: 'ACTIVE',
        confidenceRate: 88,
      },
      'ALT-001': {
        deviceId: 'SWIM-001',
        code: 'ALT-001',
        title: 'Waktu Pengisian Lama',
        message: 'Aliran air masuk sedang pelan.',
        level: 'WASPADA',
        status: 'ACTIVE',
        confidenceRate: 75,
      },
    };

    const template = mockAlerts[code] || mockAlerts['ALT-003'];
    const alertObj: AlertData = {
      ...template,
      id: `alt-test-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      createdAt: new Date().toISOString(),
    };

    this.alerts.unshift(alertObj);
    this.reevaluateSystemStatus();
    this.notifyListeners();
    return alertObj;
  }

  public processHeartbeat(deviceId: string) {
    this.device.lastSeen = new Date().toISOString();
    this.device.isOnline = true;
    this.reevaluateSystemStatus();
  }

  public ingestTelemetry(payload: IngestionPayload): { status: string; alert?: AlertData | null } {
    const timestamp = payload.timestamp ? new Date(payload.timestamp) : new Date();
    const isFlowing = payload.is_flowing || payload.flow_rate > 0;
    const flowRate = payload.flow_rate || 0;

    // 1. Update Device Connectivity
    this.device.lastSeen = timestamp.toISOString();
    this.device.isOnline = true;
    if (payload.wifi_rssi) {
      this.device.wifiRssi = payload.wifi_rssi;
    }

    // 2. Record Telemetry
    const newTelemetry: TelemetryData = {
      id: `tel-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      deviceId: payload.device_id || 'SWIM-001',
      timestamp: timestamp.toISOString(),
      flowRate,
      pulseCount: payload.pulse_count,
      isFlowing,
      wifiRssi: payload.wifi_rssi || this.device.wifiRssi,
    };
    this.telemetries.push(newTelemetry);

    // Retain only last 500 telemetry points in memory
    if (this.telemetries.length > 500) {
      this.telemetries.shift();
    }

    // 3. Cycle State Machine Management
    if (isFlowing) {
      if (!this.activeCycle) {
        // Start New Filling Cycle
        this.activeCycle = {
          id: `cyc-${Date.now()}`,
          deviceId: payload.device_id || 'SWIM-001',
          startTime: timestamp.toISOString(),
          durationMinutes: 0,
          totalVolume: 0,
          status: 'NORMAL',
        };
      }

      // Update active cycle volume & duration
      const startMs = new Date(this.activeCycle.startTime).getTime();
      const elapsedMins = (timestamp.getTime() - startMs) / (1000 * 60);
      this.activeCycle.durationMinutes = Math.max(0.1, Number(elapsedMins.toFixed(1)));

      // Accumulate volume based on L/min over interval (e.g. 5 sec = 5/60 min)
      const intervalMinutes = this.settings.dataIntervalSeconds / 60;
      const volumeInInterval = flowRate * intervalMinutes;
      this.activeCycle.totalVolume = Number((this.activeCycle.totalVolume + volumeInInterval).toFixed(1));
    } else {
      // Pump is OFF (isFlowing === false)
      if (this.activeCycle) {
        // Complete Active Cycle
        this.activeCycle.endTime = timestamp.toISOString();
        const startMs = new Date(this.activeCycle.startTime).getTime();
        const elapsedMins = (timestamp.getTime() - startMs) / (1000 * 60);
        this.activeCycle.durationMinutes = Math.max(0.5, Number(elapsedMins.toFixed(1)));

        this.cycles.unshift(this.activeCycle);
        this.activeCycle = null;
      }
    }

    // 4. Run Anomaly Engine
    const { newAlerts, systemStatus } = evaluateAnomalies(
      flowRate,
      isFlowing,
      this.activeCycle,
      this.cycles,
      this.alerts,
      this.settings,
      new Date(this.device.lastSeen)
    );

    let createdAlert: AlertData | null = null;
    newAlerts.forEach((na) => {
      const alertObj: AlertData = {
        ...na,
        id: `alt-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        createdAt: timestamp.toISOString(),
      };
      this.alerts.unshift(alertObj);
      createdAlert = alertObj;
    });

    this.device.systemStatus = systemStatus;
    this.notifyListeners();

    return {
      status: 'ok',
      alert: createdAlert,
    };
  }

  private reevaluateSystemStatus() {
    const activeAlerts = this.alerts.filter((a) => a.status === 'ACTIVE');
    const levels = activeAlerts.map((a) => a.level);
    if (levels.includes('KRITIS')) {
      this.device.systemStatus = 'Kritis';
    } else if (levels.includes('BAHAYA')) {
      this.device.systemStatus = 'Bahaya';
    } else if (levels.includes('WASPADA')) {
      this.device.systemStatus = 'Waspada';
    } else {
      this.device.systemStatus = 'Normal';
    }
  }

  // Subscribe to real-time updates
  public subscribe(callback: (data: { device: DeviceState; latestTelemetry: TelemetryData; alerts: AlertData[] }) => void) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners() {
    const data = {
      device: this.getDevice(),
      latestTelemetry: this.getLatestTelemetry(),
      alerts: this.getAlerts(),
    };
    this.listeners.forEach((listener) => listener(data));
  }
}

// Global Singleton Instance
const globalForStore = globalThis as unknown as { waterTankStore?: WaterTankStore };
export const store = globalForStore.waterTankStore || new WaterTankStore();
if (process.env.NODE_ENV !== 'production') globalForStore.waterTankStore = store;

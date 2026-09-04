export type AlertLevel = 'WASPADA' | 'BAHAYA' | 'KRITIS';
export type AlertStatus = 'ACTIVE' | 'RESOLVED';
export type CycleStatus = 'NORMAL' | 'ANOMALY';
export type SystemStatus = 'Normal' | 'Waspada' | 'Bahaya' | 'Kritis';

export interface DeviceState {
  id: string;
  name: string;
  isOnline: boolean;
  lastSeen: string;
  wifiRssi: number;
  systemStatus: SystemStatus;
}

export interface TelemetryData {
  id: string;
  deviceId: string;
  timestamp: string;
  flowRate: number; // L/min
  pulseCount: number;
  isFlowing: boolean;
  wifiRssi: number;
}

export interface FillingCycleData {
  id: string;
  deviceId: string;
  startTime: string;
  endTime?: string;
  durationMinutes: number;
  totalVolume: number; // Liters
  status: CycleStatus;
}

export interface AlertData {
  id: string;
  deviceId: string;
  code: string; // ALT-001..006
  title: string;
  message: string;
  level: AlertLevel;
  status: AlertStatus;
  confidenceRate: number;
  createdAt: string;
  resolvedAt?: string;
}

export interface SystemSettingsData {
  id: string;
  tankCapacity: number; // Liters
  normalFillTimeMinutes: number; // Minutes
  warningPumpMinutes: number;
  dangerPumpMinutes: number;
  leakIntervalMinutes: number;
  consecutiveLeakCycles: number;
  earlyMorningStart: string; // "01:00"
  earlyMorningEnd: string; // "04:00"
  offlineTimeoutMinutes: number;
  calibrationFactor: number;
  dataIntervalSeconds: number;
  notifyBrowser: boolean;
  notifyEmail: boolean;
  notifyWhatsApp: boolean;
  emailAddress?: string;
  whatsAppNumber?: string;
}

export interface IngestionPayload {
  device_id: string;
  timestamp?: string;
  flow_rate: number;
  pulse_count: number;
  is_flowing: boolean;
  wifi_rssi?: number;
}

export interface HeartbeatPayload {
  device_id: string;
}

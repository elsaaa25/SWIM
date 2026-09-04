import { AlertData, AlertLevel, FillingCycleData, SystemSettingsData } from './types';

/**
 * Anomaly Detection Engine according to PRD Specifications
 */

export function parseTimeStringToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function isWithinEarlyMorning(timestamp: Date, startStr: string, endStr: string): boolean {
  const currentMinutes = timestamp.getHours() * 60 + timestamp.getMinutes();
  const startMinutes = parseTimeStringToMinutes(startStr);
  const endMinutes = parseTimeStringToMinutes(endStr);

  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  } else {
    // Crosses midnight
    return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
  }
}

export interface AnomalyCheckResult {
  newAlerts: Omit<AlertData, 'id' | 'createdAt'>[];
  systemStatus: 'Normal' | 'Waspada' | 'Bahaya' | 'Kritis';
}

export function evaluateAnomalies(
  currentFlowRate: number,
  isFlowing: boolean,
  activeCycle: FillingCycleData | null,
  recentCycles: FillingCycleData[],
  existingActiveAlerts: AlertData[],
  settings: SystemSettingsData,
  lastSeen: Date
): AnomalyCheckResult {
  const newAlerts: Omit<AlertData, 'id' | 'createdAt'>[] = [];
  const now = new Date();

  // Helper to check if alert code is already active
  const hasActiveAlert = (code: string) =>
    existingActiveAlerts.some((a) => a.code === code && a.status === 'ACTIVE');

  // ----------------------------------------------------
  // 1. Perangkat Offline Check (ALT-006)
  // ----------------------------------------------------
  const diffMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60);
  if (diffMinutes > settings.offlineTimeoutMinutes && !hasActiveAlert('ALT-006')) {
    newAlerts.push({
      deviceId: 'SWIM-001',
      code: 'ALT-006',
      title: 'Perangkat Offline',
      message: `Tidak ada data terdeteksi dari sensor lebih dari ${Math.floor(diffMinutes)} menit.`,
      level: 'BAHAYA',
      status: 'ACTIVE',
      confidenceRate: 99,
    });
  }

  // ----------------------------------------------------
  // 2. Active Cycle / Stuck Float Valve Checks (ALT-001, ALT-002, ALT-003)
  // ----------------------------------------------------
  if (activeCycle && isFlowing) {
    const cycleStart = new Date(activeCycle.startTime);
    const durationMins = (now.getTime() - cycleStart.getTime()) / (1000 * 60);
    const currentVolume = activeCycle.totalVolume;

    // ALT-003: Pelampung Rusak - Air Luber (Kritis)
    if (currentVolume > settings.tankCapacity && !hasActiveAlert('ALT-003')) {
      newAlerts.push({
        deviceId: activeCycle.deviceId,
        code: 'ALT-003',
        title: 'Pelampung Rusak — Air Luber',
        message: `Volume pengisian (${Math.round(currentVolume)}L) telah melebihi kapasitas tandon (${settings.tankCapacity}L). Air berpotensi luber!`,
        level: 'KRITIS',
        status: 'ACTIVE',
        confidenceRate: 99,
      });
    }

    // ALT-002: Pelampung Rusak - Pompa Nonstop > 3x Normal (Bahaya)
    const dangerThreshold = settings.normalFillTimeMinutes * 3;
    if (durationMins > dangerThreshold && !hasActiveAlert('ALT-002')) {
      newAlerts.push({
        deviceId: activeCycle.deviceId,
        code: 'ALT-002',
        title: 'Kemungkinan Pelampung Rusak',
        message: `Pompa menyala nonstop selama ${Math.round(durationMins)} menit (threshold bahaya: ${dangerThreshold} menit).`,
        level: 'BAHAYA',
        status: 'ACTIVE',
        confidenceRate: 85,
      });
    }

    // ALT-001: Pompa Nyala Lama > 2x Normal (Waspada)
    const warningThreshold = settings.normalFillTimeMinutes * 2;
    if (durationMins > warningThreshold && durationMins <= dangerThreshold && !hasActiveAlert('ALT-001')) {
      newAlerts.push({
        deviceId: activeCycle.deviceId,
        code: 'ALT-001',
        title: 'Pompa Nyala Lama',
        message: `Pompa menyala nonstop melebihi ${Math.round(warningThreshold)} menit. Periksa kondisi pengisian tandon.`,
        level: 'WASPADA',
        status: 'ACTIVE',
        confidenceRate: 75,
      });
    }
  }

  // ----------------------------------------------------
  // 3. Leakage Checks (ALT-004 & ALT-005)
  // ----------------------------------------------------
  // Evaluasi jeda antar siklus jika ada minimal (consecutiveLeakCycles) siklus terakhir
  if (recentCycles.length >= settings.consecutiveLeakCycles) {
    const sortedCycles = [...recentCycles].sort(
      (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );

    let isShortIntervalSequence = true;
    for (let i = 0; i < settings.consecutiveLeakCycles - 1; i++) {
      const current = sortedCycles[i];
      const previous = sortedCycles[i + 1];
      if (current && previous && current.endTime) {
        const gapMinutes =
          (new Date(current.startTime).getTime() - new Date(previous.endTime!).getTime()) /
          (1000 * 60);
        if (gapMinutes > settings.leakIntervalMinutes || gapMinutes < 0) {
          isShortIntervalSequence = false;
          break;
        }
      } else {
        isShortIntervalSequence = false;
        break;
      }
    }

    if (isShortIntervalSequence) {
      const inEarlyMorning = isWithinEarlyMorning(
        now,
        settings.earlyMorningStart,
        settings.earlyMorningEnd
      );

      if (inEarlyMorning && !hasActiveAlert('ALT-004')) {
        newAlerts.push({
          deviceId: 'SWIM-001',
          code: 'ALT-004',
          title: 'Kebocoran Tandon (Dini Hari)',
          message: `Pompa aktif berulang di jam dini hari (${settings.earlyMorningStart}-${settings.earlyMorningEnd}) dengan interval < ${settings.leakIntervalMinutes} menit.`,
          level: 'BAHAYA',
          status: 'ACTIVE',
          confidenceRate: 95,
        });
      } else if (!inEarlyMorning && !hasActiveAlert('ALT-005')) {
        newAlerts.push({
          deviceId: 'SWIM-001',
          code: 'ALT-005',
          title: 'Waspada Konsumsi / Kebocoran',
          message: `Frekuensi pengisian sangat sering (interval < ${settings.leakIntervalMinutes} menit). Pantau pemakaian air atau cek pipa bocor.`,
          level: 'WASPADA',
          status: 'ACTIVE',
          confidenceRate: 70,
        });
      }
    }
  }

  // ----------------------------------------------------
  // Determine Highest System Status
  // ----------------------------------------------------
  const allActiveLevels = [
    ...existingActiveAlerts.filter((a) => a.status === 'ACTIVE').map((a) => a.level),
    ...newAlerts.map((a) => a.level),
  ];

  let systemStatus: 'Normal' | 'Waspada' | 'Bahaya' | 'Kritis' = 'Normal';
  if (allActiveLevels.includes('KRITIS')) {
    systemStatus = 'Kritis';
  } else if (allActiveLevels.includes('BAHAYA')) {
    systemStatus = 'Bahaya';
  } else if (allActiveLevels.includes('WASPADA')) {
    systemStatus = 'Waspada';
  }

  return { newAlerts, systemStatus };
}

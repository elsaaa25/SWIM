import { NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { evaluateAnomalies } from '@/lib/anomaly-engine';

export async function GET() {
  const device = store.getDevice();
  const latestTel = store.getLatestTelemetry();
  const activeCycle = store.getActiveCycle();
  const cycles = store.getCycles();
  const alerts = store.getAlerts();
  const settings = store.getSettings();

  const { newAlerts, systemStatus } = evaluateAnomalies(
    latestTel.flowRate,
    latestTel.isFlowing,
    activeCycle,
    cycles,
    alerts,
    settings,
    new Date(device.lastSeen)
  );

  return NextResponse.json({
    status: 'ok',
    checkedAt: new Date().toISOString(),
    systemStatus,
    newAlertsTriggered: newAlerts.length,
  });
}

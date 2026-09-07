import { NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { prisma } from '@/lib/prisma';
import { IngestionPayload } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body: IngestionPayload = await request.json();

    if (typeof body.flow_rate !== 'number') {
      return NextResponse.json(
        { error: 'Missing or invalid flow_rate field' },
        { status: 400 }
      );
    }

    const deviceId = body.device_id || 'SWIM-001';

    // 1. Ingest ke In-Memory Realtime Store (untuk grafik & status UI instan)
    const result = store.ingestTelemetry(body);

    // 2. Simpan secara permanen ke Database Supabase via Prisma (Asynchronous background)
    Promise.all([
      prisma.device.upsert({
        where: { id: deviceId },
        update: {
          isOnline: true,
          lastSeen: new Date(),
          wifiRssi: body.wifi_rssi ?? -65,
        },
        create: {
          id: deviceId,
          name: 'Tandon Utama ESP32',
          isOnline: true,
          lastSeen: new Date(),
          wifiRssi: body.wifi_rssi ?? -65,
        },
      }),
      prisma.telemetryLog.create({
        data: {
          deviceId: deviceId,
          flowRate: body.flow_rate,
          pulseCount: body.pulse_count || 0,
          isFlowing: body.is_flowing || body.flow_rate > 0,
          wifiRssi: body.wifi_rssi ?? -65,
        },
      }),
    ]).catch((err) => console.error('Prisma DB error saving telemetry:', err));

    return NextResponse.json({
      status: 'ok',
      alert: result.alert ? result.alert.code : null,
      message: result.alert ? `Alert triggered: ${result.alert.title}` : 'Telemetry ingested successfully',
    });
  } catch (error) {
    console.error('Error ingesting sensor data:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

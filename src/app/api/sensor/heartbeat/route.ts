import { NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { HeartbeatPayload } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body: HeartbeatPayload = await request.json();
    const deviceId = body.device_id || 'SWIM-001';

    store.processHeartbeat(deviceId);

    return NextResponse.json({
      status: 'ok',
      device_id: deviceId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error processing heartbeat:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

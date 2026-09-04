import { NextResponse } from 'next/server';
import { store } from '@/lib/store';
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

    const result = store.ingestTelemetry(body);

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

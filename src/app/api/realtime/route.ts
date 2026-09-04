import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const encoder = new TextEncoder();

  const customStream = new ReadableStream({
    start(controller) {
      // Send initial data snapshot
      const initialPayload = JSON.stringify({
        device: store.getDevice(),
        latestTelemetry: store.getLatestTelemetry(),
        activeCycle: store.getActiveCycle(),
        alerts: store.getAlerts(),
        recentTelemetries: store.getRecentTelemetries(30),
      });
      controller.enqueue(encoder.encode(`data: ${initialPayload}\n\n`));

      // Subscribe to store updates
      const unsubscribe = store.subscribe(() => {
        try {
          const payload = JSON.stringify({
            device: store.getDevice(),
            latestTelemetry: store.getLatestTelemetry(),
            activeCycle: store.getActiveCycle(),
            alerts: store.getAlerts(),
            recentTelemetries: store.getRecentTelemetries(30),
          });
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
        } catch {
          // Controller might be closed
        }
      });

      // Keep connection alive with heartbeat comment every 15s
      const interval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          clearInterval(interval);
        }
      }, 15000);

      // Clean up on cancel
      return () => {
        clearInterval(interval);
        unsubscribe();
      };
    },
  });

  return new NextResponse(customStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}

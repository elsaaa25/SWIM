import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET() {
  const alerts = store.getAlerts();
  const activeCount = alerts.filter((a) => a.status === 'ACTIVE').length;

  return NextResponse.json({
    alerts,
    activeCount,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, alertId, code } = body;

    // Test Alert Trigger Action
    if (action === 'test') {
      const createdAlert = store.triggerTestAlert(code || 'ALT-003');
      return NextResponse.json({
        status: 'ok',
        message: `Alert simulasi ${createdAlert.code} berhasil dibuat`,
        alert: createdAlert,
      });
    }

    // Resolve Alert Action
    if (!alertId) {
      return NextResponse.json({ error: 'Missing alertId or action' }, { status: 400 });
    }

    const success = store.resolveAlert(alertId);
    if (!success) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    return NextResponse.json({
      status: 'ok',
      message: 'Alert marked as resolved',
      alertId,
    });
  } catch (error) {
    console.error('Error in alerts API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

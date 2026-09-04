import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET() {
  const settings = store.getSettings();
  return NextResponse.json(settings);
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const updated = store.updateSettings(body);
    return NextResponse.json({
      status: 'ok',
      message: 'System settings updated successfully',
      settings: updated,
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

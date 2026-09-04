import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  let cycles = store.getCycles();

  if (startDate) {
    const startMs = new Date(startDate).getTime();
    cycles = cycles.filter((c) => new Date(c.startTime).getTime() >= startMs);
  }

  if (endDate) {
    const endMs = new Date(endDate).getTime() + 86400000; // include end day
    cycles = cycles.filter((c) => new Date(c.startTime).getTime() <= endMs);
  }

  if (format === 'csv') {
    const csvHeaders = 'No,Tanggal,Waktu Mulai,Waktu Selesai,Durasi (Menit),Volume (Liter),Status\n';
    const csvRows = cycles
      .map((c, idx) => {
        const start = new Date(c.startTime);
        const end = c.endTime ? new Date(c.endTime) : null;
        const dateStr = start.toISOString().split('T')[0];
        const startStr = start.toTimeString().split(' ')[0];
        const endStr = end ? end.toTimeString().split(' ')[0] : 'Aktif';
        return `${idx + 1},${dateStr},${startStr},${endStr},${c.durationMinutes},${c.totalVolume},${c.status}`;
      })
      .join('\n');

    return new NextResponse(csvHeaders + csvRows, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="riwayat_siklus_tandon_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  }

  return NextResponse.json({
    cycles,
    totalCount: cycles.length,
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { dispatchStagingItems } from '@/lib/services/scraperStagingService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { stagingIds, destination, dispatchedBy } = body;

    if (!Array.isArray(stagingIds) || stagingIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Pilih minimal satu data staging untuk dikirim' },
        { status: 400 }
      );
    }

    if (destination !== 'DISMANTLE' && destination !== 'WORK_LOG') {
      return NextResponse.json(
        { success: false, error: 'Tujuan harus DISMANTLE atau WORK_LOG' },
        { status: 400 }
      );
    }

    const result = await dispatchStagingItems(stagingIds, destination, dispatchedBy);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error || 'Gagal mengirim data' }, { status: 500 });
    }
    return NextResponse.json({
      success: true,
      message: `Berhasil mengirim ${result.dispatchedCount} data ke ${destination === 'DISMANTLE' ? '/dismantles' : '/pekerjaan'}`,
      dispatchedCount: result.dispatchedCount,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mengirim data staging' },
      { status: 500 }
    );
  }
}

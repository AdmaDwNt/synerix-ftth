import { NextRequest, NextResponse } from 'next/server';
import {
  parseRawBillingnesiaText,
  checkDuplicationAndStage,
  getStagingItems,
  deleteStagingItem,
} from '@/lib/services/scraperStagingService';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = (searchParams.get('status') as any) || 'ALL';
    const items = await getStagingItems(filter);
    return NextResponse.json({ success: true, data: items });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memuat staging items' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawText = body.rawText;
    if (!rawText || typeof rawText !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Teks Billingnesia mentah wajib diisi' },
        { status: 400 }
      );
    }

    // 100% Rule-based parsing (no AI)
    const parsed = parseRawBillingnesiaText(rawText);
    if (parsed.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Tidak ditemukan pola data tiket/pelanggan valid pada teks.' },
        { status: 422 }
      );
    }

    const staged = await checkDuplicationAndStage(parsed);
    return NextResponse.json({
      success: true,
      message: `Berhasil memproses ${staged.length} data ke antrean staging.`,
      data: staged,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memproses data staging' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID wajib diisi' }, { status: 400 });
    }
    await deleteStagingItem(id);
    return NextResponse.json({ success: true, message: 'Item berhasil dihapus' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

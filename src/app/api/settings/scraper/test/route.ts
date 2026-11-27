import { NextRequest, NextResponse } from 'next/server';
import { testBillingnesiaConnection } from '@/lib/services/scraperConfigService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await testBillingnesiaConnection(body.baseUrl);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, reachable: false, error: error.message || 'Koneksi gagal' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getActiveScraperConfig, updateScraperConfig } from '@/lib/services/scraperConfigService';
import { logSecurityAudit } from '@/lib/services/auditLogService';

export async function GET() {
  try {
    const config = await getActiveScraperConfig();
    return NextResponse.json({ success: true, data: config });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memuat konfigurasi scraper' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const updated = await updateScraperConfig(body);
    if (!updated.success) {
      return NextResponse.json({ success: false, error: updated.error || 'Gagal memperbarui konfigurasi' }, { status: 500 });
    }

    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await logSecurityAudit({
      category: 'DATA_ACTIVITY',
      action: 'UPDATE_SCRAPER_CONFIG',
      severity: 'INFO',
      ipAddress: clientIp,
      details: {
        baseUrl: updated.data?.base_url,
        timeoutMs: updated.data?.timeout_ms,
        updatedBy: body.updatedBy || 'SUPERADMIN',
      },
    });

    return NextResponse.json({ success: true, data: updated.data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memperbarui konfigurasi scraper' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getAllFeatureFlags, updateFeatureFlag } from '@/lib/services/featureFlagsService';
import { logSecurityAudit } from '@/lib/services/auditLogService';

export async function GET() {
  try {
    const flags = await getAllFeatureFlags();
    return NextResponse.json({ success: true, data: flags });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memuat feature flags' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { key, isEnabled, updatedBy } = body;

    if (!key || typeof isEnabled !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Key dan isEnabled wajib diisi' },
        { status: 400 }
      );
    }

    const updated = await updateFeatureFlag(key, isEnabled, updatedBy);

    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await logSecurityAudit({
      category: 'DATA_ACTIVITY',
      action: 'UPDATE_FEATURE_FLAG',
      severity: 'INFO',
      ipAddress: clientIp,
      details: { key, isEnabled, updatedBy },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mengubah feature flag' },
      { status: 500 }
    );
  }
}

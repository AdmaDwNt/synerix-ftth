import { NextRequest, NextResponse } from 'next/server';
import { blockIpAddress, unblockIpAddress } from '@/lib/services/auditLogService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ipAddress, action, reason, blockedBy } = body;

    if (!ipAddress) {
      return NextResponse.json({ success: false, error: 'Alamat IP wajib diisi' }, { status: 400 });
    }

    if (action === 'UNBLOCK') {
      const result = await unblockIpAddress(ipAddress, blockedBy || 'SUPERADMIN');
      return NextResponse.json(result);
    } else {
      const result = await blockIpAddress(
        ipAddress,
        reason || 'Manual block by Superadmin',
        blockedBy || 'SUPERADMIN'
      );
      return NextResponse.json(result);
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mengubah status blokir IP' },
      { status: 500 }
    );
  }
}

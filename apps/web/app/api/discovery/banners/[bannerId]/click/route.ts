import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// Allowed external domains to prevent open redirect vulnerabilities
const ALLOWED_EXTERNAL_HOSTS = ['kigolive.com', 'popolive.com', 'www.popolive.com'];

function isSafeDestination(dest: string): boolean {
  if (!dest) return false;
  // Internal relative routes are safe
  if (dest.startsWith('/') && !dest.startsWith('//')) {
    return true;
  }
  // External URLs must use HTTPS and belong to allowed hosts
  try {
    const url = new URL(dest);
    return url.protocol === 'https:' && ALLOWED_EXTERNAL_HOSTS.includes(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { bannerId: string } }
) {
  try {
    const { bannerId } = params;
    if (!bannerId) {
      return NextResponse.json({ success: false, error: 'Banner ID is required.' }, { status: 400 });
    }

    // Check banner exists
    const bannerRows = await query<any>(
      `SELECT id, destination, active FROM popolive.discovery_banners WHERE id = $1 LIMIT 1`,
      [bannerId]
    );

    if (!bannerRows || bannerRows.length === 0) {
      return NextResponse.json({ success: false, error: 'Banner not found.' }, { status: 404 });
    }

    const banner = bannerRows[0];
    const user = await getAuthenticatedUser(req);
    const userId = user?.id || null;

    // Hash client IP for privacy preservation
    const forwardedFor = req.headers.get('x-forwarded-for') || '';
    const ip = forwardedFor.split(',')[0].trim() || '127.0.0.1';
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex').substring(0, 32);
    const userAgent = (req.headers.get('user-agent') || '').substring(0, 500);

    // Record click asynchronously
    await query(
      `INSERT INTO popolive.banner_clicks (banner_id, user_id, ip_hash, user_agent)
       VALUES ($1, $2, $3, $4)`,
      [bannerId, userId, ipHash, userAgent]
    );

    const safeDest = isSafeDestination(banner.destination) ? banner.destination : '/ranking';

    return NextResponse.json({
      success: true,
      bannerId: banner.id,
      destination: safeDest,
      tracked: true,
    });
  } catch (error: any) {
    console.error('Error tracking banner click:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record banner click', details: error.message },
      { status: 500 }
    );
  }
}

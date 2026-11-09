import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get('roomId') || '880219';
    const simulateWeak = searchParams.get('simulate') === 'weak';

    if (simulateWeak) {
      return NextResponse.json({
        success: true,
        roomId,
        telemetry: {
          connectionState: 'CONNECTED',
          networkQuality: 'poor',
          qualityScore: 4,
          rttMs: 380,
          packetLossRate: '8.4%',
          uplinkBandwidthKbps: 650,
          downlinkBandwidthKbps: 1100,
          activeBitrateKbps: 600,
          estimatedUsage: {
            durationSeconds: 900,
            bytesUploaded: 67500000,
            bytesDownloaded: 67500000,
            formattedUsage: '67.5 MB',
          },
          warnings: [
            {
              type: 'weak_network',
              severity: 'warning',
              message: 'Weak internet connection detected. Data Cost Guard reduced stream bitrate to maintain smooth audio.',
            },
          ],
        },
      });
    }

    // Default healthy high-performance telemetry
    return NextResponse.json({
      success: true,
      roomId,
      telemetry: {
        connectionState: 'CONNECTED',
        networkQuality: 'excellent',
        qualityScore: 1,
        rttMs: 24,
        packetLossRate: '0.1%',
        uplinkBandwidthKbps: 4500,
        downlinkBandwidthKbps: 9200,
        activeBitrateKbps: 2400,
        estimatedUsage: {
          durationSeconds: 900,
          bytesUploaded: 270000000,
          bytesDownloaded: 270000000,
          formattedUsage: '270 MB',
        },
        warnings: [],
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/live/quality/network-stats:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to retrieve network statistics' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getHelpTopics } from '@/lib/finalApiService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const topics = await getHelpTopics();
    return NextResponse.json({
      success: true,
      topics,
      count: topics.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message, code: err.code || 'HELP_TOPICS_ERROR' },
      { status: err.status || 500 }
    );
  }
}

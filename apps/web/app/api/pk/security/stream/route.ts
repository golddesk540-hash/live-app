import { NextRequest } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(
        encoder.encode(
          `event: connected\ndata: ${JSON.stringify({
            connectedAt: Date.now(),
            service: 'pk:security:stream',
          })}\n\n`
        )
      );

      let lastReportId: string | null = null;
      let lastEventId: string | null = null;

      const pollSecurityState = async () => {
        try {
          // 1. Check for newly submitted reports
          let reportSql = `SELECT id, battle_id, category, status, created_at FROM popolive.pk_abuse_reports`;
          const reportParams: any[] = [];
          if (lastReportId) {
            reportSql += ` WHERE created_at > (SELECT created_at FROM popolive.pk_abuse_reports WHERE id = $1) ORDER BY created_at ASC LIMIT 5`;
            reportParams.push(lastReportId);
          } else {
            reportSql += ` ORDER BY created_at DESC LIMIT 1`;
          }

          const newReports = await query<any>(reportSql, reportParams);
          for (const rep of newReports) {
            lastReportId = rep.id;
            controller.enqueue(
              encoder.encode(
                `event: pk:report_submitted\ndata: ${JSON.stringify({
                  id: rep.id,
                  battleId: rep.battle_id,
                  category: rep.category,
                  status: rep.status,
                  createdAt: rep.created_at,
                })}\n\n`
              )
            );
          }

          // 2. Check for security alerts / flags
          let eventSql = `SELECT id, user_id, battle_id, event_type, severity, reason, created_at FROM popolive.pk_security_events`;
          const eventParams: any[] = [];
          if (lastEventId) {
            eventSql += ` WHERE created_at > (SELECT created_at FROM popolive.pk_security_events WHERE id = $1) ORDER BY created_at ASC LIMIT 5`;
            eventParams.push(lastEventId);
          } else {
            eventSql += ` ORDER BY created_at DESC LIMIT 1`;
          }

          const newEvents = await query<any>(eventSql, eventParams);
          for (const ev of newEvents) {
            lastEventId = ev.id;
            controller.enqueue(
              encoder.encode(
                `event: pk:activity_flagged\ndata: ${JSON.stringify({
                  id: ev.id,
                  battleId: ev.battle_id,
                  eventType: ev.event_type,
                  severity: ev.severity,
                  reason: ev.reason,
                  createdAt: ev.created_at,
                })}\n\n`
              )
            );
          }
        } catch (_) {}
      };

      const interval = setInterval(pollSecurityState, 2500);

      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        try {
          controller.close();
        } catch (_) {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}

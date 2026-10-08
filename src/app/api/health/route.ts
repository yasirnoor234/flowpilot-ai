import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  let dbStatus = 'disconnected';
  let dbLatencyMs = 0;
  let workspaceCount = 0;

  try {
    const supabase = createAdminClient();
    const dbStart = Date.now();
    const { count, error } = await supabase
      .from('workspaces')
      .select('*', { count: 'exact', head: true });

    dbLatencyMs = Date.now() - dbStart;

    if (!error) {
      dbStatus = 'healthy';
      workspaceCount = count || 0;
    } else {
      dbStatus = 'degraded';
    }
  } catch {
    dbStatus = 'unreachable';
  }

  // Check Inngest configuration
  const inngestConfigured = Boolean(
    process.env.INNGEST_EVENT_KEY || process.env.INNGEST_SIGNING_KEY || process.env.NODE_ENV === 'development'
  );

  // Check Encryption configuration
  const encryptionConfigured = Boolean(
    process.env.ENCRYPTION_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Check AI Provider mode
  const aiProvider = process.env.OPENAI_API_KEY ? 'openai' : 'mock_demo_adapter';

  // Check Email Provider mode
  const emailProvider = process.env.RESEND_API_KEY ? 'resend' : 'mock_demo_adapter';

  // Check Slack Provider mode
  const slackProvider = process.env.SLACK_WEBHOOK_URL ? 'slack_live' : 'mock_demo_adapter';

  const isHealthy = dbStatus === 'healthy' || dbStatus === 'degraded';
  const totalLatencyMs = Date.now() - startTime;

  return NextResponse.json(
    {
      status: isHealthy ? 'healthy' : 'unhealthy',
      app: 'FlowPilot AI',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database: {
          status: dbStatus,
          latency_ms: dbLatencyMs,
          workspaces_active: workspaceCount,
        },
        inngest_orchestrator: {
          status: inngestConfigured ? 'ready' : 'unconfigured',
          serve_path: process.env.INNGEST_SERVE_PATH || '/api/inngest',
        },
        encryption_service: {
          status: encryptionConfigured ? 'ready' : 'fallback_mode',
          algorithm: 'AES-256-GCM',
        },
        integrations: {
          ai: aiProvider,
          email: emailProvider,
          slack: slackProvider,
        },
      },
      response_time_ms: totalLatencyMs,
    },
    {
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  );
}

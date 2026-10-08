import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { dispatchWorkflowExecution } from '@/lib/inngest/dispatch';
import { upsertLeadRecord } from '@/lib/crm/leads';
import type { WebhookEndpointRecord } from '@/types/crm';
import type { WorkflowRecord } from '@/types/workflow';

// Simple in-memory sliding window rate limiter for webhook slugs
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(slug: string, limitPerMinute: number = 60): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(slug);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(slug, { count: 1, resetTime: now + 60000 });
    return true;
  }

  if (entry.count >= limitPerMinute) {
    return false;
  }

  entry.count++;
  return true;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // 1. Check body size limit (Max 1MB)
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > 1024 * 1024) {
    return NextResponse.json(
      { error: 'Payload too large. Maximum size is 1MB.' },
      { status: 413 }
    );
  }

  // 2. Rate Limiting Check
  if (!checkRateLimit(slug, 60)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Maximum 60 requests per minute.' },
      { status: 429 }
    );
  }

  // 3. Extract Secret Token from Header or Query
  const authHeader = request.headers.get('authorization') || '';
  const headerSecret =
    request.headers.get('x-flowpilot-secret') ||
    request.headers.get('x-webhook-secret');
  const querySecret = request.nextUrl.searchParams.get('secret');

  const providedSecret =
    headerSecret ||
    querySecret ||
    (authHeader.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : null);

  const supabase = createAdminClient();

  // 4. Find Webhook Endpoint and associated Workflow
  const { data: endpointData, error: epError } = await supabase
    .from('webhook_endpoints')
    .select(`
      id,
      workspace_id,
      workflow_id,
      path_slug,
      secret_token,
      is_active,
      total_requests_count,
      workflows (
        id,
        name,
        status,
        active_version_id
      )
    `)
    .eq('path_slug', slug)
    .maybeSingle();

  if (epError || !endpointData) {
    return NextResponse.json(
      { error: `Webhook endpoint "/${slug}" not found.` },
      { status: 404 }
    );
  }

  const endpoint = endpointData as unknown as WebhookEndpointRecord & {
    workflows: WorkflowRecord | null;
  };

  // 5. Authenticate Secret Token
  if (!providedSecret || providedSecret !== endpoint.secret_token) {
    return NextResponse.json(
      { error: 'Unauthorized: Invalid or missing webhook secret token.' },
      { status: 401 }
    );
  }

  // 6. Check Active Status
  const workflow = endpoint.workflows;
  if (!endpoint.is_active || !workflow || workflow.status !== 'active') {
    return NextResponse.json(
      { error: 'Forbidden: Workflow is inactive or disabled.' },
      { status: 403 }
    );
  }

  if (!workflow.active_version_id) {
    return NextResponse.json(
      { error: 'Bad Request: Workflow has no active published version snapshot.' },
      { status: 400 }
    );
  }

  // 7. Parse Payload
  let payload: Record<string, any> = {};
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON payload received.' },
      { status: 400 }
    );
  }

  // 8. Extract Idempotency Key
  const idempotencyKey =
    request.headers.get('x-idempotency-key') ||
    payload.idempotency_key ||
    `wh_${slug}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  try {
    // 9. Synchronously Upsert Lead Record in Built-in CRM
    const leadEmail = payload.email || payload.lead_email || null;
    const leadName =
      payload.name ||
      payload.full_name ||
      (payload.first_name ? `${payload.first_name} ${payload.last_name || ''}`.trim() : null) ||
      'Inbound Lead';

    const { lead } = await upsertLeadRecord(
      {
        workspace_id: endpoint.workspace_id,
        name: leadName,
        email: leadEmail,
        phone: payload.phone || null,
        company: payload.company || null,
        source: 'webhook',
        service_interest: payload.service_interest || payload.service || null,
        message: payload.message || payload.comments || null,
        estimated_budget: payload.budget || payload.estimated_budget || null,
        status: 'new',
        custom_attributes: {
          webhook_slug: slug,
          raw_payload: payload,
        },
      },
      {
        activityType: 'webhook_received',
        activityTitle: `Webhook received on /${slug}`,
        activityMetadata: {
          path_slug: slug,
          idempotency_key: idempotencyKey,
        },
      }
    );

    // 10. Update endpoint statistics
    await supabase
      .from('webhook_endpoints')
      .update({
        total_requests_count: (endpoint.total_requests_count || 0) + 1,
        last_requested_at: new Date().toISOString(),
      } as unknown as never)
      .eq('id', endpoint.id);

    // 11. Dispatch Workflow Execution Asynchronously
    const dispatchResult = await dispatchWorkflowExecution({
      workspaceId: endpoint.workspace_id,
      workflowId: workflow.id,
      versionId: workflow.active_version_id,
      triggerType: 'webhook',
      triggerPayload: {
        ...payload,
        lead_id: lead.id,
        webhook_slug: slug,
      },
      idempotencyKey,
    });

    return NextResponse.json(
      {
        success: true,
        accepted: true,
        message: 'Lead captured and workflow execution queued.',
        lead: {
          id: lead.id,
          name: lead.name,
          email: lead.email,
          status: lead.status,
          qualification_status: lead.qualification_status,
        },
        run_id: dispatchResult.runId,
        is_duplicate: dispatchResult.isDuplicate,
      },
      { status: 202 }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

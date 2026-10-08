# FlowPilot AI — Production Deployment & Smoke-Test Operations Guide

This guide provides step-by-step instructions for deploying FlowPilot AI to production, configuring third-party providers (Supabase, Inngest, OpenAI, Resend, Slack), and executing smoke tests.

---

## 1. Production Architecture & Target Environment

- **Hosting Platform:** Vercel (Edge / Serverless Node.js 20+)
- **Custom Domain:** `flowpilot.codexvetech.com`
- **Database & Auth:** Supabase (PostgreSQL 15+ with pgvector & Row Level Security)
- **Durable Workflow Orchestrator:** Inngest Cloud (`/api/inngest`)
- **AI Intelligence:** OpenAI (GPT-4o, GPT-4o-mini) + Enterprise Prompt Fencing
- **Transactional Email:** Resend (`notifications@flowpilot.codexvetech.com`)
- **Team Alerts:** Slack (Incoming Webhook with strict `hooks.slack.com` SSRF validation)

---

## 2. Environment Configuration Reference

Ensure the following environment variables are configured in the Vercel Project Settings under **Settings > Environment Variables**:

| Variable | Required | Description | Example |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_APP_URL` | **Yes** | Canonical production application URL | `https://flowpilot.codexvetech.com` |
| `NODE_ENV` | **Yes** | Node environment | `production` |
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | Supabase project API URL | `https://zxojkszfxqdgbnuggjli.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | Supabase anonymous public client key | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | Supabase service-role key (Server only) | `eyJhbGciOi...` |
| `INNGEST_EVENT_KEY` | **Yes** | Inngest Cloud production event key | `ing_prod_...` |
| `INNGEST_SIGNING_KEY` | **Yes** | Inngest Cloud signing key for `/api/inngest` | `signkey-prod-...` |
| `INNGEST_SERVE_PATH` | No | Path to Inngest handler (default: `/api/inngest`) | `/api/inngest` |
| `ENCRYPTION_SECRET_KEY` | **Yes** | 32-byte hexadecimal key for AES-256-GCM secret encryption | `32_byte_hex_string` |
| `OPENAI_API_KEY` | Optional | OpenAI API key (falls back to mock demo adapter if omitted) | `sk-proj-...` |
| `OPENAI_MODEL` | No | OpenAI model name (default: `gpt-4o-mini`) | `gpt-4o-mini` |
| `RESEND_API_KEY` | Optional | Resend API key for outbound emails | `re_...` |
| `RESEND_FROM_EMAIL` | Optional | Verified sender email address | `FlowPilot AI <notifications@flowpilot.codexvetech.com>` |
| `SLACK_WEBHOOK_URL` | Optional | Default fallback Slack incoming webhook URL | `https://hooks.slack.com/services/...` |
| `ENABLE_DEMO_ADAPTERS` | No | Fallback toggle to allow mock adapters for demos | `true` |

---

## 3. Database Migration & Seed Execution

1. **Apply Migrations in Supabase Dashboard (SQL Editor)** or via Supabase CLI:
   ```bash
   # Run sequentially:
   supabase/migrations/20261007000001_initial_auth_and_workspaces.sql
   supabase/migrations/20261007000002_fix_workspace_creation_rls.sql
   supabase/migrations/20261007000003_workflows_and_versions.sql
   supabase/migrations/20261008000001_workflow_execution_engine.sql
   supabase/migrations/20261008000002_crm_and_webhooks.sql
   supabase/migrations/20261008000003_integrations_and_connections.sql
   ```

2. **Verify Row Level Security (RLS)**:
   Ensure all tables have RLS enabled:
   - `workspaces`
   - `workspace_members`
   - `workflows`
   - `workflow_versions`
   - `workflow_runs`
   - `workflow_step_runs`
   - `trigger_events`
   - `leads`
   - `lead_activities`
   - `webhook_endpoints`
   - `integration_connections`
   - `integration_action_attempts`

---

## 4. Inngest Cloud Orchestration Setup

1. **Connect Inngest to Production App**:
   - Log into [Inngest Cloud Dashboard](https://app.inngest.com).
   - Create a production app named `FlowPilot AI`.
   - Set the App URL to `https://flowpilot.codexvetech.com/api/inngest`.
   - Copy the generated `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` into Vercel environment variables.
2. **Verify Inngest Sync**:
   - In Inngest Cloud, trigger a **Sync Apps** check.
   - Confirm that the function `flowpilot-workflow-executor` (`workflow/execute`) is registered and active.

---

## 5. Resend Email Domain Verification

1. In the [Resend Console](https://resend.com/domains), add `flowpilot.codexvetech.com`.
2. Add the required DNS records in your domain registrar (e.g. Cloudflare / Namecheap):
   - **DKIM:** TXT record `resend._domainkey.flowpilot.codexvetech.com`
   - **SPF:** TXT record `flowpilot.codexvetech.com` with `v=spf1 include:amazonses.com ~all`
   - **DMARC:** TXT record `_dmarc.flowpilot.codexvetech.com` with `v=DMARC1; p=none;`
3. Verify status transitions to **Verified** in Resend.

---

## 6. Slack Incoming Webhook Setup

1. In your Slack Workspace, navigate to **Apps > Incoming WebHooks**.
2. Add a new Webhook targeting channel `#hot-leads-vip` or `#general`.
3. Copy the Webhook URL (must begin with `https://hooks.slack.com/services/`).
4. Enter the Webhook URL in FlowPilot **Integrations** or configure as `SLACK_WEBHOOK_URL`.

---

## 7. Custom Domain Setup on Vercel

1. Open your Vercel Project Dashboard for FlowPilot.
2. Navigate to **Settings > Domains**.
3. Add domain: `flowpilot.codexvetech.com`.
4. Configure DNS CNAME record:
   - **Host:** `flowpilot`
   - **Type:** `CNAME`
   - **Value:** `cname.vercel-dns.com`
5. Wait for Vercel SSL certificate provisioning (automatic Let's Encrypt TLS).

---

## 8. Smoke-Test Verification Checklist

Execute the automated smoke-test suite and perform manual sanity checks:

### Automated Smoke Tests:
```bash
npx tsx scripts/run-phase9-smoke-tests.ts
npx tsx scripts/run-e2e-verification.ts
```

### Manual Sanity Verification:
- [ ] **Health Check:** Open `https://flowpilot.codexvetech.com/api/health` and verify `status: "healthy"`.
- [ ] **Authentication:** Register a new user, log in, verify workspace creation.
- [ ] **Templates:** Navigate to **Overview**, click **Use Template** on "Lead Qualification & Response", verify draft loads in builder.
- [ ] **Webhook Ingestion:** Send a POST request to `/api/v1/webhook/[slug]` with `x-webhook-secret` and verify `202 Accepted`.
- [ ] **Lead CRM:** Confirm lead is upserted in `/leads` with AI qualification score and tags.
- [ ] **Runs Audit:** Open `/runs/[id]` and confirm step logs are visible with secrets masked/redacted.
- [ ] **Demo Sandbox:** In demo workspace, confirm banner is visible and click **Reset Demo Data** to refresh synthetic leads.

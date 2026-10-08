# FlowPilot AI — Implementation Status & Roadmap

## 1. Project Phase Tracker

| Phase | Phase Name | Status | Description |
| :--- | :--- | :--- | :--- |
| **Phase 0** | **Project Initialization & Architecture Specs** | **COMPLETED** | Repository scaffolded (Next.js 16, React 19, Tailwind, TS), core dependencies installed, planning docs created (`product-scope.md`, `architecture.md`, `data-model.md`, `implementation-status.md`, `.env.example`). |
| **Phase 1** | **Supabase Data Layer, Auth & Workspace RLS** | **COMPLETED** | Auth pages (Sign up, Sign in, Sign out, Password reset), protected route middleware, workspace onboarding, workspace membership & roles (Owner/Member), dashboard shell with sidebar navigation (Overview, Workflows, Leads, Integrations, Runs, Settings), versioned Supabase migrations with strict RLS policies and seed scripts. |
| **Phase 2** | **Workflow Persistence & Publishing Engine** | **COMPLETED** | Tables `workflows` and `workflow_versions` with RLS; 9 typed node schemas (Manual trigger, Webhook trigger, Field mapping, IF/ELSE condition, CRM upsert, AI qualification, Email send, Slack notification, Delay); DAG graph validation engine rejecting cycles, missing/multiple triggers, unreachable nodes, branch merges, and invalid upstream references; immutable version snapshotting; workflow list & detail management UI. |
| **Phase 3** | **Durable Execution Engine (Inngest)** | **COMPLETED** | Inngest function handlers, DAG linearization runner with step memoization & durable sleep timers, server-side node executor registry for all 9 node types, safe declarative field expression resolver without `eval()`, mid-flight cancellation & linked reruns, run & step audit logs (`workflow_runs`, `workflow_step_runs`, `trigger_events`), Runs UI history table (`/runs`) and run detail inspector screen (`/runs/[id]`), plus Test Run trigger on workflow detail. |
| **Phase 4** | **Visual Workflow Builder (React Flow)** | **COMPLETED** | Drag-and-drop canvas powered by `@xyflow/react`, categorized node palette (Triggers, Logic, AI, Integrations), custom node cards & connection handles with labeled IF/ELSE TRUE/FALSE outputs, node configuration inspector side panel with dynamic variable tag inserters, zoom, pan, minimap, dirty state tracking, live test run status overlay, and mobile responsive overview fallback. |
| **Phase 5** | **Lead Capture & Built-in CRM Engine** | **COMPLETED** | Migration for `leads`, `lead_activities`, and `webhook_endpoints`; email normalization (`lower(trim(email))`) & alternate identity strategy; public authenticated webhook ingestion API (`/api/v1/webhook/[slug]`) with per-endpoint secret token auth, secret rotation, 1MB size limit, rate limiting, and idempotency key support; CRM upsert node executor; Leads inbox table with search, filters, pagination; Lead detail inspector with AI qualification card and chronological activity timeline with manual notes; interactive webhook tester with copyable cURL, JS, Python snippets. |
| **Phase 6** | **End-to-End Verification & Hardening** | In Progress / Next | Comprehensive integration tests with primary MVP lead flow, mock/live environment switching, error recovery, and production readiness check. |

---

## 2. Component & Subsystem Status Matrix

| Subsystem | Components | Status | Notes |
| :--- | :--- | :--- | :--- |
| **Core Framework** | Next.js 16 App Router, TypeScript 5, Tailwind CSS | Ready | Clean scaffold initialized in workspace |
| **Auth System** | Sign in, Sign up, Forgot/Update password, Sign out | Ready | Supabase Auth SSR with Server Actions & middleware protection |
| **Workspace & RLS** | Multi-tenant isolation, Owner/Member roles, Switcher | Ready | Postgres RLS policies in `20261007000001_initial_auth_and_workspaces.sql` & `20261008000002_crm_and_webhooks.sql` |
| **Workflow Persistence** | Draft CRUD, JSON persistence, status toggle | Ready | `src/lib/actions/workflows.ts` & `workflows` table |
| **Validation Engine** | DAG cycle check, single trigger, no branch merge, Zod | Ready | `src/lib/workflow/validator.ts` with 9 automated unit tests |
| **Publishing & Versions** | Immutable version snapshotting, version history | Ready | `workflow_versions` table with RLS and snapshot viewer |
| **Visual Builder Canvas** | Drag & drop, palette, minimap, connection handles, zoom | Ready | `src/components/workflow/canvas/` with `@xyflow/react` |
| **Node Inspector** | Dynamic forms for 9 node types, tag inserter | Ready | `src/components/workflow/canvas/node-config-panel.tsx` |
| **Orchestration & Inngest** | Inngest client, `/api/inngest` route, `workflow.execute` function | Ready | Durable execution with `step.run`, `step.sleep`, and fallback direct runner |
| **Execution Engine** | DAG linearizer, expression resolver, bounds checker | Ready | Maximum 50 nodes, 1MB payload limits, zero `eval()` |
| **Node Executors Registry** | Triggers, Field Mapping, IF/ELSE, Delay, AI Qualify, CRM, Email, Slack | Ready | `src/lib/workflow/executor/node-executors.ts` |
| **Execution Logs & UI** | Runs table, Run Detail inspector, JSON view, Cancel & Rerun | Ready | `/runs` and `/runs/[id]` with timeline, badges, and step drawers |
| **Built-in CRM** | Leads table, Lead Detail view, AI ratings, Activity timeline | Ready | `/leads` and `/leads/[id]` with search, filters, pagination, and note creation |
| **Webhook Ingestion** | `/api/v1/webhook/[slug]`, secret auth, rate limiting, deduplication | Ready | Fast acceptance (`202 Accepted`), async workflow dispatch, 1MB limit |
| **Lead Normalization** | Email normalization `lower(trim(email))`, alternate fallback key | Ready | `src/lib/crm/leads.ts` with workspace-scoped deduplication |
| **Webhook Tester** | Live tester form, secret rotation, cURL/JS/Python snippets | Ready | `/integrations` and `src/components/integrations/webhook-tester.tsx` |

---

## 3. Phase 5 Verification & Testing Checklist

- [x] Versioned Supabase migration `20261008000002_crm_and_webhooks.sql` created for `leads`, `lead_activities`, and `webhook_endpoints` with workspace RLS
- [x] Defined email normalization rule `lower(trim(email))` with workspace-scoped uniqueness
- [x] Defined alternate identity strategy for leads without email (phone, external_id, or synthetic unique fallback key)
- [x] CRM upsert executor node integrated with durable workflow engine
- [x] Public webhook trigger endpoint (`/api/v1/webhook/[slug]`) with per-endpoint secret token authentication
- [x] Secret rotation support with UI and server action
- [x] Webhook payload size limits (1MB) and rate limiting (60 req/min)
- [x] Webhook idempotency key support and duplicate event suppression
- [x] Fast acceptance response (`202 Accepted`) after durable lead persistence and asynchronous workflow trigger
- [x] Inactive or disabled workflows strictly reject incoming webhook runs with `403 Forbidden`
- [x] Leads table view (`/leads`) with search, status filters, AI qualification tier filters, and pagination
- [x] Lead detail page (`/leads/[id]`) with AI qualification scorecard, contact info, status updater, and chronological activity timeline with note creation
- [x] Authenticated sample lead form and copyable cURL / JavaScript / Python request generator on `/integrations`
- [x] Automated test suite `scripts/run-crm-webhook-tests.ts` passing (13/13 tests)
- [x] TypeScript type check (`npx tsc --noEmit`) passing with 0 errors
- [x] Production build (`npm run build`) passing cleanly

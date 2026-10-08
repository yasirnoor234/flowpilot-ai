# FlowPilot AI — Implementation Status & Roadmap

## 1. Project Phase Tracker

| Phase | Phase Name | Status | Description |
| :--- | :--- | :--- | :--- |
| **Phase 0** | **Project Initialization & Architecture Specs** | **COMPLETED** | Repository scaffolded (Next.js 16, React 19, Tailwind, TS), core dependencies installed, planning docs created (`product-scope.md`, `architecture.md`, `data-model.md`, `implementation-status.md`, `.env.example`). |
| **Phase 1** | **Supabase Data Layer, Auth & Workspace RLS** | **COMPLETED** | Auth pages (Sign up, Sign in, Sign out, Password reset), protected route middleware, workspace onboarding, workspace membership & roles (Owner/Member), dashboard shell with sidebar navigation (Overview, Workflows, Leads, Integrations, Runs, Settings), versioned Supabase migrations with strict RLS policies and seed scripts. |
| **Phase 2** | **Workflow Persistence & Publishing Engine** | **COMPLETED** | Tables `workflows` and `workflow_versions` with RLS; 9 typed node schemas (Manual trigger, Webhook trigger, Field mapping, IF/ELSE condition, CRM upsert, AI qualification, Email send, Slack notification, Delay); DAG graph validation engine rejecting cycles, missing/multiple triggers, unreachable nodes, branch merges, and invalid upstream references; immutable version snapshotting; workflow list & detail management UI. |
| **Phase 3** | **Durable Execution Engine (Inngest)** | **COMPLETED** | Inngest function handlers, DAG linearization runner with step memoization & durable sleep timers, server-side node executor registry for all 9 node types, safe declarative field expression resolver without `eval()`, mid-flight cancellation & linked reruns, run & step audit logs (`workflow_runs`, `workflow_step_runs`, `trigger_events`), Runs UI history table (`/runs`) and run detail inspector screen (`/runs/[id]`), plus Test Run trigger on workflow detail. |
| **Phase 4** | **Built-in CRM & Execution Inspector UI** | In Progress / Next | Lead inbox table, lead detail drawer with AI qualification summary & timeline, integration health monitoring. |
| **Phase 5** | **End-to-End Verification & Hardening** | Pending | Comprehensive integration tests with primary MVP lead flow, mock/live environment switching, error recovery, and production readiness check. |

---

## 2. Component & Subsystem Status Matrix

| Subsystem | Components | Status | Notes |
| :--- | :--- | :--- | :--- |
| **Core Framework** | Next.js 16 App Router, TypeScript 5, Tailwind CSS | Ready | Clean scaffold initialized in workspace |
| **Auth System** | Sign in, Sign up, Forgot/Update password, Sign out | Ready | Supabase Auth SSR with Server Actions & middleware protection |
| **Workspace & RLS** | Multi-tenant isolation, Owner/Member roles, Switcher | Ready | Postgres RLS policies in `20261007000001_initial_auth_and_workspaces.sql` |
| **Workflow Persistence** | Draft CRUD, JSON persistence, status toggle | Ready | `src/lib/actions/workflows.ts` & `workflows` table |
| **Validation Engine** | DAG cycle check, single trigger, no branch merge, Zod | Ready | `src/lib/workflow/validator.ts` with 9 automated unit tests |
| **Publishing & Versions** | Immutable version snapshotting, version history | Ready | `workflow_versions` table with RLS and snapshot viewer |
| **Workflow UI** | Workflow list, Detail inspector, Validator checklist, Templates | Ready | `/workflows` and `/workflows/[id]` with Primary MVP template |
| **Orchestration & Inngest** | Inngest client, `/api/inngest` route, `workflow.execute` function | Ready | Durable execution with `step.run`, `step.sleep`, and fallback direct runner |
| **Execution Engine** | DAG linearizer, expression resolver, bounds checker | Ready | Maximum 50 nodes, 1MB payload limits, zero `eval()` |
| **Node Executors Registry** | Triggers, Field Mapping, IF/ELSE, Delay, AI Qualify, CRM, Email, Slack | Ready | `src/lib/workflow/executor/node-executors.ts` |
| **Execution Logs & UI** | Runs table, Run Detail inspector, JSON view, Cancel & Rerun | Ready | `/runs` and `/runs/[id]` with timeline, badges, and step drawers |
| **Built-in CRM** | Lead records, AI qualification fields, activity timeline | Schema Specified | UI and backend actions next in Phase 4 |

---

## 3. Required Environment Variables & Setup Blockers

| Key | Purpose | Required For | Fallback / Demo Available |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase API URL | Auth, Database, RLS | No (Requires Supabase project) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Anon Client Key | Client-side Session Handling | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Server Service Role Key | Server Auth / Inngest Background Runner | No (Server-only secret) |
| `INNGEST_EVENT_KEY` | Inngest Event Publishing | Dispatching workflow runs | Yes (Inngest Dev Server or built-in direct fallback) |
| `INNGEST_SIGNING_KEY` | Inngest Webhook Signing | Verifying Inngest function calls | Optional in local dev |
| `OPENAI_API_KEY` | AI Qualification (GPT-4o) | Live lead evaluation | **Yes** (Built-in Demo Adapter returns mock qualification) |
| `RESEND_API_KEY` | Outbound Email Dispatch | Live lead auto-responses | **Yes** (Built-in Demo Adapter logs email payload with idempotency key) |
| `SLACK_WEBHOOK_URL` | Team Channel Alerts | Live team alerts | **Yes** (Built-in Demo Adapter logs Slack payload) |

---

## 4. Phase 3 Verification & Testing Checklist

- [x] Versioned Supabase migration written for `workflow_runs`, `workflow_step_runs`, and `trigger_events` with RLS policies (`supabase/migrations/20261008000001_workflow_execution_engine.sql`)
- [x] Execution domain types & default bounds defined (`src/types/execution.ts`)
- [x] Safe declarative field expression resolver with prototype pollution guards and zero `eval()` (`src/lib/workflow/executor/expression-resolver.ts`)
- [x] Server-side node executor registry for all 9 node types with provider idempotency keys (`src/lib/workflow/executor/node-executors.ts`)
- [x] Core DAG execution engine with bounds enforcement, cancellation checks, step memoization, and conditional branch skipping (`src/lib/workflow/executor/workflow-engine.ts`)
- [x] Inngest client, endpoint handler (`/api/inngest`), and durable function `workflow.execute` (`src/lib/inngest/functions/workflow-executor.ts`)
- [x] Durable event dispatcher with idempotency and background recovery (`src/lib/inngest/dispatch.ts`)
- [x] Server actions for manual run triggers, linked reruns, and mid-flight cancellations (`src/lib/actions/execution.ts`)
- [x] Automated test runner passes 6/6 execution engine tests (`scripts/run-execution-tests.ts`)
- [x] Execution Runs table UI (`/runs`) with status filters, duration, trigger source, and rerun actions
- [x] Run Detail inspector screen (`/runs/[id]`) with step timeline, input/output JSON viewers, error sanitization, cancel & rerun controls
- [x] Manual "Test Run" trigger button and modal added to workflow editor (`/workflows/[id]`)
- [x] Type checking (`npx tsc --noEmit`) passes cleanly
- [x] Production build (`npm run build`) passes cleanly

# FlowPilot AI — Implementation Status & Roadmap

## 1. Project Phase Tracker

| Phase | Phase Name | Status | Description |
| :--- | :--- | :--- | :--- |
| **Phase 0** | **Project Initialization & Architecture Specs** | **COMPLETED** | Repository scaffolded (Next.js 16, React 19, Tailwind, TS), core dependencies installed, planning docs created (`product-scope.md`, `architecture.md`, `data-model.md`, `implementation-status.md`, `.env.example`). |
| **Phase 1** | **Supabase Data Layer, Auth & Workspace RLS** | **COMPLETED** | Auth pages (Sign up, Sign in, Sign out, Password reset), protected route middleware, workspace onboarding, workspace membership & roles (Owner/Member), dashboard shell with sidebar navigation (Overview, Workflows, Leads, Integrations, Runs, Settings), versioned Supabase migrations with strict RLS policies and seed scripts. |
| **Phase 2** | **Workflow Persistence & Publishing Engine** | **COMPLETED** | Tables `workflows` and `workflow_versions` with RLS; 9 typed node schemas (Manual trigger, Webhook trigger, Field mapping, IF/ELSE condition, CRM upsert, AI qualification, Email send, Slack notification, Delay); DAG graph validation engine rejecting cycles, missing/multiple triggers, unreachable nodes, branch merges, and invalid upstream references; immutable version snapshotting; workflow list & detail management UI. |
| **Phase 3** | **Durable Execution Engine (Inngest)** | Pending | Inngest function handlers, DAG linearization runner, step memoization, durable sleep timers, live/demo integration adapters (OpenAI, Resend, Slack, Webhook). |
| **Phase 4** | **Built-in CRM & Execution Inspector UI** | Pending | Lead inbox table, lead detail drawer with AI qualification summary & timeline, run history table, and step-by-step execution log viewer. |
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
| **Orchestration** | Inngest SDK, durable runner (`step.run`, `step.sleep`) | Dependencies Installed | Background execution handlers pending Phase 3 |
| **AI Action** | OpenAI SDK, structured schema parsing | Typed Schema Ready | Prompt template & demo adapter pending Phase 3 |
| **Email Action** | Resend SDK, email templating | Typed Schema Ready | Email dispatch handler & demo adapter pending Phase 3 |
| **Slack Action** | Slack Webhook poster | Typed Schema Ready | Webhook payload formatter & demo adapter pending Phase 3 |
| **Built-in CRM** | Lead records, AI qualification fields, activity timeline | Schema Specified | UI and backend actions pending Phase 4 |

---

## 3. Required Environment Variables & Setup Blockers

| Key | Purpose | Required For | Fallback / Demo Available |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase API URL | Auth, Database, RLS | No (Requires Supabase project) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Anon Client Key | Client-side Session Handling | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Server Service Role Key | Server Auth / Inngest Background Runner | No (Server-only secret) |
| `INNGEST_EVENT_KEY` | Inngest Event Publishing | Dispatching workflow runs | Yes (Inngest Dev Server can run locally) |
| `INNGEST_SIGNING_KEY` | Inngest Webhook Signing | Verifying Inngest function calls | Optional in local dev |
| `OPENAI_API_KEY` | AI Qualification (GPT-4o) | Live lead evaluation | **Yes** (Built-in Demo Adapter returns mock qualification) |
| `RESEND_API_KEY` | Outbound Email Dispatch | Live lead auto-responses | **Yes** (Built-in Demo Adapter logs email payload) |
| `SLACK_WEBHOOK_URL` | Team Channel Alerts | Live team alerts | **Yes** (Built-in Demo Adapter logs Slack payload) |

---

## 4. Phase 2 Verification & Testing Checklist

- [x] Versioned Supabase migration written for `workflows` and `workflow_versions` (`supabase/migrations/20261007000003_workflows_and_versions.sql`)
- [x] TypeScript & Zod schemas defined for all 9 node types (`src/types/workflow.ts`)
- [x] DAG Graph Validator created with 8 publication rejection rules (`src/lib/workflow/validator.ts`)
- [x] Automated test runner passes 9/9 validator tests (`scripts/run-validator-tests.ts`)
- [x] Workflow Server Actions created (create, rename, duplicate, delete, save draft, publish version, toggle status)
- [x] Workflow list UI (`/workflows`) with search, filters, template selector, duplicate/delete/rename
- [x] Workflow detail UI (`/workflows/[id]`) with live publication rules checklist, draft JSON editor, and version history
- [x] Type checking (`npx tsc --noEmit`) passes cleanly
- [x] Production build (`npm run build`) passes cleanly

# FlowPilot AI ⚡

> **Autonomous AI Workflow & Lead Operations Platform for Modern Enterprises.**  
> Effortlessly capture, qualify, route, and follow up with leads through durable, multi-step AI DAG pipelines with multi-tenant isolation, real-time CRM, and live integrations.

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://flowpilot.codexvetech.com)
[![Next.js](https://img.shields.io/badge/Next.js-16.4-black.svg)](https://nextjs.org/)
[![React Flow](https://img.shields.io/badge/React%20Flow-12.12-purple.svg)](https://reactflow.dev/)
[![Inngest](https://img.shields.io/badge/Inngest-Durable%20Execution-orange.svg)](https://www.inngest.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20RLS-emerald.svg)](https://supabase.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## 🌟 Overview

**FlowPilot AI** is an enterprise-ready business workflow automation engine designed to replace fragmented webhook tools with an integrated, durable, and type-safe AI pipeline that manages the entire lead-to-close journey.

### 🎯 Primary Production Architecture
```
[Inbound Webhook Intake / Form]
               │
               ▼
   [GPT-4o Lead Qualification]   ─── Evaluates intent, score (0-100), and tier (HOT/WARM/COOL)
               │
               ▼
      [Built-in CRM Upsert]      ─── Synchronizes normalized lead profile & activity log
               │
               ▼
     [Conditional Branching]     ─── Evaluates priority tier (HOT vs Standard)
       ├── Hot: Priority Slack Block Kit Alert + VIP Response
       └── Standard: Personalized Confirmation Email (Resend)
               │
               ▼
    [Durable Follow-Up Delay]    ─── 24h/72h Inngest sleep timer with live DB state re-reading
               │
               ▼
    [Eligibility & Follow-Up]    ─── Skips if lead is won/closed/opted-out; sends internal task
```

---

## 🛠 Tech Stack & Architecture

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | [Next.js 16 (App Router)](https://nextjs.org/) + TypeScript 5 | Fullstack React server components, server actions & API routes |
| **Visual Builder** | [@xyflow/react](https://reactflow.dev/) | Interactive DAG drag-and-drop workflow canvas with dynamic handles |
| **Styling & UI** | [Tailwind CSS v4](https://tailwindcss.com/) + Custom Design System | Dark mode, glassmorphism, responsive panels, accessible badges |
| **Database & Auth** | [Supabase PostgreSQL](https://supabase.com/) | Strict multi-tenant Row Level Security (RLS) & SSR auth |
| **Durable Engine** | [Inngest](https://www.inngest.com/) | Step memoization, sleep timers across deployments, retry backoff |
| **AI Intelligence** | [OpenAI](https://platform.openai.com/) (GPT-4o, GPT-4o-mini) | Structured JSON qualification, sentiment scoring, prompt fencing |
| **Integrations** | [Resend](https://resend.com/) & [Slack](https://api.slack.com/) | Transactional email & Block Kit alerts with AES-256-GCM encryption |

---

## 🚀 Key Subsystems & Features

### 1. Multi-Tenant Workspace & Strict RLS Isolation
- Complete tenant data isolation enforced at the PostgreSQL database level via Row Level Security (RLS) policies on all business tables.
- Workspace membership roles (`owner`, `member`) with server-side validation and session switcher.

### 2. Visual DAG Workflow Builder & Publication Engine
- Interactive builder canvas featuring a categorized node palette (Triggers, Logic, AI, Integrations).
- 9 typed node schemas with Zod validation.
- Graph validation engine enforcing 8 publication rules (rejects cycles, disconnected nodes, branch merges, missing/multiple triggers, and invalid upstream references).
- Immutable version snapshotting protecting active executions from in-flight draft changes.

### 3. Built-in CRM & High-Throughput Webhook Ingestion
- Public authenticated webhook endpoints (`/api/v1/webhook/[slug]`) with secret token authentication, secret rotation, 1MB payload limits, and rate limiting.
- Email normalization (`lower(trim(email))`) with workspace-scoped deduplication and alternate fallback identities.
- Leads inbox with multi-attribute filtering, search, pagination, and chronological activity timeline with manual notes.

### 4. Enterprise AI Provider & Security Fencing
- Structured JSON output validated by Zod for qualification scoring, intent classification, and email drafting.
- Anti-prompt injection boundary fencing (`wrapUntrustedInput`).
- Token usage tracking, latency recording, and workspace AI quota enforcement.
- Deterministic mock fallback adapter for offline or demo environments.

### 5. Live Email (Resend) & Slack Integrations
- Outbound transactional email delivery with verified sender requirements, idempotency keys, and demo mode safeguards.
- Slack Block Kit alert cards with direct deep-links to CRM lead records.
- Strict SSRF protection restricting Slack webhook targets to `hooks.slack.com`.
- AES-256-GCM server-side encryption for stored third-party credentials with automated secret redaction from logs (`redactSecrets`).

### 6. Durable Follow-ups & State Re-reading
- Durable delay steps (`step.sleep`) executing across hours or days.
- State re-reading: when a delay completes, the engine re-evaluates lead status directly from Postgres, cleanly skipping follow-ups if the deal has been won, closed, lost, or opted out.

### 7. Sandbox Demo Mode & Synthetic Leads
- Demo workspaces feature an amber sandbox banner with a one-click "Reset Demo Data" trigger.
- Prevents demo sessions from dispatching real external emails or webhook alerts.
- Populated with 5 realistic synthetic enterprise leads.

### 8. Operational Monitoring & Health Check
- Operational monitoring dashboard (`/overview`) with real database metrics and formula-backed estimated time saved.
- Public health check API (`/api/health`) reporting sanitized database, Inngest, and encryption status.

---

## ⚙️ Getting Started (Local Development)

### 1. Prerequisites
- **Node.js**: v20.x or v22.x
- **npm** or **pnpm**
- A [Supabase](https://supabase.com/) account & project
- An [Inngest](https://www.inngest.com/) account (or local Inngest CLI)

### 2. Clone & Install Dependencies
```bash
git clone https://github.com/yasirnoor234/flowpilot-ai.git
cd flowpilot-ai
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Populate the required configuration values:
```env
# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Supabase Database & Auth
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Inngest Background Orchestrator
INNGEST_EVENT_KEY=your-inngest-event-key
INNGEST_SIGNING_KEY=your-inngest-signing-key

# Integrations (Optional / Fallback Demo Adapters Built-in)
OPENAI_API_KEY=sk-...
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=FlowPilot AI <notifications@yourdomain.com>
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
ENCRYPTION_SECRET_KEY=your-32-byte-hex-secret-key
```

### 4. Apply Database Migrations
Execute the migrations in your Supabase SQL Editor in numerical order:
```bash
supabase/migrations/20261007000001_initial_auth_and_workspaces.sql
supabase/migrations/20261007000002_fix_workspace_creation_rls.sql
supabase/migrations/20261007000003_workflows_and_versions.sql
supabase/migrations/20261008000001_workflow_execution_engine.sql
supabase/migrations/20261008000002_crm_and_webhooks.sql
supabase/migrations/20261008000003_integrations_and_connections.sql
```

*(Optional)* Seed sample data with `supabase/seed.sql`.

### 5. Start the Development Server
```bash
npm run dev
```

In a separate terminal, launch the Inngest local dev runner:
```bash
npx inngest-cli@latest dev -u http://localhost:3000/api/inngest
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Automated Testing & Verification

Run the automated test suites:

```bash
# Phase 9 Launch & Smoke-Test Suite (23 tests)
npx tsx scripts/run-phase9-smoke-tests.ts

# Full E2E Workflow Verification Suite (27 tests)
npx tsx scripts/run-e2e-verification.ts

# Phase 2 Workflow Publication Validator (9 tests)
npx tsx scripts/run-validator-tests.ts

# Phase 3 Execution Engine Tests (6 tests)
npx tsx scripts/run-execution-tests.ts

# Phase 7 Integration Tests (21 tests)
npx tsx scripts/run-integration-tests.ts

# TypeScript Static Type Check
npx tsc --noEmit

# Production Build
npm run build
```

---

## 🚀 Production Deployment to Vercel

Target Custom Domain: **`flowpilot.codexvetech.com`**

For detailed step-by-step instructions on setting up DNS records, Inngest Cloud webhooks, Resend domain verification, and post-deployment smoke tests, refer to:
📖 [Production Deployment & Smoke-Test Guide](docs/deployment-and-smoke-tests.md)

---

## 📁 Project Structure

```
flowpilot-ai/
├── docs/                      # Architectural specs, data models & operations guides
│   ├── architecture.md
│   ├── data-model.md
│   ├── deployment-and-smoke-tests.md
│   ├── implementation-status.md
│   ├── local-setup.md
│   └── product-scope.md
├── scripts/                   # Automated test suites & verification runners
│   ├── run-e2e-verification.ts
│   ├── run-execution-tests.ts
│   ├── run-integration-tests.ts
│   ├── run-phase9-smoke-tests.ts
│   └── run-validator-tests.ts
├── src/
│   ├── app/                   # Next.js App Router (Pages, Layouts & API routes)
│   │   ├── (auth)/            # Auth pages (Login, Signup, Reset Password)
│   │   ├── (dashboard)/       # Dashboard (Overview, Workflows, Leads, Integrations, Runs, Settings)
│   │   ├── api/health/        # Sanitized system health check endpoint
│   │   ├── api/inngest/       # Inngest webhook route handler
│   │   └── api/v1/webhook/    # Public authenticated webhook ingestion API
│   ├── components/            # React UI components & custom canvas nodes
│   ├── lib/
│   │   ├── actions/           # Next.js Server Actions (Workflows, Leads, Integrations, Demo)
│   │   ├── ai/                # OpenAI adapter, deterministic mock adapter, schemas
│   │   ├── auth/              # Workspace context & role resolution
│   │   ├── crm/               # Lead normalization & activity timeline
│   │   ├── inngest/           # Inngest client, events, and background functions
│   │   ├── integrations/      # Resend email & Slack Block Kit adapters
│   │   ├── maintenance/       # Execution log retention & pruning utilities
│   │   ├── security/          # AES-256-GCM encryption & secret redaction
│   │   ├── supabase/          # Supabase client, server SSR & admin wrappers
│   │   └── workflow/          # DAG validator, templates, expression resolver & executors
│   └── types/                 # TypeScript interfaces, Zod schemas & database definitions
├── supabase/                  # SQL migrations & seed data
├── vercel.json                # Vercel production headers & security configuration
└── package.json
```

---

## 📄 License
This project is licensed under the MIT License.

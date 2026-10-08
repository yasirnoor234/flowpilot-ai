# FlowPilot AI ⚡

> **AI-Powered Business Automation Platform for Small Businesses.**  
> Effortlessly capture, qualify, route, and follow up with leads through durable, multi-step AI workflows.

---

## 🌟 Overview

**FlowPilot AI** is an intelligent business workflow automation engine designed specifically for modern small businesses. It replaces fragmented zap-style tools with an integrated, durable, and type-safe AI pipeline that handles the full lead-to-close journey.

### 🎯 Primary MVP Use Case
```
[New Lead Webhook/Manual Trigger]
               │
               ▼
   [AI Qualification & Scoring]  ─── Evaluates intent, budget, and customer tier (Hot/Warm/Cold)
               │
               ▼
     [Built-in CRM Upsert]       ─── Creates/updates lead profile & activity record
               │
               ▼
    [Conditional Branching]      ─── (Hot Lead vs Standard Lead)
      ├── Hot: Priority Slack Alert + VIP Email Sequence
      └── Standard: Personalized Confirmation Email
               │
               ▼
   [Durable Follow-Up Delay]     ─── Resumes execution reliably after 24h/48h
               │
               ▼
     [Follow-Up Auto-Email]
```

---

## 🛠 Tech Stack & Architecture

| Layer | Technology |
| :--- | :--- |
| **Framework** | [Next.js 16 (App Router)](https://nextjs.org/) + TypeScript 5 |
| **Styling & UI** | [Tailwind CSS](https://tailwindcss.com/) + Custom Glassmorphism Theme |
| **Database & Auth** | [Supabase Postgres](https://supabase.com/) with strict Row Level Security (RLS) & SSR Auth |
| **Background Orchestration** | [Inngest](https://www.inngest.com/) (Durable step memoization, sleep timers, retries) |
| **AI Evaluation** | [OpenAI SDK](https://platform.openai.com/) (Structured lead scoring & reasoning) |
| **Integrations** | [Resend](https://resend.com/) (Transactional Email) & Slack Incoming Webhooks |

---

## 🚀 Key Features

### 1. Multi-Tenant Workspace & Role-Based Access
- Complete tenant data isolation enforced at the Postgres database level with **Row Level Security (RLS)**.
- Workspace membership roles (`owner`, `member`) with SSR route protection and session management.

### 2. DAG Workflow Engine & Immutable Versioning
- **Directed Acyclic Graph (DAG)** workflow builder supporting 9 node types:
  - `trigger_manual`, `trigger_webhook`
  - `action_field_mapping`, `condition_if_else`
  - `action_ai_qualify`, `action_crm_upsert`
  - `action_send_email`, `action_slack_alert`
  - `action_delay` (durable sleep timers)
- **Publication Rule Enforcement**: Validates graphs against 8 publication constraints (rejects cycles, disconnected nodes, branch merges, missing/multiple triggers, and invalid upstream references).
- **Immutable Version Snapshots**: Running and historical executions reference immutable version snapshots, protecting active workflows from in-flight draft changes.

### 3. Durable Execution Engine (Powered by Inngest)
- **Zero-`eval` Expression Resolution**: Safe declarative field interpolation (`{{trigger.email}}`, `{{ai_qualify.score}}`) with prototype-pollution guardrails.
- **Untaken Branch Skipping**: Automatically detects condition branch outcomes and marks alternate subtree steps as `skipped`.
- **Durable Delays**: Resumes execution across hours or days via Inngest `step.sleep`.
- **Idempotency & Deduplication**: Unique constraints prevent duplicate executions from duplicate trigger events.
- **Mid-Flight Cancellation & Linked Reruns**: Safely halt active runs or spawn linked reruns preserving original inputs and version lineage.

### 4. Real-Time Execution Inspector
- Audit trails and live logs at `/runs` and `/runs/[id]`.
- Interactive step execution timeline with execution durations, status badges (`succeeded`, `failed`, `running`, `waiting`, `skipped`, `canceled`), and raw JSON input/output drawers.

---

## ⚙️ Getting Started

### 1. Prerequisites
- **Node.js**: v20.x or later
- **npm** or **pnpm**
- A [Supabase](https://supabase.com/) account & project
- An [Inngest](https://www.inngest.com/) account (or local Inngest Dev Server)

### 2. Clone & Install
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

Fill in the required environment variables:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Inngest
INNGEST_EVENT_KEY=your-inngest-event-key
INNGEST_SIGNING_KEY=your-inngest-signing-key

# Optional / Demo Integration Keys (Built-in Demo Adapters available)
OPENAI_API_KEY=your-openai-key
RESEND_API_KEY=your-resend-key
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

### 4. Apply Database Migrations
Run the SQL migration files located in `supabase/migrations/` inside your Supabase SQL Editor in numerical order:
1. `20261007000001_initial_auth_and_workspaces.sql`
2. `20261007000002_fix_workspace_creation_rls.sql`
3. `20261007000003_workflows_and_versions.sql`
4. `20261008000001_workflow_execution_engine.sql`

*(Optional)* Seed sample data with `supabase/seed.sql`.

### 5. Run the Local Development Servers
Start the Next.js dev server:
```bash
npm run dev
```

In a separate terminal, start the Inngest Dev Server (optional for local event inspection):
```bash
npx inngest-cli@latest dev -u http://localhost:3000/api/inngest
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Running Automated Tests

FlowPilot AI includes comprehensive test suites for validation rules and the durable execution engine:

```bash
# Run Phase 2 Workflow Publication Validator Tests (9 tests)
npx tsx scripts/run-validator-tests.ts

# Run Phase 3 Execution Engine Tests (6 tests)
npx tsx scripts/run-execution-tests.ts

# Run TypeScript Type Checking
npx tsc --noEmit

# Run Production Build
npm run build
```

---

## 📁 Project Structure

```
flowpilot-ai/
├── docs/                      # Architectural specs & data models
│   ├── architecture.md
│   ├── data-model.md
│   ├── product-scope.md
│   └── implementation-status.md
├── scripts/                   # Test runners & utility scripts
│   ├── run-validator-tests.ts
│   └── run-execution-tests.ts
├── src/
│   ├── app/                   # Next.js App Router (Pages & API endpoints)
│   │   ├── (auth)/            # Login, Signup, Forgot/Update password
│   │   ├── (dashboard)/       # Overview, Workflows, Runs, Leads, Settings
│   │   └── api/inngest/       # Inngest webhook route handler
│   ├── components/            # React UI components (Dashboard, Workflow, Runs)
│   ├── lib/
│   │   ├── actions/           # Next.js Server Actions (Workflows, Execution, Auth)
│   │   ├── inngest/           # Inngest client, dispatch, and durable function definitions
│   │   ├── supabase/          # Supabase client & server SSR wrappers
│   │   └── workflow/          # DAG validator, templates, expression resolver & executors
│   └── types/                 # TypeScript interfaces & database schemas
└── supabase/
    ├── migrations/            # Versioned SQL schema & RLS policies
    └── seed.sql               # Local development seed data
```

---

## 📄 License
This project is licensed under the MIT License.

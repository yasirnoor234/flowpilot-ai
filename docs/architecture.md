# FlowPilot AI — System Architecture

## 1. High-Level Architecture Overview

FlowPilot AI follows a modular, serverless architecture centered on durable workflow execution, workspace isolation, and typed integration boundaries.

```mermaid
graph TD
    subgraph Client [Browser / Frontend]
        UI[Next.js App Router UI]
        Canvas[React Flow Visual Canvas]
        CRM_UI[Built-in CRM & Lead Inbox]
        Runs_UI[Execution Runs & Logs Inspector]
    end

    subgraph AppServer [Next.js Server Layer]
        API[Route Handlers & Server Actions]
        AuthGuard[Workspace Auth & Role Guard]
        Compiler[DAG Workflow Compiler & Validator]
        WebhookReceiver[Webhook Trigger Ingestion Endpoint]
    end

    subgraph Storage [Data Layer - Supabase Postgres]
        DB[(Supabase Postgres)]
        RLS[Row Level Security Enforcement]
        Vault[Encrypted Integration Configs]
    end

    subgraph Engine [Durable Execution Engine - Inngest]
        InngestServer[Inngest Event Bus & Orchestrator]
        DurableRunner[Durable Step Execution Function]
        SleepStep[Durable Delays / step.sleep]
    end

    subgraph Integrations [External Integration Adapters]
        OpenAIAdapter[OpenAI GPT-4o / GPT-4o-mini]
        ResendAdapter[Resend Email API]
        SlackAdapter[Slack Incoming Webhooks]
        CRMAdapter[Built-in Workspace CRM Service]
    end

    Canvas -->|Save / Publish Flow| API
    WebhookReceiver -->|Trigger Event| InngestServer
    API -->|Manual Run Event| InngestServer
    API --> AuthGuard
    AuthGuard --> RLS
    RLS --> DB
    
    InngestServer --> DurableRunner
    DurableRunner --> DurableRunner
    DurableRunner --> SleepStep
    DurableRunner -->|Execute Step Action| Integrations
    DurableRunner -->|Update Step Log & Run State| DB
    CRM_UI --> API
    Runs_UI --> API
```

---

## 2. Core Architectural Components

### 2.1 Visual Canvas (Frontend)
* **Framework:** React 19 + Next.js App Router + `@xyflow/react` (React Flow v12) + Tailwind CSS + `shadcn/ui`.
* **State Management:** Local canvas state with dirty checking, snap-to-grid, auto-layout helpers, and strict DAG graph validation before publishing.
* **Node Types:**
  1. `trigger_manual` (Manual test run with mock payload)
  2. `trigger_webhook` (Generates workspace-unique endpoint)
  3. `action_ai_qualify` (OpenAI prompt, structured schema, temperature)
  4. `action_crm_lead` (Create or update lead in workspace CRM)
  5. `action_send_email` (Resend email with subject, markdown body, recipient template)
  6. `action_slack_notify` (Slack webhook message block)
  7. `action_delay` (Durable timer: e.g. 15m, 2h, 24h, 3d)
  8. `condition_if_else` (Evaluates JSON path / expression into `true` or `false` branch)

### 2.2 Workflow Compiler & Graph Validator
* Workflows are saved as draft graph JSON (`nodes`, `edges`, `viewport`).
* Before publishing, the **Compiler** verifies:
  * Exactly one trigger node exists at the root.
  * No cycles exist (DAG validation via Topological Sort / Kahn's algorithm).
  * Every node has valid configurations matching its Zod schema.
  * Branches only spawn from `condition_if_else` nodes (into explicit `true` and `false` branches).
  * **Strict MVP Rule:** No branch merging (branches terminate independently).
* Once validated, an immutable **Workflow Version** is generated with a linearized step execution plan.

### 2.3 Durable Orchestration Engine (Inngest)
* Workflows are executed asynchronously through Inngest functions (`/api/inngest`).
* Each workflow node execution corresponds to a typed `step.run()` or `step.sleep()` call.
* **Why Inngest?**
  * Survives serverless cold starts and compute timeouts.
  * Delays of 24h+ do not consume server compute or block connections.
  * Automatic retries with exponential backoff for transient 3rd-party API errors (e.g. OpenAI rate limits or Slack 503s).
  * Atomic step memoization ensures idempotency and avoids double-emailing leads.

### 2.4 Security & Multi-Tenancy (Supabase + RLS)
* Every entity contains a `workspace_id` foreign key.
* Database queries use Supabase client with RLS enabled:
  * Application queries verify `auth.uid()` membership in `workspace_members`.
  * Service role client is strictly restricted to background Inngest worker runners and webhook receivers.
* Integration credentials (API keys, webhook URLs) are stored securely in `workspace_integrations` and never surfaced to client bundles.

---

## 3. Execution Dataflow & Step Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Lead as Webhook Client / User
    participant WH as Webhook Ingest Route
    participant DB as Supabase DB
    participant INN as Inngest Orchestrator
    participant ENG as Durable Step Engine
    participant ADAPT as Integration Adapters

    Lead->>WH: POST /api/webhooks/workflows/[id] (Payload)
    WH->>DB: Fetch Published Workflow Version Snapshot
    WH->>DB: Create execution_run (status: "queued")
    WH->>INN: Send "workflow.execute" Event (run_id, payload)
    WH-->>Lead: 202 Accepted { run_id }

    INN->>ENG: Start Durable Workflow Function
    ENG->>DB: Update run status -> "running"

    loop For Each Node in Linearized DAG Path
        alt Node is Action
            ENG->>ADAPT: Execute Action (OpenAI / CRM / Resend / Slack)
            ADAPT-->>ENG: Action Result / Output Data
            ENG->>DB: Insert execution_step_log (node_id, status: "completed", output)
        else Node is Condition (IF / ELSE)
            ENG->>ENG: Evaluate Expression on Run Context
            ENG->>DB: Record branch taken ("true" / "false")
        else Node is Delay
            ENG->>INN: step.sleep(duration)
            Note over ENG,INN: Execution paused durably (No CPU used)
            INN-->>ENG: Wake up after delay
            ENG->>DB: Record delay completion
        end
    end

    ENG->>DB: Update execution_run (status: "completed", finished_at)
```

---

## 4. Integration Adapter Layer

To ensure resilient testing and zero dependency on live paid accounts during development, all integrations implement a uniform adapter interface:

```typescript
export interface IntegrationAdapter<TConfig, TInput, TOutput> {
  execute(config: TConfig, input: TInput, context: ExecutionContext): Promise<TOutput>;
  validateConfig(config: TConfig): boolean;
}
```

* **Live Adapters:**
  * `OpenAIAdapter`: Uses `openai` Node SDK with JSON mode / structured outputs.
  * `ResendAdapter`: Dispatches transactional emails via `resend`.
  * `SlackAdapter`: Posts formatted payloads to Slack webhook endpoints.
* **Demo / Mock Adapters:**
  * Configurable in workspace settings (`demo_mode: true`).
  * Emulates deterministic realistic responses, logs outputs to execution step records, and prevents external API calls during testing.

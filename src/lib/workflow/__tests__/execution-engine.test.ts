import { executeWorkflowSnapshot } from '../executor/workflow-engine';
import { validateWorkflowForPublishing } from '../validator';
import { WORKFLOW_TEMPLATES } from '../templates';
import type { WorkflowGraph } from '@/types/workflow';

export async function runExecutionEngineTests(): Promise<{
  total: number;
  passed: number;
  failed: number;
  results: Array<{ test: string; passed: boolean; message?: string }>;
}> {
  const results: Array<{ test: string; passed: boolean; message?: string }> = [];

  function assert(testName: string, condition: boolean, message?: string) {
    results.push({ test: testName, passed: condition, message });
  }

  // ---------------------------------------------------------------------------
  // Test 1: Successful End-to-End Workflow Execution
  // ---------------------------------------------------------------------------
  const primaryTemplate = WORKFLOW_TEMPLATES[0].graph;
  const valResult = validateWorkflowForPublishing(primaryTemplate);

  if (valResult.isValid && valResult.compiledGraph) {
    const mockRunId = 'test-run-success-001';
    const mockWorkspaceId = 'test-ws-001';
    const mockWorkflowId = 'test-wf-001';
    const mockVersionId = 'test-ver-001';

    const triggerPayload = {
      email: 'lead@enterprise.com',
      first_name: 'Jordan',
      company: 'Enterprise AI Corp',
      budget: '$25,000',
      message: 'Need an immediate enterprise AI solution.',
    };

    const executedSteps: string[] = [];
    const execution = await executeWorkflowSnapshot(
      mockRunId,
      mockWorkspaceId,
      mockWorkflowId,
      mockVersionId,
      valResult.compiledGraph,
      triggerPayload,
      {
        onStepComplete: async (nodeId) => {
          executedSteps.push(nodeId);
        },
      },
      { persist: false }
    );

    assert(
      'End-to-End Workflow Execution Completes with Status Succeeded',
      execution.status === 'succeeded' && executedSteps.length > 0,
      `Final status: ${execution.status}, Executed: ${executedSteps.length}`
    );

    // Verify Output Data was populated in context
    assert(
      'Step Outputs Populated in Context (AI Qualification & CRM)',
      !!execution.context.nodeOutputs['node_ai_qualify']?.qualification_score &&
        !!execution.context.nodeOutputs['node_crm_upsert']?.crm_record_id
    );
  } else {
    assert('Primary Template Compilation', false, 'Failed to compile template for execution test');
  }

  // ---------------------------------------------------------------------------
  // Test 2: Conditional Branch with Skipped Nodes
  // ---------------------------------------------------------------------------
  if (valResult.isValid && valResult.compiledGraph) {
    const skippedSteps: string[] = [];
    const mockRunId = 'test-run-branch-002';

    // Lead with hot tier (triggers VIP branch, standard branch should be skipped)
    const hotLeadPayload = {
      email: 'vip@corp.com',
      first_name: 'Taylor',
      company: 'High Intent Labs',
      budget: '$50,000',
      message: 'Immediate rollout required',
    };

    const execution = await executeWorkflowSnapshot(
      mockRunId,
      'test-ws-001',
      'test-wf-001',
      'test-ver-001',
      valResult.compiledGraph,
      hotLeadPayload,
      {
        onStepSkipped: async (nodeId) => {
          skippedSteps.push(nodeId);
        },
      },
      { persist: false }
    );

    assert(
      'Conditional Branch Skips Untaken Subtree Nodes',
      execution.status === 'succeeded' &&
        skippedSteps.includes('node_standard_followup') &&
        execution.stepResults['node_vip_followup']?.status === 'succeeded'
    );
  }

  // ---------------------------------------------------------------------------
  // Test 3: Resume after Durable Delay
  // ---------------------------------------------------------------------------
  const simpleDelayGraph: WorkflowGraph = {
    nodes: [
      {
        id: 'node_trig',
        type: 'trigger_manual',
        title: 'Manual Trigger',
        schema_version: 1,
        config: { sample_payload: { email: 'delay@test.com' } },
      },
      {
        id: 'node_wait',
        type: 'action_delay',
        title: 'Delay Step',
        schema_version: 1,
        config: { duration: 2, unit: 'hours' },
      },
      {
        id: 'node_after',
        type: 'action_send_email',
        title: 'Post-Delay Email',
        schema_version: 1,
        config: { to: '{{trigger.email}}', subject: 'Resumed', body_markdown: 'Done' },
      },
    ],
    edges: [
      { id: 'e1', source: 'node_trig', target: 'node_wait' },
      { id: 'e2', source: 'node_wait', target: 'node_after' },
    ],
  };

  const delayVal = validateWorkflowForPublishing(simpleDelayGraph);
  if (delayVal.isValid && delayVal.compiledGraph) {
    let recordedDelaySeconds = 0;
    const execution = await executeWorkflowSnapshot(
      'test-run-delay-003',
      'test-ws-001',
      'test-wf-001',
      'test-ver-001',
      delayVal.compiledGraph,
      { email: 'delay@test.com' },
      {
        onDelay: async (_nodeId, delaySeconds) => {
          recordedDelaySeconds = delaySeconds;
        },
      },
      { persist: false }
    );

    assert(
      'Durable Delay Step Computes Seconds and Resumes Flow',
      execution.status === 'succeeded' && recordedDelaySeconds === 7200 // 2 hours = 7200 seconds
    );
  }

  // ---------------------------------------------------------------------------
  // Test 4: Mid-Flight Cancellation
  // ---------------------------------------------------------------------------
  if (valResult.isValid && valResult.compiledGraph) {
    let stepCount = 0;
    const execution = await executeWorkflowSnapshot(
      'test-run-cancel-004',
      'test-ws-001',
      'test-wf-001',
      'test-ver-001',
      valResult.compiledGraph,
      { email: 'cancel@test.com' },
      {
        onStepComplete: async () => {
          stepCount++;
        },
        checkCanceled: async () => {
          // Trigger cancellation after 2 steps
          return stepCount >= 2;
        },
      },
      { persist: false }
    );

    assert(
      'Cancellation Stops Execution Mid-Flight',
      execution.status === 'canceled' && stepCount < valResult.compiledGraph.execution_order.length
    );
  }

  // ---------------------------------------------------------------------------
  // Test 5: Safe Declarative Template Expression Resolution (No eval)
  // ---------------------------------------------------------------------------
  const templateGraph: WorkflowGraph = {
    nodes: [
      {
        id: 'trig',
        type: 'trigger_webhook',
        title: 'Webhook',
        schema_version: 1,
        config: { path_slug: 'in', http_method: 'POST', expected_fields: [] },
      },
      {
        id: 'mapper',
        type: 'action_field_mapping',
        title: 'Mapper',
        schema_version: 1,
        config: {
          mappings: [
            { source_field: 'trigger.lead.company', target_field: 'company_name' },
            { source_field: 'trigger.lead.budget', target_field: 'lead_budget' },
          ],
        },
      },
      {
        id: 'email',
        type: 'action_send_email',
        title: 'Send Email',
        schema_version: 1,
        config: {
          to: '{{trigger.lead.email}}',
          subject: 'Welcome {{mapper.company_name}}',
          body_markdown: 'Budget received: {{mapper.lead_budget}}',
        },
      },
    ],
    edges: [
      { id: 'e1', source: 'trig', target: 'mapper' },
      { id: 'e2', source: 'mapper', target: 'email' },
    ],
  };

  const tVal = validateWorkflowForPublishing(templateGraph);
  if (tVal.isValid && tVal.compiledGraph) {
    const execution = await executeWorkflowSnapshot(
      'test-run-template-005',
      'test-ws-001',
      'test-wf-001',
      'test-ver-001',
      tVal.compiledGraph,
      {
        lead: {
          email: 'founder@acme.com',
          company: 'Acme Systems',
          budget: '$20,000',
        },
      },
      undefined,
      { persist: false }
    );

    const emailOutput = execution.context.nodeOutputs['email'];
    assert(
      'Declarative Template Resolution Injects Deep Context Safely',
      execution.status === 'succeeded' &&
        emailOutput?.to === 'founder@acme.com' &&
        emailOutput?.subject === 'Welcome Acme Systems'
    );
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  return {
    total: results.length,
    passed,
    failed,
    results,
  };
}

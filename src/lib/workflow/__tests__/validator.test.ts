import { validateWorkflowForPublishing } from '../validator';
import { WORKFLOW_TEMPLATES } from '../templates';
import type { WorkflowGraph, WorkflowNodeType } from '@/types/workflow';

/**
 * Self-executing verification test suite for Workflow Validator and Publication Rules.
 */
export function runWorkflowValidationTests(): { total: number; passed: number; failed: number; results: Array<{ test: string; passed: boolean; message?: string }> } {
  const results: Array<{ test: string; passed: boolean; message?: string }> = [];

  function assert(testName: string, condition: boolean, message?: string) {
    results.push({ test: testName, passed: condition, message });
  }

  // 1. Primary MVP Template Should Pass
  const primaryTemplate = WORKFLOW_TEMPLATES[0].graph;
  const v1 = validateWorkflowForPublishing(primaryTemplate);
  assert(
    'Primary MVP Template Validates Successfully',
    v1.isValid === true && v1.errors.length === 0 && !!v1.compiledGraph,
    v1.isValid ? undefined : JSON.stringify(v1.errors)
  );

  // 2. Reject Missing Trigger
  const noTriggerGraph: WorkflowGraph = {
    nodes: [
      {
        id: 'node_1',
        type: 'action_send_email',
        title: 'Send Email',
        schema_version: 1,
        config: { to: 'a@b.com', subject: 'Hi', body_markdown: 'Body' },
      },
    ],
    edges: [],
  };
  const v2 = validateWorkflowForPublishing(noTriggerGraph);
  assert(
    'Rejects Graph with Missing Trigger',
    v2.isValid === false && v2.errors.some((e) => e.rule === 'TRIGGER_COUNT')
  );

  // 3. Reject Multiple Triggers
  const multiTriggerGraph: WorkflowGraph = {
    nodes: [
      {
        id: 'trig_1',
        type: 'trigger_webhook',
        title: 'Webhook 1',
        schema_version: 1,
        config: { path_slug: 'hook1', http_method: 'POST', expected_fields: [] },
      },
      {
        id: 'trig_2',
        type: 'trigger_manual',
        title: 'Manual 2',
        schema_version: 1,
        config: { sample_payload: {} },
      },
    ],
    edges: [],
  };
  const v3 = validateWorkflowForPublishing(multiTriggerGraph);
  assert(
    'Rejects Graph with Multiple Triggers',
    v3.isValid === false && v3.errors.some((e) => e.rule === 'TRIGGER_COUNT')
  );

  // 4. Reject Cycle / Loop
  const cycleGraph: WorkflowGraph = {
    nodes: [
      {
        id: 'trig',
        type: 'trigger_webhook',
        title: 'Webhook',
        schema_version: 1,
        config: { path_slug: 'hook', http_method: 'POST', expected_fields: [] },
      },
      {
        id: 'node_a',
        type: 'action_delay',
        title: 'Delay A',
        schema_version: 1,
        config: { duration: 5, unit: 'minutes' },
      },
      {
        id: 'node_b',
        type: 'action_delay',
        title: 'Delay B',
        schema_version: 1,
        config: { duration: 10, unit: 'minutes' },
      },
    ],
    edges: [
      { id: 'e1', source: 'trig', target: 'node_a' },
      { id: 'e2', source: 'node_a', target: 'node_b' },
      { id: 'e3', source: 'node_b', target: 'node_a' }, // Cycle!
    ],
  };
  const v4 = validateWorkflowForPublishing(cycleGraph);
  assert(
    'Rejects Graph with Cycles (DAG Violation)',
    v4.isValid === false && v4.errors.some((e) => e.rule === 'CYCLE_DETECTED')
  );

  // 5. Reject Unreachable Nodes
  const unreachableGraph: WorkflowGraph = {
    nodes: [
      {
        id: 'trig',
        type: 'trigger_webhook',
        title: 'Webhook',
        schema_version: 1,
        config: { path_slug: 'hook', http_method: 'POST', expected_fields: [] },
      },
      {
        id: 'orphan',
        type: 'action_send_email',
        title: 'Orphan Node',
        schema_version: 1,
        config: { to: 'x@y.com', subject: 'Orphan', body_markdown: 'Orphan' },
      },
    ],
    edges: [],
  };
  const v5 = validateWorkflowForPublishing(unreachableGraph);
  assert(
    'Rejects Unreachable Disconnected Nodes',
    v5.isValid === false && v5.errors.some((e) => e.rule === 'UNREACHABLE_NODE')
  );

  // 6. Reject Invalid Node Config (Zod Schema)
  const invalidConfigGraph: WorkflowGraph = {
    nodes: [
      {
        id: 'trig',
        type: 'trigger_webhook',
        title: 'Webhook',
        schema_version: 1,
        config: { path_slug: 'hook', http_method: 'POST', expected_fields: [] },
      },
      {
        id: 'ai_node',
        type: 'action_ai_qualify',
        title: 'AI Qualify',
        schema_version: 1,
        config: { prompt_template: 'Too short' }, // Less than 10 chars
      },
    ],
    edges: [{ id: 'e1', source: 'trig', target: 'ai_node' }],
  };
  const v6 = validateWorkflowForPublishing(invalidConfigGraph);
  assert(
    'Rejects Invalid Node Configuration via Zod',
    v6.isValid === false && v6.errors.some((e) => e.rule === 'INVALID_CONFIG')
  );

  // 7. Reject Unknown Node Types
  const unknownTypeGraph: WorkflowGraph = {
    nodes: [
      {
        id: 'trig',
        type: 'trigger_webhook',
        title: 'Webhook',
        schema_version: 1,
        config: { path_slug: 'hook', http_method: 'POST', expected_fields: [] },
      },
      {
        id: 'bad_node',
        type: 'custom_eval_script' as unknown as WorkflowNodeType,
        title: 'Arbitrary JS Node',
        schema_version: 1,
        config: {},
      },
    ],
    edges: [{ id: 'e1', source: 'trig', target: 'bad_node' }],
  };
  const v7 = validateWorkflowForPublishing(unknownTypeGraph);
  assert(
    'Rejects Unknown / Arbitrary Script Node Types',
    v7.isValid === false && v7.errors.some((e) => e.rule === 'UNKNOWN_NODE_TYPE')
  );

  // 8. Reject Branch Merges (Strict MVP Rule)
  const branchMergeGraph: WorkflowGraph = {
    nodes: [
      {
        id: 'trig',
        type: 'trigger_webhook',
        title: 'Webhook',
        schema_version: 1,
        config: { path_slug: 'hook', http_method: 'POST', expected_fields: [] },
      },
      {
        id: 'cond',
        type: 'condition_if_else',
        title: 'Condition',
        schema_version: 1,
        config: { field_path: 'trigger.budget', operator: 'greater_than', compare_value: '1000' },
      },
      {
        id: 'true_act',
        type: 'action_delay',
        title: 'Delay True',
        schema_version: 1,
        config: { duration: 1, unit: 'hours' },
      },
      {
        id: 'false_act',
        type: 'action_delay',
        title: 'Delay False',
        schema_version: 1,
        config: { duration: 2, unit: 'hours' },
      },
      {
        id: 'merged_target',
        type: 'action_send_email',
        title: 'Merged Send Email',
        schema_version: 1,
        config: { to: 'a@b.com', subject: 'Merged', body_markdown: 'Merged' },
      },
    ],
    edges: [
      { id: 'e1', source: 'trig', target: 'cond' },
      { id: 'e2', source: 'cond', target: 'true_act', source_handle: 'true' },
      { id: 'e3', source: 'cond', target: 'false_act', source_handle: 'false' },
      { id: 'e4_merge1', source: 'true_act', target: 'merged_target' },
      { id: 'e5_merge2', source: 'false_act', target: 'merged_target' }, // Merging back!
    ],
  };
  const v8 = validateWorkflowForPublishing(branchMergeGraph);
  assert(
    'Rejects Branch Merges (Strict MVP Rule)',
    v8.isValid === false && v8.errors.some((e) => e.rule === 'BRANCH_MERGE')
  );

  // 9. Reject Invalid Upstream References
  const invalidRefGraph: WorkflowGraph = {
    nodes: [
      {
        id: 'trig',
        type: 'trigger_webhook',
        title: 'Webhook',
        schema_version: 1,
        config: { path_slug: 'hook', http_method: 'POST', expected_fields: [] },
      },
      {
        id: 'send_email',
        type: 'action_send_email',
        title: 'Send Email',
        schema_version: 1,
        config: {
          to: 'lead@example.com',
          subject: 'Score: {{ai_eval.score}}',
          body_markdown: 'Hello',
        },
      },
    ],
    edges: [{ id: 'e1', source: 'trig', target: 'send_email' }],
  };
  const v9 = validateWorkflowForPublishing(invalidRefGraph);
  assert(
    'Rejects References to Unavailable Upstream Outputs',
    v9.isValid === false && v9.errors.some((e) => e.rule === 'INVALID_UPSTREAM_REF')
  );

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  return {
    total: results.length,
    passed,
    failed,
    results,
  };
}

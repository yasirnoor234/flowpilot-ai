import {
  WorkflowGraph,
  WorkflowNode,
  WorkflowEdge,
  CompiledWorkflowGraph,
  WORKFLOW_NODE_TYPES,
  nodeConfigSchemas,
  WorkflowNodeType,
} from '@/types/workflow';

export interface ValidationError {
  rule:
    | 'TRIGGER_COUNT'
    | 'CYCLE_DETECTED'
    | 'UNREACHABLE_NODE'
    | 'INVALID_CONFIG'
    | 'UNKNOWN_NODE_TYPE'
    | 'INVALID_BRANCH_HANDLE'
    | 'BRANCH_MERGE'
    | 'INVALID_UPSTREAM_REF';
  message: string;
  nodeId?: string;
  edgeId?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  compiledGraph?: CompiledWorkflowGraph;
}

/**
 * Validates a workflow graph according to strict MVP publication rules and compiles it into an immutable execution snapshot.
 */
export function validateWorkflowForPublishing(graph: WorkflowGraph): ValidationResult {
  const errors: ValidationError[] = [];

  const nodes = graph.nodes || [];
  const edges = graph.edges || [];

  const nodeMap = new Map<string, WorkflowNode>();
  for (const node of nodes) {
    nodeMap.set(node.id, node);
  }

  // ---------------------------------------------------------------------------
  // Rule 1: Unknown Node Types & Empty Check
  // ---------------------------------------------------------------------------
  if (nodes.length === 0) {
    errors.push({
      rule: 'TRIGGER_COUNT',
      message: 'Workflow graph must contain at least one trigger node.',
    });
    return { isValid: false, errors };
  }

  for (const node of nodes) {
    if (!WORKFLOW_NODE_TYPES.includes(node.type as WorkflowNodeType)) {
      errors.push({
        rule: 'UNKNOWN_NODE_TYPE',
        message: `Node "${node.title || node.id}" has unknown type "${node.type}".`,
        nodeId: node.id,
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Rule 2: Missing or Multiple Triggers
  // ---------------------------------------------------------------------------
  const triggerNodes = nodes.filter(
    (n) => n.type === 'trigger_manual' || n.type === 'trigger_webhook'
  );

  if (triggerNodes.length === 0) {
    errors.push({
      rule: 'TRIGGER_COUNT',
      message: 'Workflow must have exactly one trigger node (Manual or Webhook).',
    });
  } else if (triggerNodes.length > 1) {
    errors.push({
      rule: 'TRIGGER_COUNT',
      message: `Workflow has ${triggerNodes.length} triggers. Only 1 trigger per workflow is permitted.`,
      nodeId: triggerNodes[1].id,
    });
  }

  const rootTrigger = triggerNodes[0];

  // ---------------------------------------------------------------------------
  // Build Adjacency and In-Degree Maps
  // ---------------------------------------------------------------------------
  const adjList = new Map<string, string[]>();
  const incomingEdges = new Map<string, WorkflowEdge[]>();

  for (const node of nodes) {
    adjList.set(node.id, []);
    incomingEdges.set(node.id, []);
  }

  for (const edge of edges) {
    if (!nodeMap.has(edge.source)) {
      errors.push({
        rule: 'UNREACHABLE_NODE',
        message: `Edge "${edge.id}" references non-existent source node "${edge.source}".`,
        edgeId: edge.id,
      });
      continue;
    }
    if (!nodeMap.has(edge.target)) {
      errors.push({
        rule: 'UNREACHABLE_NODE',
        message: `Edge "${edge.id}" references non-existent target node "${edge.target}".`,
        edgeId: edge.id,
      });
      continue;
    }

    adjList.get(edge.source)?.push(edge.target);
    incomingEdges.get(edge.target)?.push(edge);
  }

  // Check trigger has 0 incoming edges
  if (rootTrigger && (incomingEdges.get(rootTrigger.id)?.length ?? 0) > 0) {
    errors.push({
      rule: 'TRIGGER_COUNT',
      message: `Trigger node "${rootTrigger.title}" cannot have incoming edges.`,
      nodeId: rootTrigger.id,
    });
  }

  // ---------------------------------------------------------------------------
  // Rule 3: Branch Merges (Strict MVP Rule: No node can have >= 2 incoming edges)
  // ---------------------------------------------------------------------------
  for (const [nodeId, inEdges] of incomingEdges.entries()) {
    if (inEdges.length > 1) {
      const node = nodeMap.get(nodeId);
      errors.push({
        rule: 'BRANCH_MERGE',
        message: `Node "${node?.title || nodeId}" has ${inEdges.length} incoming connections. Merging branches is not allowed in MVP workflows.`,
        nodeId,
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Rule 4: Invalid Branch Labels (IF/ELSE Conditions vs Non-Conditions)
  // ---------------------------------------------------------------------------
  for (const node of nodes) {
    const outgoing = edges.filter((e) => e.source === node.id);

    if (node.type === 'condition_if_else') {
      const trueEdges = outgoing.filter((e) => e.source_handle === 'true');
      const falseEdges = outgoing.filter((e) => e.source_handle === 'false');
      const invalidHandleEdges = outgoing.filter(
        (e) => e.source_handle !== 'true' && e.source_handle !== 'false'
      );

      for (const invEdge of invalidHandleEdges) {
        errors.push({
          rule: 'INVALID_BRANCH_HANDLE',
          message: `Outgoing edge "${invEdge.id}" from condition "${node.title}" must specify a branch handle ("true" or "false").`,
          edgeId: invEdge.id,
          nodeId: node.id,
        });
      }

      if (trueEdges.length > 1) {
        errors.push({
          rule: 'INVALID_BRANCH_HANDLE',
          message: `Condition "${node.title}" has multiple "true" branch edges. Only 1 is allowed.`,
          nodeId: node.id,
        });
      }
      if (falseEdges.length > 1) {
        errors.push({
          rule: 'INVALID_BRANCH_HANDLE',
          message: `Condition "${node.title}" has multiple "false" branch edges. Only 1 is allowed.`,
          nodeId: node.id,
        });
      }
    } else {
      // Non-condition node should have at most 1 outgoing edge and no branch handle
      if (outgoing.length > 1) {
        errors.push({
          rule: 'INVALID_BRANCH_HANDLE',
          message: `Node "${node.title}" has multiple outgoing edges. Parallel branching is only allowed on IF/ELSE Condition nodes.`,
          nodeId: node.id,
        });
      }
      for (const edge of outgoing) {
        if (edge.source_handle) {
          errors.push({
            rule: 'INVALID_BRANCH_HANDLE',
            message: `Node "${node.title}" is not a condition node and cannot have a "${edge.source_handle}" branch handle.`,
            edgeId: edge.id,
            nodeId: node.id,
          });
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Rule 5: Cycle Detection (Kahn's Algorithm / Topological Sort)
  // ---------------------------------------------------------------------------
  const inDegreeMap = new Map<string, number>();
  for (const node of nodes) {
    inDegreeMap.set(node.id, incomingEdges.get(node.id)?.length || 0);
  }

  const queue: string[] = [];
  for (const [nodeId, inDegree] of inDegreeMap.entries()) {
    if (inDegree === 0) {
      queue.push(nodeId);
    }
  }

  const topologicalOrder: string[] = [];
  while (queue.length > 0) {
    const curr = queue.shift();
    if (!curr) break;
    topologicalOrder.push(curr);

    for (const neighbor of adjList.get(curr) || []) {
      const newDegree = (inDegreeMap.get(neighbor) ?? 1) - 1;
      inDegreeMap.set(neighbor, newDegree);
      if (newDegree === 0) {
        queue.push(neighbor);
      }
    }
  }

  if (topologicalOrder.length < nodes.length) {
    errors.push({
      rule: 'CYCLE_DETECTED',
      message: 'Workflow contains a cycle or loop. Only Directed Acyclic Graphs (DAG) are permitted.',
    });
  }

  // ---------------------------------------------------------------------------
  // Rule 6: Unreachable Nodes (BFS from Root Trigger)
  // ---------------------------------------------------------------------------
  if (rootTrigger) {
    const reachable = new Set<string>();
    const bfsQueue: string[] = [rootTrigger.id];
    reachable.add(rootTrigger.id);

    while (bfsQueue.length > 0) {
      const current = bfsQueue.shift();
      if (!current) break;
      for (const nextId of adjList.get(current) || []) {
        if (!reachable.has(nextId)) {
          reachable.add(nextId);
          bfsQueue.push(nextId);
        }
      }
    }

    for (const node of nodes) {
      if (!reachable.has(node.id)) {
        errors.push({
          rule: 'UNREACHABLE_NODE',
          message: `Node "${node.title || node.id}" is unreachable from the trigger.`,
          nodeId: node.id,
        });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Rule 7: Individual Node Config Validation (Zod)
  // ---------------------------------------------------------------------------
  for (const node of nodes) {
    const schema = nodeConfigSchemas[node.type as WorkflowNodeType];
    if (schema) {
      const parseResult = schema.safeParse(node.config || {});
      if (!parseResult.success) {
        const errorDetail = (parseResult.error.issues || [])
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join('; ');
        errors.push({
          rule: 'INVALID_CONFIG',
          message: `Invalid configuration for "${node.title}": ${errorDetail}`,
          nodeId: node.id,
        });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Rule 8: Ancestor Mapping & Upstream Reference Validation
  // ---------------------------------------------------------------------------
  const ancestorMap: Record<string, string[]> = {};
  for (const node of nodes) {
    const ancestors = new Set<string>();
    const stack = [...(incomingEdges.get(node.id) || []).map((e) => e.source)];

    while (stack.length > 0) {
      const ancestorId = stack.pop();
      if (ancestorId && !ancestors.has(ancestorId)) {
        ancestors.add(ancestorId);
        stack.push(...(incomingEdges.get(ancestorId) || []).map((e) => e.source));
      }
    }
    ancestorMap[node.id] = Array.from(ancestors);
  }

  // Check template variable references (e.g. {{node_id.field}} or {{trigger.field}})
  const templateRegex = /\{\{\s*([a-zA-Z0-9_-]+)\.[^}]+\}\}/g;

  for (const node of nodes) {
    const configString = JSON.stringify(node.config || {});
    let match: RegExpExecArray | null;

    while ((match = templateRegex.exec(configString)) !== null) {
      const referencedIdOrType = match[1];
      let isAvailable = false;

      if (referencedIdOrType === 'trigger') {
        isAvailable = true;
      } else if (ancestorMap[node.id]?.includes(referencedIdOrType)) {
        isAvailable = true;
      } else {
        const matchingAncestor = ancestorMap[node.id]?.find((ancId) => {
          const ancNode = nodeMap.get(ancId);
          return (
            ancNode?.id === referencedIdOrType ||
            ancNode?.type === referencedIdOrType ||
            ancNode?.type.replace('action_', '') === referencedIdOrType ||
            ancNode?.type.replace('trigger_', '') === referencedIdOrType
          );
        });
        if (matchingAncestor) {
          isAvailable = true;
        }
      }

      if (!isAvailable) {
        errors.push({
          rule: 'INVALID_UPSTREAM_REF',
          message: `Node "${node.title}" references output "{{${match[1]}...}}" which is not available in its upstream execution path.`,
          nodeId: node.id,
        });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // If Valid: Generate Compiled Immutable Graph Snapshot
  // ---------------------------------------------------------------------------
  if (errors.length > 0 || !rootTrigger) {
    return { isValid: false, errors };
  }

  const branchMap: Record<string, { true_target?: string; false_target?: string }> = {};
  for (const node of nodes) {
    if (node.type === 'condition_if_else') {
      const outgoing = edges.filter((e) => e.source === node.id);
      const trueEdge = outgoing.find((e) => e.source_handle === 'true');
      const falseEdge = outgoing.find((e) => e.source_handle === 'false');
      branchMap[node.id] = {
        true_target: trueEdge?.target,
        false_target: falseEdge?.target,
      };
    }
  }

  const nodesDict: Record<string, WorkflowNode> = {};
  for (const node of nodes) {
    nodesDict[node.id] = node;
  }

  const compiledGraph: CompiledWorkflowGraph = {
    trigger_node_id: rootTrigger.id,
    trigger_type: rootTrigger.type as 'trigger_manual' | 'trigger_webhook',
    nodes: nodesDict,
    edges,
    execution_order: topologicalOrder,
    branch_map: branchMap,
    ancestor_map: ancestorMap,
    compiled_at: new Date().toISOString(),
  };

  return {
    isValid: true,
    errors: [],
    compiledGraph,
  };
}

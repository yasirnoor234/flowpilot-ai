'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  type OnConnect,
  type IsValidConnection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import type {
  WorkflowGraph,
  WorkflowNode,
  WorkflowEdge,
  WorkflowNodeType,
} from '@/types/workflow';
import { CustomWorkflowNode } from './nodes/custom-workflow-node';
import { ConditionIfElseNode } from './nodes/condition-if-else-node';
import { NodePalette } from './node-palette';
import { NodeConfigPanel } from './node-config-panel';
import {
  PALETTE_ITEMS,
  type WorkflowNodeData,
  type ReactFlowWorkflowNode,
  type ReactFlowWorkflowEdge,
} from './types';
import { validateWorkflowForPublishing } from '@/lib/workflow/validator';
import { getRunDetail } from '@/lib/actions/execution';
import type { WorkflowStepRunRecord, WorkflowRunRecord } from '@/types/execution';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Save,
  Rocket,
  Play,
  Layers,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Unlock,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Activity,
  Check,
} from 'lucide-react';

interface WorkflowCanvasProps {
  initialGraph: WorkflowGraph;
  workflowId: string;
  isPublished?: boolean;
  onSaveGraph: (graph: WorkflowGraph) => Promise<{ error?: string; success?: boolean }>;
  activeRunId?: string | null;
  onOpenPublishModal: () => void;
  onOpenTestRunModal: () => void;
  isSaving?: boolean;
}

const nodeTypes = {
  customNode: CustomWorkflowNode,
  conditionNode: ConditionIfElseNode,
};

function WorkflowCanvasInner({
  initialGraph,
  workflowId,
  isPublished,
  onSaveGraph,
  activeRunId,
  onOpenPublishModal,
  onOpenTestRunModal,
  isSaving,
}: WorkflowCanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, fitView } = useReactFlow();

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isPaletteOpen, setIsPaletteOpen] = useState(true);
  const [isInteractive, setIsInteractive] = useState(true);
  const [lastSavedGraphJson, setLastSavedGraphJson] = useState(JSON.stringify(initialGraph));
  const [activeStepRuns, setActiveStepRuns] = useState<WorkflowStepRunRecord[]>([]);
  const [activeRunRecord, setActiveRunRecord] = useState<WorkflowRunRecord | null>(null);
  const [pollingRunId, setPollingRunId] = useState<string | null>(activeRunId || null);

  // Convert WorkflowGraph to React Flow Nodes & Edges
  const initialReactFlowNodes = useMemo(() => {
    return (initialGraph.nodes || []).map((n, idx) => ({
      id: n.id,
      type: n.type === 'condition_if_else' ? 'conditionNode' : 'customNode',
      position: n.position || { x: 250, y: idx * 160 + 80 },
      data: {
        nodeId: n.id,
        type: n.type,
        title: n.title,
        config: n.config || {},
      },
    }));
  }, [initialGraph]);

  const initialReactFlowEdges = useMemo(() => {
    return (initialGraph.edges || []).map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.source_handle || undefined,
      targetHandle: e.target_handle || undefined,
      animated: true,
      style: {
        stroke: e.source_handle === 'true' ? '#10b981' : e.source_handle === 'false' ? '#f43f5e' : '#a855f7',
        strokeWidth: 2,
      },
    }));
  }, [initialGraph]);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<WorkflowNodeData>>(initialReactFlowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialReactFlowEdges);

  // Compute Current WorkflowGraph from React Flow state
  const currentWorkflowGraph: WorkflowGraph = useMemo(() => {
    const wfNodes: WorkflowNode[] = nodes.map((n) => ({
      id: n.id,
      type: (n.data as unknown as WorkflowNodeData).type,
      title: (n.data as unknown as WorkflowNodeData).title,
      config: (n.data as unknown as WorkflowNodeData).config || {},
      schema_version: 1,
      position: { x: Math.round(n.position.x), y: Math.round(n.position.y) },
    }));

    const wfEdges: WorkflowEdge[] = edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      source_handle: (e.sourceHandle as 'true' | 'false' | null | undefined) || null,
      target_handle: e.targetHandle || null,
    }));

    return {
      nodes: wfNodes,
      edges: wfEdges,
    };
  }, [nodes, edges]);

  // Live validation on current canvas graph
  const validationResult = useMemo(() => {
    return validateWorkflowForPublishing(currentWorkflowGraph);
  }, [currentWorkflowGraph]);

  // Dirty State Tracker (Unsaved Changes)
  const isDirty = useMemo(() => {
    return JSON.stringify(currentWorkflowGraph) !== lastSavedGraphJson;
  }, [currentWorkflowGraph, lastSavedGraphJson]);

  // Selected Node in State
  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    const rfNode = nodes.find((n) => n.id === selectedNodeId);
    if (!rfNode) return null;
    const data = rfNode.data as unknown as WorkflowNodeData;
    return {
      id: rfNode.id,
      type: data.type,
      title: data.title,
      config: data.config,
      schema_version: 1,
      position: rfNode.position,
    };
  }, [selectedNodeId, nodes]);

  // Polling for Live Test Run Status
  useEffect(() => {
    if (!pollingRunId) return;

    let isSubscribed = true;
    const interval = setInterval(async () => {
      try {
        const res = await getRunDetail(pollingRunId);
        if (!isSubscribed || !res) return;

        setActiveRunRecord(res.run);
        setActiveStepRuns(res.stepRuns || []);

        if (['succeeded', 'failed', 'canceled'].includes(res.run.status)) {
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Error polling run detail:', err);
      }
    }, 1500);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [pollingRunId]);

  // Sync node data with validation errors & live step status
  useEffect(() => {
    setNodes((prevNodes) =>
      prevNodes.map((n) => {
        const stepRun = activeStepRuns.find((s) => s.node_id === n.id);
        const hasErrors = validationResult.errors.some((e) => e.nodeId === n.id);
        const nodeErrors = validationResult.errors
          .filter((e) => e.nodeId === n.id)
          .map((e) => e.message);

        return {
          ...n,
          data: {
            ...n.data,
            hasErrors,
            errorMessages: nodeErrors,
            executionStatus: stepRun?.status,
            executionDurationMs: stepRun?.duration_ms || undefined,
            isSelected: n.id === selectedNodeId,
            onSelectNode: (id: string) => setSelectedNodeId(id),
            onDeleteNode: (id: string) => handleDeleteNode(id),
            onDuplicateNode: (id: string) => handleDuplicateNode(id),
          },
        };
      })
    );
  }, [validationResult, activeStepRuns, selectedNodeId]);

  // Connection validation
  const isValidConnection: IsValidConnection = useCallback(
    (connection: Connection | Edge) => {
      // 1. Prevent self-connection
      if (connection.source === connection.target) return false;

      // 2. Prevent multiple incoming edges into single target
      const existingIncoming = edges.filter((e) => e.target === connection.target);
      if (existingIncoming.length > 0) return false;

      return true;
    },
    [edges]
  );

  const onConnect: OnConnect = useCallback(
    (params: Connection) => {
      const isCondition = params.sourceHandle === 'true' || params.sourceHandle === 'false';
      const edgeColor =
        params.sourceHandle === 'true'
          ? '#10b981'
          : params.sourceHandle === 'false'
          ? '#f43f5e'
          : '#a855f7';

      const newEdge: Edge = {
        ...params,
        id: `e_${params.source}_${params.sourceHandle || 'def'}_${params.target}`,
        animated: true,
        style: { stroke: edgeColor, strokeWidth: 2 },
      };
      setEdges((eds) => addEdge(newEdge, eds as any) as any);
    },
    [setEdges]
  );

  // Drag & Drop Add Node
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow') as WorkflowNodeType;
      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const paletteItem = PALETTE_ITEMS.find((p) => p.type === type);
      const newNodeId = `node_${type.replace('action_', '').replace('trigger_', '')}_${Date.now().toString().slice(-4)}`;

      const newNode: Node<WorkflowNodeData> = {
        id: newNodeId,
        type: type === 'condition_if_else' ? 'conditionNode' : 'customNode',
        position,
        data: {
          nodeId: newNodeId,
          type,
          title: paletteItem?.title || 'New Step',
          config: paletteItem?.defaultConfig || {},
        },
      };

      setNodes((nds) => [...nds, newNode]);
      setSelectedNodeId(newNodeId);
    },
    [screenToFlowPosition, setNodes]
  );

  // Click-to-Add Node
  const handleAddNodeFromPalette = (type: WorkflowNodeType) => {
    const paletteItem = PALETTE_ITEMS.find((p) => p.type === type);
    const newNodeId = `node_${type.replace('action_', '').replace('trigger_', '')}_${Date.now().toString().slice(-4)}`;

    const newNode: Node<WorkflowNodeData> = {
      id: newNodeId,
      type: type === 'condition_if_else' ? 'conditionNode' : 'customNode',
      position: {
        x: 300 + Math.floor(Math.random() * 60),
        y: 100 + nodes.length * 120,
      },
      data: {
        nodeId: newNodeId,
        type,
        title: paletteItem?.title || 'New Step',
        config: paletteItem?.defaultConfig || {},
      },
    };

    setNodes((nds) => [...nds, newNode]);
    setSelectedNodeId(newNodeId);
  };

  // Node Inspector Updates
  const handleUpdateNode = (updated: WorkflowNode) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === updated.id) {
          return {
            ...n,
            data: {
              ...n.data,
              title: updated.title,
              config: updated.config,
            },
          };
        }
        return n;
      })
    );
  };

  // Delete Node
  const handleDeleteNode = (nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
  };

  // Duplicate Node
  const handleDuplicateNode = (nodeId: string) => {
    const original = nodes.find((n) => n.id === nodeId);
    if (!original) return;

    const origData = original.data as unknown as WorkflowNodeData;
    const newId = `node_${origData.type.replace('action_', '').replace('trigger_', '')}_${Date.now().toString().slice(-4)}`;

    const duplicateNode: Node<WorkflowNodeData> = {
      id: newId,
      type: original.type,
      position: {
        x: original.position.x + 40,
        y: original.position.y + 40,
      },
      data: {
        ...origData,
        nodeId: newId,
        title: `${origData.title} (Copy)`,
      },
    };

    setNodes((nds) => [...nds, duplicateNode]);
    setSelectedNodeId(newId);
  };

  // Save Draft Action
  const handleSave = async () => {
    const result = await onSaveGraph(currentWorkflowGraph);
    if (!result.error) {
      setLastSavedGraphJson(JSON.stringify(currentWorkflowGraph));
    }
  };

  // Keyboard Shortcuts (Ctrl+S for save, Escape to deselect)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if (e.key === 'Escape') {
        setSelectedNodeId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentWorkflowGraph]);

  return (
    <div className="relative w-full h-[720px] rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl">
      {/* Top Floating Action Toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 p-1.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-2xl backdrop-blur-xl">
        {/* Unsaved Changes Indicator */}
        {isDirty ? (
          <Badge variant="warning" className="text-[10px] animate-pulse">
            Unsaved Changes
          </Badge>
        ) : (
          <Badge variant="success" className="text-[10px] gap-1">
            <Check className="h-3 w-3" /> Saved
          </Badge>
        )}

        <div className="h-4 w-px bg-zinc-800" />

        {/* Save Draft Button */}
        <Button
          variant="secondary"
          size="sm"
          onClick={handleSave}
          isLoading={isSaving}
          className="h-7 text-xs px-2.5 gap-1.5"
        >
          <Save className="h-3.5 w-3.5 text-zinc-400" />
          <span>Save Draft</span>
        </Button>

        {/* Publish Button */}
        <Button
          size="sm"
          onClick={onOpenPublishModal}
          disabled={!validationResult.isValid}
          className="h-7 text-xs px-2.5 gap-1.5"
        >
          <Rocket className="h-3.5 w-3.5" />
          <span>Publish</span>
        </Button>

        {/* Test Run Button */}
        <Button
          size="sm"
          onClick={onOpenTestRunModal}
          className="h-7 text-xs px-2.5 gap-1.5 bg-purple-600 hover:bg-purple-500 text-white"
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          <span>Test Run</span>
        </Button>
      </div>

      {/* Top Right Live Run Status Overlay (if active) */}
      {activeRunRecord && (
        <div className="absolute top-4 right-14 z-10 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs shadow-xl backdrop-blur-md">
          <Activity className="h-3.5 w-3.5 text-purple-400 animate-spin" />
          <span className="text-zinc-400 font-mono">Run #{activeRunRecord.id.slice(0, 6)}:</span>
          <span className="font-semibold text-white capitalize">{activeRunRecord.status}</span>
        </div>
      )}

      {/* Node Palette (Left Drawer) */}
      <NodePalette
        isOpen={isPaletteOpen}
        onToggle={() => setIsPaletteOpen(!isPaletteOpen)}
        onAddNode={handleAddNodeFromPalette}
      />

      {/* Node Config Inspector (Right Drawer) */}
      <NodeConfigPanel
        node={selectedNode}
        onUpdateNode={handleUpdateNode}
        onDeleteNode={handleDeleteNode}
        onDuplicateNode={handleDuplicateNode}
        onClose={() => setSelectedNodeId(null)}
        validationErrors={
          selectedNodeId
            ? validationResult.errors
                .filter((e) => e.nodeId === selectedNodeId)
                .map((e) => e.message)
            : []
        }
      />

      {/* React Flow Viewport Canvas */}
      <div ref={reactFlowWrapper} className="w-full h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          isValidConnection={isValidConnection}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={(_, node) => setSelectedNodeId(node.id)}
          onPaneClick={() => setSelectedNodeId(null)}
          nodesDraggable={isInteractive}
          nodesConnectable={isInteractive}
          elementsSelectable={isInteractive}
          fitView
          className="bg-zinc-950"
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={16}
            size={1}
            color="#27272a"
          />

          <Controls
            showInteractive={false}
            className="!bg-zinc-900 !border-zinc-800 !rounded-xl !shadow-2xl overflow-hidden [&>button]:!bg-zinc-900 [&>button]:!border-zinc-800 [&>button]:!text-zinc-300 [&>button:hover]:!bg-zinc-800"
          />

          <MiniMap
            nodeColor={(node) => {
              if (node.type === 'conditionNode') return '#f59e0b';
              const type = (node.data as any)?.type || '';
              if (type.startsWith('trigger_')) return '#a855f7';
              if (type === 'action_ai_qualify') return '#6366f1';
              return '#3b82f6';
            }}
            maskColor="rgba(0, 0, 0, 0.75)"
            className="!bg-zinc-900/90 !border-zinc-800 !rounded-xl !shadow-2xl !overflow-hidden !bottom-4 !right-4"
          />
        </ReactFlow>
      </div>

      {/* Bottom Left Canvas Metrics Pill */}
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-3 px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-[11px] text-zinc-400 font-mono shadow-xl backdrop-blur-md">
        <span>Nodes: {nodes.length}</span>
        <span className="text-zinc-700">|</span>
        <span>Edges: {edges.length}</span>
        <span className="text-zinc-700">|</span>
        <span className={validationResult.isValid ? 'text-emerald-400' : 'text-amber-400'}>
          {validationResult.isValid ? '✓ Valid DAG' : `⚠️ ${validationResult.errors.length} Issue(s)`}
        </span>
      </div>
    </div>
  );
}

export function WorkflowCanvas(props: WorkflowCanvasProps) {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasInner {...props} />
    </ReactFlowProvider>
  );
}

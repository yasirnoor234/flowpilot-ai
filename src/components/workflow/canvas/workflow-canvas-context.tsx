'use client';

import React, { createContext, useContext } from 'react';
import type { WorkflowStepRunRecord } from '@/types/execution';

export interface WorkflowCanvasContextType {
  validationErrorsByNode: Record<string, string[]>;
  stepRunsByNode: Record<string, WorkflowStepRunRecord>;
  onOpenConfig: (nodeId: string) => void;
  onDuplicateNode: (nodeId: string) => void;
  onDeleteNode: (nodeId: string) => void;
}

const WorkflowCanvasContext = createContext<WorkflowCanvasContextType | null>(null);

export function WorkflowCanvasContextProvider({
  value,
  children,
}: {
  value: WorkflowCanvasContextType;
  children: React.ReactNode;
}) {
  return (
    <WorkflowCanvasContext.Provider value={value}>
      {children}
    </WorkflowCanvasContext.Provider>
  );
}

export function useWorkflowCanvas() {
  return useContext(WorkflowCanvasContext);
}

'use client';

import React from 'react';
import type { ValidationResult, ValidationError } from '@/lib/workflow/validator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

interface WorkflowValidatorPanelProps {
  validationResult: ValidationResult;
  onOpenPublishModal?: () => void;
}

const PUBLICATION_RULES: Array<{
  id: ValidationError['rule'];
  label: string;
  description: string;
}> = [
  {
    id: 'TRIGGER_COUNT',
    label: 'Single Trigger Root',
    description: 'Workflow must have exactly one root trigger (Manual or Webhook) with 0 incoming edges.',
  },
  {
    id: 'CYCLE_DETECTED',
    label: 'Directed Acyclic Graph (DAG)',
    description: 'Graph contains no circular references, feedback loops, or recursive jumps.',
  },
  {
    id: 'UNREACHABLE_NODE',
    label: 'Node Reachability',
    description: 'Every node in the graph is reachable via a directed path from the trigger.',
  },
  {
    id: 'INVALID_CONFIG',
    label: 'Typed Node Configuration',
    description: 'All node parameters conform to their typed Zod schemas.',
  },
  {
    id: 'UNKNOWN_NODE_TYPE',
    label: 'Registered Node Types',
    description: 'All nodes belong to the platform primitives.',
  },
  {
    id: 'INVALID_BRANCH_HANDLE',
    label: 'Conditional Branch Labels',
    description: 'IF/ELSE conditions have explicit "true" and "false" branches; standard actions have no branch handles.',
  },
  {
    id: 'BRANCH_MERGE',
    label: 'Branch Independence',
    description: 'Split conditional branches terminate independently without converging.',
  },
  {
    id: 'INVALID_UPSTREAM_REF',
    label: 'Upstream Output Availability',
    description: 'Template references like {{trigger.email}} or {{ai_qualify.score}} reference valid upstream ancestors.',
  },
];

export function WorkflowValidatorPanel({ validationResult, onOpenPublishModal }: WorkflowValidatorPanelProps) {
  const { isValid, errors } = validationResult;

  const errorRules = new Set(errors.map((e) => e.rule));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-indigo-600" />
          <CardTitle className="text-sm font-semibold text-zinc-900">
            Publication validation engine
          </CardTitle>
        </div>
        <Badge variant={isValid ? 'success' : 'destructive'} className="text-[10px]">
          {isValid ? 'Ready to publish' : `${errors.length} Issue${errors.length > 1 ? 's' : ''} found`}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Error Callout Banner if Invalid */}
        {errors.length > 0 && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 space-y-2 text-xs text-red-900">
            <div className="font-semibold flex items-center gap-1.5 text-red-700">
              <AlertTriangle className="h-4 w-4" />
              <span>Publication blockers</span>
            </div>
            <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] text-red-800">
              {errors.map((err, idx) => (
                <li key={idx}>
                  <span className="font-mono font-medium">[{err.nodeId ? `Node ${err.nodeId}` : 'Workflow'}]</span>: {err.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 8 Rules Checklist Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {PUBLICATION_RULES.map((rule) => {
            const hasError = errorRules.has(rule.id);
            return (
              <div
                key={rule.id}
                className={`p-3 rounded-xl border transition-all ${
                  hasError
                    ? 'border-red-200 bg-red-50/50'
                    : 'border-zinc-200 bg-zinc-50/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-900">{rule.label}</span>
                  {hasError ? (
                    <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  )}
                </div>
                <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                  {rule.description}
                </p>
              </div>
            );
          })}
        </div>

        {isValid && onOpenPublishModal && (
          <div className="pt-2 flex justify-end">
            <Button size="sm" onClick={onOpenPublishModal} className="gap-1.5 text-xs">
              <span>Publish this version</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


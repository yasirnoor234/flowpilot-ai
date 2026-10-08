'use client';

import React from 'react';
import type { ValidationResult, ValidationError } from '@/lib/workflow/validator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';

interface WorkflowValidatorPanelProps {
  validationResult: ValidationResult;
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
    description: 'All nodes belong to the 9 supported platform primitives (no arbitrary script injection).',
  },
  {
    id: 'INVALID_BRANCH_HANDLE',
    label: 'Conditional Branch Labels',
    description: 'IF/ELSE conditions have explicit "true" and "false" branches; standard actions have no branch handles.',
  },
  {
    id: 'BRANCH_MERGE',
    label: 'No Branch Merging (Strict MVP)',
    description: 'Split conditional branches terminate independently without converging.',
  },
  {
    id: 'INVALID_UPSTREAM_REF',
    label: 'Upstream Output Availability',
    description: 'Template references like {{trigger.email}} or {{ai_qualify.score}} reference valid upstream ancestors.',
  },
];

export function WorkflowValidatorPanel({ validationResult }: WorkflowValidatorPanelProps) {
  const { isValid, errors } = validationResult;

  const errorRules = new Set(errors.map((e) => e.rule));

  return (
    <Card className="border-zinc-800 bg-zinc-900/50">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-indigo-400" />
          <CardTitle className="text-sm font-semibold text-white">
            Publication Validation Engine
          </CardTitle>
        </div>
        <Badge variant={isValid ? 'success' : 'danger'} className="text-[10px]">
          {isValid ? 'Ready to Publish' : `${errors.length} Issue${errors.length > 1 ? 's' : ''} Found`}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Error Callout Banner if Invalid */}
        {errors.length > 0 && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 space-y-2 text-xs text-red-300">
            <div className="font-semibold flex items-center gap-1.5 text-red-400">
              <AlertTriangle className="h-4 w-4" />
              <span>Publication Blockers</span>
            </div>
            <ul className="list-disc list-inside space-y-1 pl-1">
              {errors.map((err, idx) => (
                <li key={idx} className="text-red-200">
                  {err.message}
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
                    ? 'border-red-500/30 bg-red-950/20'
                    : 'border-zinc-800 bg-zinc-950/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-200">{rule.label}</span>
                  {hasError ? (
                    <XCircle className="h-4 w-4 text-red-400 shrink-0" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  )}
                </div>
                <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                  {rule.description}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

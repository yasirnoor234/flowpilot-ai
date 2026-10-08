'use client';

import React, { useState } from 'react';
import type { WorkflowVersionRecord } from '@/types/workflow';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { History, Layers, Code, Lock } from 'lucide-react';

interface VersionHistoryProps {
  versions: WorkflowVersionRecord[];
  activeVersionId: string | null;
  workflowId?: string;
}

export function VersionHistory({ versions, activeVersionId }: VersionHistoryProps) {
  const [selectedVersion, setSelectedVersion] = useState<WorkflowVersionRecord | null>(
    versions[0] || null
  );
  const [viewJson, setViewJson] = useState(false);

  if (versions.length === 0) {
    return (
      <Card className="text-center p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-500 mx-auto mb-3">
          <History className="h-6 w-6" />
        </div>
        <h4 className="text-base font-semibold text-zinc-900">No published versions yet</h4>
        <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto leading-relaxed">
          When you validate and publish your workflow, immutable version snapshots will appear here.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Version List */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-1">
            Published snapshots ({versions.length})
          </div>

          <div className="space-y-2">
            {versions.map((ver) => {
              const isActive = ver.id === activeVersionId;
              const isSelected = selectedVersion?.id === ver.id;
              const nodeCount = Object.keys(ver.compiled_graph?.nodes || {}).length;

              return (
                <button
                  key={ver.id}
                  onClick={() => setSelectedVersion(ver)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                      : 'border-zinc-200 bg-white hover:border-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-900">v{ver.version_number}</span>
                      {isActive && (
                        <Badge variant="success" className="text-[9px] py-0">
                          Active
                        </Badge>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono tabular-nums">
                      {formatDate(ver.published_at)}
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-600 line-clamp-1">
                    {ver.change_summary || `Version ${ver.version_number}`}
                  </p>

                  <div className="mt-2 pt-2 border-t border-zinc-100 flex items-center justify-between text-[10px] text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Layers className="h-3 w-3" />
                      <span>{nodeCount} nodes</span>
                    </span>
                    <span className="flex items-center gap-1 text-emerald-600">
                      <Lock className="h-2.5 w-2.5" />
                      <span>Immutable</span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Version Inspector */}
        <div className="md:col-span-2">
          {selectedVersion ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base text-zinc-900">
                      Version {selectedVersion.version_number} snapshot
                    </CardTitle>
                    {selectedVersion.id === activeVersionId && (
                      <Badge variant="success" className="text-[10px]">
                        Active
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-xs mt-1">
                    Published {formatDate(selectedVersion.published_at)}
                  </CardDescription>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewJson(!viewJson)}
                >
                  <Code className="mr-1.5 h-3.5 w-3.5 text-zinc-500" />
                  <span>{viewJson ? 'View steps' : 'View JSON'}</span>
                </Button>
              </CardHeader>

              <CardContent className="space-y-4">
                {selectedVersion.change_summary && (
                  <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200 text-xs text-zinc-700">
                    <span className="font-semibold text-zinc-900">Changelog: </span>
                    {selectedVersion.change_summary}
                  </div>
                )}

                {viewJson ? (
                  <pre className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-200 overflow-x-auto max-h-96">
                    {JSON.stringify(selectedVersion.compiled_graph, null, 2)}
                  </pre>
                ) : (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                      Execution sequence ({selectedVersion.compiled_graph.execution_order.length} steps)
                    </div>

                    <div className="space-y-1.5 max-h-80 overflow-y-auto">
                      {selectedVersion.compiled_graph.execution_order.map((nodeId, idx) => {
                        const node = selectedVersion.compiled_graph.nodes[nodeId];
                        return (
                          <div
                            key={nodeId}
                            className="p-2.5 rounded-lg border border-zinc-200 bg-zinc-50 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="h-5 w-5 rounded-md bg-indigo-50 text-indigo-600 font-mono text-[10px] flex items-center justify-center font-bold">
                                {idx + 1}
                              </span>
                              <span className="font-medium text-zinc-900">
                                {node?.title || nodeId}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-zinc-500 uppercase px-2 py-0.5 rounded bg-white border border-zinc-200">
                              {node?.type || 'action'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}


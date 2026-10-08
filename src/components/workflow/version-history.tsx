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
}

export function VersionHistory({ versions, activeVersionId }: VersionHistoryProps) {
  const [selectedVersion, setSelectedVersion] = useState<WorkflowVersionRecord | null>(
    versions[0] || null
  );
  const [viewJson, setViewJson] = useState(false);

  if (versions.length === 0) {
    return (
      <Card className="border-zinc-800 bg-zinc-900/40 text-center p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-800/80 text-zinc-400 mx-auto mb-3">
          <History className="h-6 w-6" />
        </div>
        <h4 className="text-sm font-semibold text-white">No published versions yet</h4>
        <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto leading-relaxed">
          When you validate and publish your workflow, immutable DAG snapshots will be preserved here so in-flight executions remain stable.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Version List */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider px-1">
            Published Snapshots ({versions.length})
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
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">v{ver.version_number}</span>
                      {isActive && (
                        <Badge variant="success" className="text-[9px] py-0">
                          Active Live
                        </Badge>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {formatDate(ver.published_at)}
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-300 line-clamp-1">
                    {ver.change_summary || `Version ${ver.version_number}`}
                  </p>

                  <div className="mt-2 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[10px] text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Layers className="h-3 w-3" />
                      <span>{nodeCount} compiled nodes</span>
                    </span>
                    <span className="flex items-center gap-1 text-emerald-400">
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
            <Card className="border-zinc-800 bg-zinc-900/60">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base text-white">
                      Version {selectedVersion.version_number} Snapshot
                    </CardTitle>
                    {selectedVersion.id === activeVersionId && (
                      <Badge variant="success" className="text-[10px]">
                        Active In Production
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-xs mt-1">
                    Published {formatDate(selectedVersion.published_at)} • Immutable Execution Target
                  </CardDescription>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setViewJson(!viewJson)}
                >
                  <Code className="mr-1.5 h-3.5 w-3.5" />
                  <span>{viewJson ? 'View Steps' : 'View Compiled JSON'}</span>
                </Button>
              </CardHeader>

              <CardContent className="space-y-4">
                {selectedVersion.change_summary && (
                  <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800/80 text-xs text-zinc-300">
                    <span className="font-semibold text-zinc-200">Change Log: </span>
                    {selectedVersion.change_summary}
                  </div>
                )}

                {viewJson ? (
                  <pre className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-300 overflow-x-auto max-h-96">
                    {JSON.stringify(selectedVersion.compiled_graph, null, 2)}
                  </pre>
                ) : (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      Compiled Execution Sequence ({selectedVersion.compiled_graph.execution_order.length} Steps)
                    </div>

                    <div className="space-y-1.5 max-h-80 overflow-y-auto">
                      {selectedVersion.compiled_graph.execution_order.map((nodeId, idx) => {
                        const node = selectedVersion.compiled_graph.nodes[nodeId];
                        return (
                          <div
                            key={nodeId}
                            className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-950/50 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="h-5 w-5 rounded-md bg-indigo-500/10 text-indigo-400 font-mono text-[10px] flex items-center justify-center font-bold">
                                {idx + 1}
                              </span>
                              <span className="font-medium text-white">
                                {node?.title || nodeId}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-zinc-400 uppercase px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
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

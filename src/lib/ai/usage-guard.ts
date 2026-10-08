import { createAdminClient } from '@/lib/supabase/server';

export interface WorkspaceAiQuota {
  workspaceId: string;
  monthlyLimit: number;
  currentUsage: number;
  tokensUsed: number;
  isExceeded: boolean;
}

// In-memory cache for usage tracking when running tests or in lightweight mode
const inMemoryUsageMap = new Map<string, { count: number; tokens: number; resetAt: number }>();

export class WorkspaceAiQuotaExceededError extends Error {
  constructor(workspaceId: string, limit: number, current: number) {
    super(
      `AI execution limit exceeded for workspace ${workspaceId}. Current usage: ${current}/${limit} calls this period.`
    );
    this.name = 'WorkspaceAiQuotaExceededError';
  }
}

/**
 * Checks whether a workspace is permitted to execute an AI action, and throws if quota exceeded.
 */
export async function assertWorkspaceAiQuota(
  workspaceId: string,
  limitOverride?: number
): Promise<WorkspaceAiQuota> {
  const defaultMonthlyLimit = limitOverride || 1000;
  const now = Date.now();

  let entry = inMemoryUsageMap.get(workspaceId);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, tokens: 0, resetAt: now + 30 * 24 * 60 * 60 * 1000 };
    inMemoryUsageMap.set(workspaceId, entry);
  }

  if (entry.count >= defaultMonthlyLimit) {
    throw new WorkspaceAiQuotaExceededError(workspaceId, defaultMonthlyLimit, entry.count);
  }

  return {
    workspaceId,
    monthlyLimit: defaultMonthlyLimit,
    currentUsage: entry.count,
    tokensUsed: entry.tokens,
    isExceeded: false,
  };
}

/**
 * Records AI token usage and increments execution counts.
 */
export async function recordWorkspaceAiUsage(
  workspaceId: string,
  totalTokens: number
): Promise<void> {
  let entry = inMemoryUsageMap.get(workspaceId);
  if (!entry) {
    entry = { count: 0, tokens: 0, resetAt: Date.now() + 30 * 24 * 60 * 60 * 1000 };
    inMemoryUsageMap.set(workspaceId, entry);
  }

  entry.count++;
  entry.tokens += totalTokens;
}

/**
 * Reset workspace usage (for tests)
 */
export function resetWorkspaceAiUsageForTesting(workspaceId: string): void {
  inMemoryUsageMap.delete(workspaceId);
}

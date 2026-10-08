import type { AiProvider } from './provider';
import { OpenAiAdapter } from './openai-adapter';
import { MockAiAdapter } from './mock-adapter';
import { assertWorkspaceAiQuota, recordWorkspaceAiUsage } from './usage-guard';
import type {
  AiQualificationInput,
  AiQualificationResult,
  AiTextClassificationInput,
  AiTextClassificationResult,
  AiEmailDraftInput,
  AiEmailDraftResult,
  AiUsageMetadata,
  AiExecutionOptions,
} from '@/types/ai';

export * from '@/types/ai';
export * from './provider';
export * from './mock-adapter';
export * from './openai-adapter';
export * from './usage-guard';

/**
 * Returns the appropriate AI provider instance based on environment and workspace configuration.
 */
export async function getAiProviderForWorkspace(
  workspaceId?: string,
  modelOverride?: string
): Promise<AiProvider> {
  if (process.env.USE_MOCK_AI === 'true') {
    return new MockAiAdapter();
  }

  // 1. Check if workspace has an encrypted OpenAI key configured in integration_connections
  if (workspaceId) {
    try {
      const { createAdminClient } = await import('@/lib/supabase/server');
      const { decryptSecret } = await import('@/lib/security/encryption');
      const admin = createAdminClient();
      const { data: conn } = await (admin.from('integration_connections') as any)
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('provider', 'openai')
        .eq('is_active', true)
        .single();

      if (conn?.encrypted_credentials) {
        const decryptedKey = decryptSecret(conn.encrypted_credentials);
        const model = modelOverride || conn.settings?.model || 'gpt-4o-mini';
        return new OpenAiAdapter(decryptedKey, model);
      }
    } catch {
      // Fallback if lookup fails
    }
  }

  // 2. Fallback to process.env.OPENAI_API_KEY
  if (process.env.OPENAI_API_KEY) {
    return new OpenAiAdapter(process.env.OPENAI_API_KEY, modelOverride || process.env.OPENAI_MODEL || 'gpt-4o-mini');
  }

  // 3. Fallback to free deterministic mock adapter
  return new MockAiAdapter();
}

export function getAiProvider(options?: {
  apiKey?: string;
  model?: string;
  forceMock?: boolean;
}): AiProvider {
  const apiKey = options?.apiKey || process.env.OPENAI_API_KEY;
  const forceMock = options?.forceMock || process.env.USE_MOCK_AI === 'true';

  if (!apiKey || forceMock) {
    return new MockAiAdapter();
  }

  return new OpenAiAdapter(apiKey, options?.model);
}

/**
 * Unified helper to qualify a lead with quota enforcement and usage tracking.
 */
export async function executeAiLeadQualification(
  input: AiQualificationInput,
  options?: AiExecutionOptions
): Promise<{ result: AiQualificationResult; metadata: AiUsageMetadata }> {
  if (options?.workspaceId) {
    await assertWorkspaceAiQuota(options.workspaceId);
  }

  const provider = await getAiProviderForWorkspace(options?.workspaceId, options?.modelOverride);
  const response = await provider.qualifyLead(input, options);

  if (options?.workspaceId) {
    await recordWorkspaceAiUsage(options.workspaceId, response.metadata.total_tokens);
  }

  return response;
}

/**
 * Unified helper to classify text with quota enforcement and usage tracking.
 */
export async function executeAiTextClassification(
  input: AiTextClassificationInput,
  options?: AiExecutionOptions
): Promise<{ result: AiTextClassificationResult; metadata: AiUsageMetadata }> {
  if (options?.workspaceId) {
    await assertWorkspaceAiQuota(options.workspaceId);
  }

  const provider = await getAiProviderForWorkspace(options?.workspaceId, options?.modelOverride);
  const response = await provider.classifyText(input, options);

  if (options?.workspaceId) {
    await recordWorkspaceAiUsage(options.workspaceId, response.metadata.total_tokens);
  }

  return response;
}

/**
 * Unified helper to draft an email response with quota enforcement and usage tracking.
 */
export async function executeAiEmailDraft(
  input: AiEmailDraftInput,
  options?: AiExecutionOptions
): Promise<{ result: AiEmailDraftResult; metadata: AiUsageMetadata }> {
  if (options?.workspaceId) {
    await assertWorkspaceAiQuota(options.workspaceId);
  }

  const provider = await getAiProviderForWorkspace(options?.workspaceId, options?.modelOverride);
  const response = await provider.draftEmail(input, options);

  if (options?.workspaceId) {
    await recordWorkspaceAiUsage(options.workspaceId, response.metadata.total_tokens);
  }

  return response;
}


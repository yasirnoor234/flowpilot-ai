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

  const provider = getAiProvider({ model: options?.modelOverride });
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

  const provider = getAiProvider({ model: options?.modelOverride });
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

  const provider = getAiProvider({ model: options?.modelOverride });
  const response = await provider.draftEmail(input, options);

  if (options?.workspaceId) {
    await recordWorkspaceAiUsage(options.workspaceId, response.metadata.total_tokens);
  }

  return response;
}

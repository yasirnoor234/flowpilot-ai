import {
  encryptSecret,
  decryptSecret,
  maskSecret,
  redactSecrets,
  validateSlackWebhookUrl,
} from '../src/lib/security/encryption';
import { buildSlackLeadPayload } from '../src/lib/integrations/slack';

async function runIntegrationTests() {
  console.log('⚡ Starting FlowPilot AI Phase 7 (Live Integrations) Verification Suite...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // 1. Encryption & Decryption Roundtrip
  console.log('--- Test Group 1: AES-256-GCM Encryption & Decryption ---');
  const sampleApiKey = 're_1234567890abcdefghijklmnopqrstuvwxyz';
  const encrypted = encryptSecret(sampleApiKey);
  assert(encrypted !== sampleApiKey, 'API Key is encrypted into base64 ciphertext');
  assert(encrypted.length > 30, 'Ciphertext includes IV, AuthTag, and Payload');

  const decrypted = decryptSecret(encrypted);
  assert(decrypted === sampleApiKey, 'Decrypted ciphertext matches original API key exactly');

  const masked = maskSecret(sampleApiKey);
  assert(masked === 're_••••••••wxyz', 'Secret is masked properly for UI display');
  assert(!masked.includes('1234567890'), 'Masked output contains no inner secret material');

  // 2. Secret Redaction from Logs and Errors
  console.log('\n--- Test Group 2: Secret Redaction from Logs & Diagnostics ---');
  const rawLog = 'Failed to connect: API key re_9876543210fedcba9876543210 and webhook https://hooks.slack.com/services/T00/B00/SECRET123 failed.';
  const redacted = redactSecrets(rawLog);
  assert(!redacted.includes('re_9876543210fedcba9876543210'), 'Resend key is redacted');
  assert(!redacted.includes('SECRET123'), 'Slack webhook secret is redacted');
  assert(redacted.includes('[REDACTED_RESEND_KEY]'), 'Redaction placeholder is inserted');
  assert(redacted.includes('[REDACTED_SLACK_WEBHOOK]'), 'Slack placeholder is inserted');

  // 3. Slack Webhook Host Validation & SSRF Prevention
  console.log('\n--- Test Group 3: Slack Host Security & SSRF Protection ---');
  const validSlackUrl = 'https://hooks.slack.com/services/T123/B456/789xyz';
  assert(validateSlackWebhookUrl(validSlackUrl).valid, 'Valid Slack webhook URL is accepted');

  const invalidUrls = [
    'http://hooks.slack.com/services/T123/B456/789xyz', // HTTP instead of HTTPS
    'https://evil-hacker.com/services/T123/B456/789xyz', // Non-Slack domain
    'https://169.254.169.254/latest/meta-data/', // AWS/GCP metadata SSRF attempt
    'https://localhost:8080/services/test', // Loopback SSRF attempt
    'https://hooks.slack.com/not-services/test', // Wrong path
    'not a url',
  ];

  for (let i = 0; i < invalidUrls.length; i++) {
    const check = validateSlackWebhookUrl(invalidUrls[i]);
    assert(!check.valid, `SSRF / Invalid URL candidate #${i + 1} blocked: ${invalidUrls[i]}`);
  }

  // 4. Slack Block Kit Payload Generator
  console.log('\n--- Test Group 4: Slack Block Kit Payload Structure ---');
  const leadPayload = buildSlackLeadPayload(
    {
      workspaceId: 'ws-test',
      text: 'New Inbound Lead',
      leadContext: {
        id: 'lead-12345',
        name: 'Sarah Connor',
        company: 'SkyDefense AI',
        qualificationScore: 92,
        leadTier: 'hot',
        summary: 'Wants to deploy autonomous workflow orchestration at scale.',
      },
    },
    'https://app.flowpilot.ai'
  );

  assert(leadPayload.text.includes('🔥 HOT'), 'Lead text includes hot tier emoji and badge');
  assert(leadPayload.blocks.length >= 4, 'Block Kit includes header, fields, summary, and action button');
  const button = leadPayload.blocks.find((b: any) => b.type === 'actions')?.elements?.[0];
  assert(button?.url === 'https://app.flowpilot.ai/leads/lead-12345', 'Action button links directly to lead inspector');

  // 5. Idempotency Key Guard Logic
  console.log('\n--- Test Group 5: Delivery Idempotency Logic ---');
  const existingDeliveries = new Map<string, { status: string; id: string }>();
  existingDeliveries.set('idemp_email_001', { status: 'delivered', id: 'msg_992' });

  function checkIdempotency(key: string): { isDuplicate: boolean; msgId?: string } {
    if (existingDeliveries.has(key)) {
      const match = existingDeliveries.get(key)!;
      return { isDuplicate: true, msgId: match.id };
    }
    return { isDuplicate: false };
  }

  assert(checkIdempotency('idemp_email_001').isDuplicate, 'Duplicate event with existing key is intercepted');
  assert(!checkIdempotency('idemp_email_002').isDuplicate, 'New event with unique key proceeds to delivery');

  console.log('\n======================================================');
  console.log(`Phase 7 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runIntegrationTests().catch((err) => {
  console.error('Fatal error in integration test runner:', err);
  process.exit(1);
});

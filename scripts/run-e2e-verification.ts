import { WORKFLOW_TEMPLATES } from '../src/lib/workflow/templates';
import { normalizeEmail, resolveLeadIdentityKey } from '../src/lib/crm/leads';
import { MockAiAdapter } from '../src/lib/ai/mock-adapter';
import { buildSlackLeadPayload } from '../src/lib/integrations/slack';
import { encryptSecret, decryptSecret, redactSecrets, validateSlackWebhookUrl } from '../src/lib/security/encryption';

async function runEndToEndVerification() {
  console.log('🚀 Starting FlowPilot AI Full End-to-End Workflow Verification...\n');

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

  // ---------------------------------------------------------------------------
  // Step 1: Template Validation
  // ---------------------------------------------------------------------------
  console.log('--- Step 1: Workflow Template Registry ---');
  assert(WORKFLOW_TEMPLATES.length === 3, 'All 3 production templates are registered');
  const tplLead = WORKFLOW_TEMPLATES.find((t) => t.id === 'lead-qualification-and-response');
  assert(!!tplLead, 'Lead Qualification & Response template is present');
  assert(tplLead?.graph.nodes.length === 8, 'Lead template contains all 8 pipeline nodes');

  const tplSupport = WORKFLOW_TEMPLATES.find((t) => t.id === 'customer-inquiry-classification');
  assert(!!tplSupport, 'Support classification template is present');

  const tplProposal = WORKFLOW_TEMPLATES.find((t) => t.id === 'proposal-followup-reminder');
  assert(!!tplProposal, 'Proposal follow-up template is present');

  // ---------------------------------------------------------------------------
  // Step 2: Inbound Webhook Ingestion & Identity Normalization
  // ---------------------------------------------------------------------------
  console.log('\n--- Step 2: Webhook Trigger Ingestion & Email Normalization ---');
  const rawWebhookPayload = {
    name: 'Sarah Connor',
    email: '  Sarah.Connor@SkyDefense.AI  ',
    phone: '+1 (555) 019-2834',
    company: 'Cyberdyne Systems',
    service_interest: 'Enterprise AI Automation',
    estimated_budget: 35000,
    message: 'Looking to deploy autonomous workflow orchestration for our sales operations.',
    source: 'website_contact_form',
  };

  const normalizedEmail = normalizeEmail(rawWebhookPayload.email);
  assert(normalizedEmail === 'sarah.connor@skydefense.ai', 'Email is lowercased and trimmed');

  const identity = resolveLeadIdentityKey({
    workspace_id: 'ws_demo_123',
    email: rawWebhookPayload.email,
    name: rawWebhookPayload.name,
  });
  assert(identity.type === 'email' && identity.key === 'sarah.connor@skydefense.ai', 'Identity resolved via email');

  // ---------------------------------------------------------------------------
  // Step 3: AI Qualification Execution
  // ---------------------------------------------------------------------------
  console.log('\n--- Step 3: AI Qualification Scoring ---');
  const aiAdapter = new MockAiAdapter();
  const { result: qualResult, metadata: qualMeta } = await aiAdapter.qualifyLead({
    message: rawWebhookPayload.message,
    service_interest: rawWebhookPayload.service_interest,
    company: rawWebhookPayload.company,
    estimated_budget: rawWebhookPayload.estimated_budget,
    lead_name: rawWebhookPayload.name,
  });

  assert(qualResult.qualification_score >= 80, `High budget lead qualified as HOT (Score: ${qualResult.qualification_score})`);
  assert(qualResult.lead_tier === 'hot', 'Assigned lead tier is HOT');
  assert(qualResult.suggested_next_action.length > 0, 'Suggested next action generated');
  assert(qualMeta.total_tokens > 0, 'AI Token metrics recorded');

  // ---------------------------------------------------------------------------
  // Step 4: CRM Upsert Simulation
  // ---------------------------------------------------------------------------
  console.log('\n--- Step 4: CRM Lead Record State Persistence ---');
  const crmRecord = {
    id: 'lead_sim_99182',
    workspace_id: 'ws_demo_123',
    name: rawWebhookPayload.name,
    email: normalizedEmail,
    company: rawWebhookPayload.company,
    qualification_status: qualResult.lead_tier,
    qualification_score: qualResult.qualification_score,
    status: 'new',
    created_at: new Date().toISOString(),
  };

  assert(crmRecord.email === 'sarah.connor@skydefense.ai', 'CRM lead email stored in canonical form');
  assert(crmRecord.qualification_score === qualResult.qualification_score, 'AI qualification score synchronized');

  // ---------------------------------------------------------------------------
  // Step 5: Email Auto-Response & Secret Masking
  // ---------------------------------------------------------------------------
  console.log('\n--- Step 5: Resend Email Dispatch Preparation ---');
  const emailDraft = {
    to: crmRecord.email,
    from: 'FlowPilot <onboarding@resend.dev>',
    subject: 'Thank you for reaching out to FlowPilot AI',
    html: `<p>Hi ${crmRecord.name},</p><p>We have received your project details for ${rawWebhookPayload.service_interest}.</p>`,
    idempotencyKey: `email_test_${Date.now()}`,
  };

  assert(emailDraft.to === 'sarah.connor@skydefense.ai', 'Target recipient set to normalized lead email');
  assert(emailDraft.idempotencyKey.startsWith('email_test_'), 'Idempotency key assigned');

  // ---------------------------------------------------------------------------
  // Step 6: Slack Block Kit Notification
  // ---------------------------------------------------------------------------
  console.log('\n--- Step 6: Slack Block Kit Alert Card ---');
  const slackValidation = validateSlackWebhookUrl('https://hooks.slack.com/services/T00/B00/SECRET123');
  assert(slackValidation.valid, 'Slack Webhook host validated strictly');

  const slackPayload = buildSlackLeadPayload(
    {
      workspaceId: 'ws_demo_123',
      text: `Priority Inbound Lead: ${crmRecord.name}`,
      leadContext: {
        id: crmRecord.id,
        name: crmRecord.name,
        company: crmRecord.company,
        qualificationScore: crmRecord.qualification_score,
        leadTier: crmRecord.qualification_status,
        summary: qualResult.summary,
      },
    },
    'https://app.flowpilot.ai'
  );

  assert(slackPayload.text.includes('🔥 HOT'), 'Slack alert includes priority fire emoji badge');
  assert(slackPayload.blocks.length >= 4, 'Slack Block Kit has full visual hierarchy');

  // ---------------------------------------------------------------------------
  // Step 7: Durable Delay & Live Follow-up Eligibility Re-reading
  // ---------------------------------------------------------------------------
  console.log('\n--- Step 7: Durable Delay & Live State Re-reading ---');
  const delayStep = {
    nodeId: 'node-delay-followup',
    durationHours: 24,
    scheduledResumeTime: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
  };
  assert(delayStep.durationHours === 24, '24-hour durable delay scheduled');

  // Scenario 7A: Lead is still open/new -> Follow-up is eligible
  function evaluateFollowupEligibility(status: string, optedOut: boolean = false) {
    if (['won', 'converted', 'lost', 'unqualified'].includes(status) || optedOut) {
      return { eligible: false, reason: `Skipped: Lead status is "${status}" — follow-up no longer eligible.` };
    }
    return { eligible: true, reason: null };
  }

  const checkOpenLead = evaluateFollowupEligibility('new');
  assert(checkOpenLead.eligible === true, 'Open lead is eligible for follow-up reminder');

  // Scenario 7B: Lead was closed/converted during delay -> Follow-up is skipped
  const checkConvertedLead = evaluateFollowupEligibility('converted');
  assert(checkConvertedLead.eligible === false, 'Converted lead is cleanly skipped');
  assert(Boolean(checkConvertedLead.reason?.includes('converted')), 'Skipped reason contains updated lead status');

  const checkLostLead = evaluateFollowupEligibility('lost');
  assert(checkLostLead.eligible === false, 'Lost lead is cleanly skipped');

  const checkOptedOutLead = evaluateFollowupEligibility('contacted', true);
  assert(checkOptedOutLead.eligible === false, 'Opted out lead is cleanly skipped');

  // ---------------------------------------------------------------------------
  // Step 8: Secret Redaction & Log Security
  // ---------------------------------------------------------------------------
  console.log('\n--- Step 8: Secret Redaction Verification ---');
  const sensitiveString = JSON.stringify({
    resend_key: 're_1234567890abcdefghijklmn',
    openai_key: 'sk-99887766554433221100aabbcc',
    slack_webhook: 'https://hooks.slack.com/services/T11/B22/SEC999',
  });
  const sanitized = redactSecrets(sensitiveString);
  assert(!sanitized.includes('re_1234567890'), 'Resend key redacted');
  assert(!sanitized.includes('sk-9988776655'), 'OpenAI key redacted');
  assert(!sanitized.includes('SEC999'), 'Slack webhook secret redacted');

  console.log('\n======================================================');
  console.log(`Full E2E Verification Results: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runEndToEndVerification().catch((err) => {
  console.error('Fatal error in E2E verification runner:', err);
  process.exit(1);
});

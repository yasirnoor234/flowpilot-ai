import { runWorkflowValidationTests } from '../src/lib/workflow/__tests__/validator.test';

console.log('===========================================================');
console.log('FlowPilot AI: Running Workflow Publication Validation Tests');
console.log('===========================================================');

const summary = runWorkflowValidationTests();

for (const res of summary.results) {
  const icon = res.passed ? '✓ PASS' : '✗ FAIL';
  console.log(`${icon}: ${res.test}`);
  if (res.message) {
    console.log(`  Details: ${res.message}`);
  }
}

console.log('-----------------------------------------------------------');
console.log(`Total: ${summary.total} | Passed: ${summary.passed} | Failed: ${summary.failed}`);
console.log('===========================================================');

if (summary.failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}

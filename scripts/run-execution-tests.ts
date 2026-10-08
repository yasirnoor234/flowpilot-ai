import { runExecutionEngineTests } from '../src/lib/workflow/__tests__/execution-engine.test';

async function main() {
  console.log('--- Starting FlowPilot AI Phase 3 Execution Engine Test Suite ---\n');
  try {
    const summary = await runExecutionEngineTests();

    console.log('Individual Test Results:');
    for (const r of summary.results) {
      const statusIcon = r.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${statusIcon}: ${r.test}${r.message ? ` (${r.message})` : ''}`);
    }

    console.log('\n--- Execution Engine Test Summary ---');
    console.log(`Total: ${summary.total} | Passed: ${summary.passed} | Failed: ${summary.failed}`);

    if (summary.failed > 0) {
      console.error('\nSome Phase 3 execution engine tests failed!');
      process.exit(1);
    } else {
      console.log('\nAll Phase 3 execution engine tests PASSED successfully.');
    }
  } catch (error) {
    console.error('Fatal error during test execution:', error);
    process.exit(1);
  }
}

main();

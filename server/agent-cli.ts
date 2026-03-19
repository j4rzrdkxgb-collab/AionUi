/**
 * Minimal CLI to run the browser-use agent.
 * Usage: ts-node server/agent-cli.ts "Your task string here"
 */
import { runBrowserUseTask } from './browser-use-agent';

async function main() {
  const task = process.argv[2];
  if (!task) {
    console.error('Usage: ts-node server/agent-cli.ts "Your task string here"');
    process.exit(1);
  }

  console.log(`Running browser-use agent with task: ${task}`);
  const result = await runBrowserUseTask(task);

  if (result.success) {
    console.log('Agent completed successfully.');
    console.log('Result:', JSON.stringify(result.result, null, 2));
    process.exit(0);
  } else {
    console.error('Agent failed:', result.error);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});

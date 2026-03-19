#!/usr/bin/env node
// server/browser-use-cli.ts
// Minimal CLI wrapper around runBrowserUseTask

import { runBrowserUseTask } from './browser-use-agent';

function parseArgs() {
  const argv = process.argv.slice(2);
  const out: any = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--task' && argv[i + 1]) { out.task = argv[++i]; }
    else if (a === '--model' && argv[i + 1]) { out.model = argv[++i]; }
    else if (a === '--timeout' && argv[i + 1]) { out.timeoutMs = Number(argv[++i]); }
    else if (a === '--help') { out.help = true; }
  }
  return out;
}

async function readStdin(): Promise<string | null> {
  const stdin = process.stdin;
  if (stdin.isTTY) return null;
  const chunks: Buffer[] = [];
  for await (const chunk of stdin) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf8');
}

(async () => {
  try {
    const args = parseArgs();
    if (args.help) {
      console.log('Usage: node server/browser-use-cli.js --task "Your instructions" [--model name] [--timeout ms]');
      process.exit(0);
    }

    let task = args.task;
    let model = args.model;
    let timeoutMs = args.timeoutMs;

    if (!task) {
      const stdinText = await readStdin();
      if (stdinText) {
        try {
          const parsed = JSON.parse(stdinText);
          task = parsed.task ?? task;
          model = parsed.model ?? model;
          timeoutMs = parsed.timeoutMs ?? timeoutMs;
        } catch (e) {
          // if not JSON, use raw text as task
          task = stdinText.trim();
        }
      }
    }

    if (!task) {
      console.error(JSON.stringify({ success: false, error: 'No task provided. Use --task or pipe JSON/ task text via stdin.' }));
      process.exit(2);
    }

    const res = await runBrowserUseTask(task, { model, timeoutMs });
    console.log(JSON.stringify(res));
    if (!res.success) process.exit(1);
    process.exit(0);
  } catch (err: any) {
    console.error(JSON.stringify({ success: false, error: err?.message ?? String(err) }));
    process.exit(1);
  }
})();

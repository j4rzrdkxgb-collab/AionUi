# Browser-Use CLI Agent

A lightweight, on-demand CLI that runs [browser-use](https://github.com/browser-use/browser-use) (Playwright under the hood) to execute LLM-driven browser tasks. Spawned by AionUi on demand — no background process required.

---

## Quick Start (3 commands)

```bash
npm install
npm run agent:install-browsers
npm run agent:cli -- --task "Go to example.com and take a screenshot"
```

---

## Files

| File | Purpose |
|---|---|
| `server/browser-use-agent.ts` | Core wrapper: `runBrowserUseTask(task, opts)` |
| `server/browser-use-cli.ts` | CLI entrypoint — spawnable by AionUi or run manually |
| `apps/ionic/src/pages/AgentPage.tsx` | Example UI page with HTTP trigger and spawn comment |

---

## Installation

1. **Install Node dependencies:**
   ```bash
   npm install
   ```

2. **Install Playwright browsers (required for browser-use):**
   ```bash
   npm run agent:install-browsers
   # or: npx playwright install
   ```

3. **Set your OpenAI API key (optional but recommended):**
   ```bash
   export OPENAI_API_KEY=sk-...
   ```

---

## Running the CLI

### Inline task (flag)
```bash
npm run agent:cli -- --task "Search for the latest TypeScript release on Google"
```

### With model and timeout options
```bash
npm run agent:cli -- --task "Open example.com and describe the page" --model gpt-4o --timeout 60000
```

### Pipe task via stdin (plain text)
```bash
echo "Navigate to github.com and list top repos" | npm run agent:cli
```

### Pipe task via stdin (JSON)
```bash
echo '{"task":"Go to example.com","model":"gpt-4o","timeoutMs":90000}' | npm run agent:cli
```

### Get help
```bash
npm run agent:cli -- --help
```

---

## Spawning from AionUi (Electron/Node main process)

```typescript
import { spawn } from 'child_process';

const task = 'Open example.com and take a screenshot';

const p = spawn('node', ['server/browser-use-cli.js', '--task', task], {
  env: { ...process.env, OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? '' },
});

p.stdout.on('data', (d) => {
  const line = d.toString().trim();
  try {
    const result = JSON.parse(line);
    console.log('Agent result:', result);
    // result = { success: true, result: ... } or { success: false, error: '...' }
  } catch {
    console.log('Agent stdout:', line);
  }
});

p.stderr.on('data', (d) => console.error('Agent stderr:', d.toString()));
p.on('exit', (code) => console.log('Agent exited with code:', code));
```

---

## Output Format

The CLI always outputs a single JSON line to **stdout**:

```json
{ "success": true, "result": "..." }
```

On failure:
```json
{ "success": false, "error": "Error message here" }
```

Exit code `0` = success, `1` = agent error, `2` = no task provided.

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `OPENAI_API_KEY` | Required to use the ChatOpenAI LLM adapter with browser-use |

If `OPENAI_API_KEY` is not set, the agent attempts to run without an LLM — this will usually fail unless browser-use supports a no-LLM mode.

---

## Security Notes

- The CLI opens a **real, visible browser** on the local machine with full internet access.
- **Never expose the agent HTTP endpoint** (`localhost:8788/agent/run`) to external networks without authentication.
- Bind any HTTP trigger to `127.0.0.1` only.
- Treat the `OPENAI_API_KEY` as a secret — never log it or commit it to source control.
- Consider sandboxing browser contexts per task to avoid cross-site data leakage.
- Add user confirmation steps for any destructive browser actions (form submits, downloads).

---

## Troubleshooting

**`browser-use module not found`**
→ Run `npm install` to install the `browser-use` package.

**`Executable doesn't exist at ...`**
→ Run `npm run agent:install-browsers` to download Playwright browser binaries.

**Agent hangs or times out**
→ Use `--timeout <ms>` to override the default 120-second timeout.

**No LLM response / empty result**
→ Ensure `OPENAI_API_KEY` is set and valid.

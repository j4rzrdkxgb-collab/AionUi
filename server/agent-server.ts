/**
 * Small on-demand HTTP trigger for the browser-use agent.
 * - POST /agent/run   JSON: { task: string, model?: string, timeoutMs?: number }
 */

import express from 'express';
import bodyParser from 'body-parser';
import { runBrowserUseTask } from './browser-use-agent';

const app = express();
app.use(bodyParser.json({ limit: '1mb' }));

const PORT = Number(process.env.AGENT_HTTP_PORT ?? 8788);

app.post('/agent/run', async (req, res) => {
  const task: string = req.body?.task;
  const model: string | undefined = req.body?.model;
  const timeoutMs: number | undefined = req.body?.timeoutMs;

  if (!task || typeof task !== 'string') {
    return res.status(400).json({ success: false, error: 'missing task (string)' });
  }

  try {
    const result = await runBrowserUseTask(task, { model, timeoutMs });
    if (result.success) {
      return res.json({ success: true, result: result.result });
    } else {
      return res.status(500).json({ success: false, error: result.error });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message ?? String(err) });
  }
});

app.get('/agent/health', (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.listen(PORT, () => {
  console.log(`Agent HTTP server listening on http://localhost:${PORT}`);
});

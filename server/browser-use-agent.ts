/**
 * Lightweight wrapper to run a browser-use Agent on demand.
 */
import { Agent } from 'browser-use';
import type { AgentHistory } from 'browser-use/dist/types'; // optional types import, adjust if your install differs

// Optional LLM support (OpenAI) — path may vary depending on browser-use package version.
let ChatOpenAI: any;
try {
  // this import path is based on the browser-use README/example; adjust if your install differs
  ChatOpenAI = require('browser-use/llm/openai').ChatOpenAI;
} catch (_e) {
  ChatOpenAI = undefined;
}

export type RunResult = {
  success: boolean;
  result?: any;
  error?: string;
};

/**
 * Run a single browser-use Agent task and return final result.
 * The agent will run headful (visible) Playwright by default via browser-use internals.
 */
export async function runBrowserUseTask(
  task: string,
  opts?: { model?: string; timeoutMs?: number }
): Promise<RunResult> {
  if (!task || typeof task !== 'string') {
    return { success: false, error: 'task must be a non-empty string' };
  }

  // Build LLM instance if available
  let llm: any = undefined;
  if (process.env.OPENAI_API_KEY && ChatOpenAI) {
    llm = new ChatOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      model: opts?.model ?? 'gpt-4o', // change default as you prefer
    });
  } else if (process.env.OPENAI_API_KEY && !ChatOpenAI) {
    // if ChatOpenAI couldn't be required, warn but continue
    console.warn('OPENAI_API_KEY is set but browser-use OpenAI module not found. Proceeding without LLM.');
  }

  try {
    const agentOptions: any = {
      task,
      // pass llm only if created
      ...(llm ? { llm } : {}),
      // you can add extra browser-use options here (timeouts, telemetry, headful/headless overrides, etc.)
    };

    const agent = new Agent(agentOptions);

    // run the agent; some versions return history object, others may return result directly
    const history: AgentHistory | any = await agent.run({ timeout: opts?.timeoutMs ?? 120000 });

    // Try to extract a final result in several common shapes:
    let final: any = null;
    try {
      // Some examples use history.final_result()
      if (history && typeof history.final_result === 'function') {
        final = await history.final_result();
      } else if (history?.final_result) {
        final = history.final_result;
      } else if (history?.result) {
        final = history.result;
      } else {
        final = history;
      }
    } catch (_inner) {
      final = history;
    }

    return { success: true, result: final };
  } catch (err: any) {
    return { success: false, error: err?.message ?? String(err) };
  }
}

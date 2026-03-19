// server/browser-use-agent.ts
/**
 * Lightweight wrapper to run a browser-use Agent on demand.
 *
 * Usage:
 *  - runBrowserUseTask("Search for ...")
 *  - This will launch Playwright browsers under the hood (visible by default).
 *
 * Notes:
 *  - If OPENAI_API_KEY is set, this will construct a ChatOpenAI LLM instance and pass it to Agent.
 *  - If no API key is present, behavior depends on browser-use defaults (may error if an LLM is required).
 *  - Adjust model name in opts.model as needed.
 */

import type { AgentHistory } from 'browser-use/dist/types';

let Agent: any;
let ChatOpenAI: any;

try {
  // prefer ESM-style import when available
  Agent = require('browser-use').Agent;
} catch (e) {
  try {
    // older exports might be default
    Agent = require('browser-use').default;
  } catch (e2) {
    Agent = undefined;
  }
}

try {
  ChatOpenAI = require('browser-use/llm/openai').ChatOpenAI;
} catch (e) {
  ChatOpenAI = undefined;
}

export type RunResult = {
  success: boolean;
  result?: any;
  error?: string;
};

export async function runBrowserUseTask(task: string, opts?: { model?: string; timeoutMs?: number }): Promise<RunResult> {
  if (!task || typeof task !== 'string') {
    return { success: false, error: 'task must be a non-empty string' };
  }

  if (!Agent) {
    return { success: false, error: 'browser-use module not found. Please npm install browser-use' };
  }

  // Build LLM instance if available
  let llm: any = undefined;
  if (process.env.OPENAI_API_KEY && ChatOpenAI) {
    try {
      llm = new ChatOpenAI({ apiKey: process.env.OPENAI_API_KEY, model: opts?.model ?? 'gpt-4o' });
    } catch (e) {
      console.warn('Failed to construct ChatOpenAI:', e);
      llm = undefined;
    }
  } else if (process.env.OPENAI_API_KEY && !ChatOpenAI) {
    console.warn('OPENAI_API_KEY is set but browser-use OpenAI adapter not found. Agent will run without LLM adapter if possible.');
  }

  try {
    const agentOptions: any = { task, ...(llm ? { llm } : {}) };
    const agent = new Agent(agentOptions);
    const history: AgentHistory | any = await agent.run({ timeout: opts?.timeoutMs ?? 120000 });

    let final: any = null;
    try {
      if (history && typeof history.final_result === 'function') {
        final = await history.final_result();
      } else if (history?.final_result) {
        final = history.final_result;
      } else if (history?.result) {
        final = history.result;
      } else {
        final = history;
      }
    } catch (inner) {
      final = history;
    }

    return { success: true, result: final };
  } catch (err: any) {
    return { success: false, error: err?.message ?? String(err) };
  }
}

// apps/ionic/src/pages/AgentPage.tsx
import React, { useState } from 'react';

export default function AgentPage() {
  const [task, setTask] = useState('');
  const [log, setLog] = useState('');

  const append = (s: string) => setLog(l => `${new Date().toLocaleTimeString()} - ${s}\n${l}`);

  async function runTask() {
    if (!task.trim()) { append('Please provide a task'); return; }
    append('Requesting agent...');
    try {
      const resp = await fetch('http://localhost:8788/agent/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ task }) });
      if (!resp.ok) { append(`HTTP error ${resp.status}: ${resp.statusText}`); return; }
      const j = await resp.json();
      append(JSON.stringify(j).slice(0, 2000));
    } catch (e) { append('Error: ' + String(e)); }
  }

  return (
    <div style={{ padding: 12 }}>
      <h3>Agent</h3>
      <textarea style={{ width: '100%', height: 80 }} value={task} onChange={e => setTask(e.target.value)} />
      <div style={{ marginTop: 8 }}>
        <button onClick={runTask}>Run Task (via HTTP trigger)</button>
      </div>
      <pre style={{ marginTop: 12, maxHeight: 360, overflow: 'auto', background: '#111', color: '#cfc' }}>{log}</pre>

      {/*
        NOTE: To spawn the CLI directly from the Electron/main or Node side of AionUi:
        const { spawn } = require('child_process');
        const p = spawn('node', ['server/browser-use-cli.js', '--task', task]);
        p.stdout.on('data', d => console.log('out', d.toString()));
        p.stderr.on('data', d => console.error('err', d.toString()));
      */}
    </div>
  );
}

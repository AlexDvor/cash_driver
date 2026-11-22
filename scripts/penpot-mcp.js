#!/usr/bin/env node
// Starts the Penpot remote MCP server for Claude Code as a local stdio bridge.
// Reads PENPOT_MCP_KEY from the project's .env (git-ignored) so the key never lives in .mcp.json.
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

function readEnvFile(file) {
  const values = {};
  if (!fs.existsSync(file)) return values;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    values[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2').trim();
  }
  return values;
}

const env = {
  ...readEnvFile(path.join(__dirname, '..', '.env')),
  ...process.env,
};
const key = (env.PENPOT_MCP_KEY || '').trim();
if (!key) {
  process.stderr.write(
    'PENPOT_MCP_KEY is empty. Put your Penpot MCP key into .env (see .env.example).\n',
  );
  process.exit(1);
}

const base = (env.PENPOT_BASE_URL || 'https://design.penpot.app').replace(
  /\/+$/,
  '',
);
const url = `${base}/mcp/stream?userToken=${encodeURIComponent(key)}`;

const child = spawn('npx', ['-y', 'mcp-remote@latest', url], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
child.on('exit', code => process.exit(code ?? 0));
child.on('error', error => {
  process.stderr.write(`Failed to start mcp-remote: ${error.message}\n`);
  process.exit(1);
});

import { describe, it, expect } from 'vitest';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_PATH = path.resolve(__dirname, '../dist/mcp-server.js');

describe('MCP Server Integration', () => {
  it('should start and respond to list_tools request without polluting stdout', async () => {
    const server = spawn('node', [SERVER_PATH]);
    
    let stdoutData = '';
    let stderrData = '';

    server.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });

    server.stderr.on('data', (data) => {
      stderrData += data.toString();
    });

    // 1. Send tools/list request
    const request = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
      params: {}
    }) + '\n';

    server.stdin.write(request);

    // 2. Wait for response (with timeout)
    const response = await new Promise<string>((resolve, reject) => {
      const timeout = setTimeout(() => {
        server.kill();
        reject(new Error(`Timeout waiting for MCP response. Stderr: ${stderrData}`));
      }, 5000);

      server.stdout.on('data', () => {
        // Simple check: if we have a full JSON object, resolve
        if (stdoutData.includes('"result"') && stdoutData.includes('"jsonrpc"')) {
          clearTimeout(timeout);
          resolve(stdoutData);
        }
      });
    });

    server.kill();

    // 3. Validate response
    const jsonResponse = JSON.parse(response);
    expect(jsonResponse.id).toBe(1);
    expect(jsonResponse.result.tools).toBeDefined();
    expect(Array.isArray(jsonResponse.result.tools)).toBe(true);

    // 4. Ensure NO pollution on stdout
    expect(stdoutData.trim().startsWith('{')).toBe(true);
    
    // In strict environments, ANY stderr output might be treated as a failure.
    // We expect stderr to be empty now that we've silenced the "running on stdio" message.
    expect(stderrData.trim()).toBe('');
  });
});

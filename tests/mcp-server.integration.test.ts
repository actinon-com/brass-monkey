import { describe, it, expect } from 'vitest';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_PATH = path.resolve(__dirname, '../dist/bundle/index.js');

// MCP Integration Test - Verifies the server lifecycle and protocol compliance.
// Increased timeout to 15s for CI stability.
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

    // 2. Wait for response (with longer timeout for CI)
    const response = await new Promise<string>((resolve, reject) => {
      const timeout = setTimeout(() => {
        server.kill();
        reject(new Error(`Timeout waiting for MCP response after 10s.\nStdout: ${stdoutData}\nStderr: ${stderrData}`));
      }, 10000);

      server.stdout.on('data', () => {
        if (stdoutData.includes('"result"') && stdoutData.includes('"jsonrpc"')) {
          clearTimeout(timeout);
          resolve(stdoutData);
        }
      });

      server.on('error', (err) => {
        clearTimeout(timeout);
        reject(new Error(`Server process error: ${err.message}`));
      });

      server.on('exit', (code) => {
        if (code !== 0 && !stdoutData.includes('"result"')) {
          clearTimeout(timeout);
          reject(new Error(`Server exited with code ${code}.\nStdout: ${stdoutData}\nStderr: ${stderrData}`));
        }
      });
    });

    server.kill();

    // 3. Validate response
    const jsonResponse = JSON.parse(response);
    expect(jsonResponse.id).toBe(1);
    expect(jsonResponse.result.tools).toBeDefined();

    // Enhanced Validation: Ensure schemas are valid and don't contain "any" type
    const tools = jsonResponse.result.tools;
    expect(tools.length).toBeGreaterThan(0);
    
    tools.forEach((tool: any) => {
      if (!tool.inputSchema || tool.inputSchema.type !== 'object') {
        console.log(`DEBUG: Tool "${tool.name}" has invalid schema:`, JSON.stringify(tool.inputSchema, null, 2));
      }
      expect(tool.inputSchema).toBeDefined();
      expect(tool.inputSchema.type).toBe('object');
      
      // Check for the "any" type bug that regression 1.2.7 introduced
      const schemaString = JSON.stringify(tool.inputSchema);
      expect(schemaString).not.toContain('"type":"any"');
    });

    // Specifically check setup_instance (which we reverted to Zod)
    const setupTool = tools.find((t: any) => t.name === 'setup_instance');
    expect(setupTool).toBeDefined();
    expect(setupTool.inputSchema.properties.alias.type).toBe('string');

    // 4. Ensure NO pollution on stdout
    expect(stdoutData.trim().startsWith('{')).toBe(true);
    
    // Check for any stderr that might have been ignored but present
    if (stderrData.trim().length > 0) {
        console.warn('MCP Server Stderr (non-fatal):', stderrData);
    }
  }, 15000); // 15s Vitest timeout

  it('should shut down cleanly when stdin is closed', async () => {
    const server = spawn('node', [SERVER_PATH]);

    const exitPromise = new Promise((resolve) => {
      server.on('exit', (code) => {
        resolve(code);
      });
    });

    // Close stdin to trigger shutdown
    server.stdin.end();

    const exitCode = await Promise.race([
      exitPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Server failed to exit after 5s on stdin close')), 5000))
    ]);

    expect(exitCode).toBe(0);
  });

  it('should shut down cleanly when SIGTERM is received', async () => {
    // Skip on Windows if signals aren't fully supported for child processes in this environment
    if (process.platform === 'win32') {
        // On Windows, SIGTERM is not supported as a signal but we can test it 
        // if the process is configured to handle it via Node's internal emulation.
    }

    const server = spawn('node', [SERVER_PATH]);

    const exitPromise = new Promise((resolve) => {
      server.on('exit', (code) => {
        resolve(code);
      });
    });

    // Send SIGTERM
    server.kill('SIGTERM');

    const exitCode = await Promise.race([
      exitPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Server failed to exit after 5s on SIGTERM')), 5000))
    ]);

    // On Windows, child_process.kill('SIGTERM') is often a hard kill despite handlers,
    // resulting in exitCode null. On POSIX it should be 0.
    if (process.platform === 'win32') {
        expect(exitCode === 0 || exitCode === null).toBe(true);
    } else {
        expect(exitCode).toBe(0);
    }
  });
});

import { describe, it, expect } from 'vitest';
import { spawn, ChildProcessByStdio } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { Writable, Readable } from 'stream';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_PATH = path.resolve(__dirname, '../dist/bundle/index.js');

async function sendRequest(server: ChildProcessByStdio<Writable, Readable, any>, method: string, params: any) {
  const request = JSON.stringify({
    jsonrpc: '2.0',
    id: Math.floor(Math.random() * 1000),
    method,
    params
  }) + '\n';

  return new Promise<any>((resolve, reject) => {
    const onData = (data: Buffer) => {
      const responses = data.toString().split('\n').filter(l => l.trim().length > 0);
      for (const res of responses) {
        try {
          const json = JSON.parse(res);
          if (json.id !== undefined) {
            server.stdout.removeListener('data', onData);
            resolve(json);
            return;
          }
        } catch (e) {
          // Fragmented data or non-JSON
        }
      }
    };

    server.stdout.on('data', onData);
    server.stdin.write(request);
    
    setTimeout(() => {
      server.stdout.removeListener('data', onData);
      reject(new Error(`Timeout waiting for response for ${method}`));
    }, 5000);
  });
}

describe('Skill Gate Integration', () => {
  it('should enforce skill gating in a sequence', async () => {
    const server = spawn('node', [SERVER_PATH], { stdio: ['pipe', 'pipe', 'pipe'] });
    
    try {
      // 1. Try to call search_read on sale.order -> Should be blocked
      const res1 = await sendRequest(server, 'tools/call', {
        name: 'search_read',
        arguments: { model: 'sale.order' }
      });
      
      expect(res1.result.isError).toBe(true);
      expect(res1.result.content[0].text).toContain('DOMAIN_LOCKED');
      expect(res1.result.content[0].text).toContain('odoo-sales');

      // 2. Activate the skill
      const res2 = await sendRequest(server, 'tools/call', {
        name: 'activate_skill',
        arguments: { skill_name: 'odoo-sales' }
      });
      
      expect(res2.result.isError).toBeUndefined();
      expect(res2.result.content[0].text).toContain('Skill \'odoo-sales\' activated');

      // 3. Try again -> Should NOT be blocked (might fail on auth, but that's past the gate)
      const res3 = await sendRequest(server, 'tools/call', {
        name: 'search_read',
        arguments: { model: 'sale.order' }
      });
      
      // We expect it to fail with some instance/config error because we haven't run setup_instance,
      // but it definitely shouldn't be DOMAIN_LOCKED.
      expect(res3.result.content[0].text).not.toContain('DOMAIN_LOCKED');
      expect(res3.result.content[0].text).toMatch(/No Odoo instances configured|Secure API key not found/);

    } finally {
      server.kill();
    }
  }, 20000);

  it('should allow discovery tools without activation', async () => {
    const server = spawn('node', [SERVER_PATH], { stdio: ['pipe', 'pipe', 'pipe'] });
    
    try {
      const res = await sendRequest(server, 'tools/call', {
        name: 'get_info',
        arguments: {}
      });
      
      expect(res.result.isError).toBeUndefined();
      const content = JSON.parse(res.result.content[0].text);
      expect(content.extension.name).toBe('brass-monkey');
      expect(content.context.active_skills).toEqual([]);
    } finally {
      server.kill();
    }
  });
});

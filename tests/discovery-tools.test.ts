import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listModels } from '../src/tools/list_models.js';
import { inspectModel } from '../src/tools/inspect_model.js';
import { getEnvironment } from '../src/tools/get_environment.js';
import { traceUiPath } from '../src/tools/trace_ui_path.js';
import { getAuditLog } from '../src/tools/get_audit_log.js';

describe('Discovery Tools', () => {
  let mockClient: any;
  let mockManager: any;
  let mockAudit: any;

  beforeEach(() => {
    mockClient = {
      executeKw: vi.fn(),
      authenticate: vi.fn().mockResolvedValue(1),
      activeUid: 1,
      db: 'test-db',
      url: 'https://test.odoo.com',
      writeGuard: true,
      majorVersion: 18,
    };
    mockAudit = {
      getLocalLogs: vi.fn().mockResolvedValue([
        { action: 'create', model: 'res.partner', res_id: 100, timestamp: '2024-01-01' }
      ]),
    };
    mockManager = {
      getClient: vi.fn().mockResolvedValue(mockClient),
      getAudit: vi.fn().mockResolvedValue(mockAudit),
    };
  });

  describe('getEnvironment', () => {
    it('should retrieve server, user and org info', async () => {
      mockClient.executeKw
        .mockResolvedValueOnce([{ name: 'Admin', login: 'admin', lang: 'en_US', company_id: [1, 'MyCompany'], company_ids: [1], groups_id: [10] }]) // user
        .mockResolvedValueOnce([{ id: 1, name: 'MyCompany', currency_id: [2, 'USD'], country_id: [3, 'US'] }]) // companies
        .mockResolvedValueOnce([{ name: 'English', code: 'en_US' }]); // languages

      const mockGuard = { getActivated: vi.fn().mockReturnValue([]) };
      const result = await getEnvironment(mockManager, mockGuard as any, { show_security: false, show_manifest: false });
      
      expect(result.summary).toContain('WORLD MAP');
      expect(result.environment.server.database).toBe('test-db');
      expect(result.environment.user.name).toBe('Admin');
      expect(result.environment.user.default_company).toBe('MyCompany');
      expect(result.environment.user.accessible_companies[0].name).toBe('MyCompany');
      expect(result.environment.organization.companies[0].name).toBe('MyCompany');
    });
  });

  describe('inspectModel', () => {
    it('should retrieve model identity and categorized fields', async () => {
      mockClient.executeKw
        .mockResolvedValueOnce([{ id: 1, name: 'Contact', modules: 'base', transient: false }]) // model
        .mockResolvedValueOnce([
          { name: 'name', field_description: 'Name', ttype: 'char', modules: 'base', store: true, required: true },
          { name: 'x_custom', field_description: 'Custom', ttype: 'char', modules: 'studio_custom', store: true },
        ]); // fields

      const result = await inspectModel(mockManager, { model: 'res.partner', show_base: true, show_extended: true });

      expect(result.identity.model).toBe('res.partner');
      expect(result.fields.base.name.string).toBe('Name');
      expect(result.fields.extended.x_custom.string).toBe('Custom');
    });
  });

  describe('traceUiPath', () => {
    it('should find actions and menus for a model', async () => {
      mockClient.executeKw
        .mockResolvedValueOnce([{ id: 50, name: 'Customers', view_mode: 'tree,form', xml_id: 'base.action_partner' }]) // action
        .mockResolvedValueOnce([{ complete_name: 'Contacts / Contacts' }]); // menu

      const result = await traceUiPath(mockManager, { model: 'res.partner' });

      expect(result.summary).toContain('Found 1 UI path');
      expect(result.paths[0].menu_path).toBe('Contacts / Contacts');
    });
  });

  describe('getAuditLog', () => {
    it('should retrieve recent local log entries', async () => {
      const result = await getAuditLog(mockManager, { limit: 5 });
      
      expect(result.summary).toContain('Retrieved 1');
      expect(result.logs[0].model).toBe('res.partner');
      expect(mockAudit.getLocalLogs).toHaveBeenCalledWith(5);
    });
  });
});

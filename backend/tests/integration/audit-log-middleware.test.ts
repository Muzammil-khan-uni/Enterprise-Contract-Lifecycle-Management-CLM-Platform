

import express from 'express';
import request from 'supertest';
import { auditLog } from '../../src/core/middleware/audit-log.middleware';
import { auditService } from '../../src/modules/audit/audit.service';
import { AuditAction } from '../../src/modules/audit/audit.types';

jest.mock('../../src/modules/audit/audit.service', () => ({
  auditService: { record: jest.fn().mockResolvedValue(undefined) },
}));

function flushPromises() {
  return new Promise((resolve) => setImmediate(resolve));
}

function buildApp(entityType: string, actionOverride?: AuditAction) {
  const app = express();
  app.use(express.json());
  
  
  app.use((req, _res, next) => {
    (req as express.Request & { user?: unknown }).user = { sub: 'user-1' };
    next();
  });
  app.post('/business-units/:id', auditLog(entityType, actionOverride), (req, res) => {
    res.status(200).json({ success: true });
  });
  app.post('/rejected/:id', auditLog(entityType, actionOverride), (_req, res) => {
    res.status(400).json({ success: false });
  });
  return app;
}

describe('auditLog middleware', () => {
  beforeEach(() => jest.clearAllMocks());

  it('records the entity type, actor, and request body after a successful mutation', async () => {
    const app = buildApp('BusinessUnit');
    await request(app).post('/business-units/bu1').send({ name: 'Engineering', code: 'ENG' });
    await flushPromises();

    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        actor: 'user-1',
        entityType: 'BusinessUnit',
        entityId: 'bu1',
        changes: { name: 'Engineering', code: 'ENG' },
      })
    );
  });

  it('infers the CREATE/UPDATE/DELETE action from HTTP method when no override is given', async () => {
    const app = buildApp('Vendor');
    await request(app).post('/business-units/v1').send({ name: 'Acme' });
    await flushPromises();

    expect(auditService.record).toHaveBeenCalledWith(expect.objectContaining({ action: AuditAction.CREATE }));
  });

  it('uses the explicit actionOverride instead of the method-based default when given', async () => {
    const app = buildApp('ApprovalWorkflow', AuditAction.STATUS_CHANGE);
    await request(app).post('/business-units/wf1').send({ reason: 'deadline risk' });
    await flushPromises();

    expect(auditService.record).toHaveBeenCalledWith(expect.objectContaining({ action: AuditAction.STATUS_CHANGE }));
  });

  it('does NOT record anything when the response failed (status >= 400)', async () => {
    const app = buildApp('BusinessUnit');
    await request(app).post('/rejected/bu1').send({ name: 'Bad' });
    await flushPromises();

    expect(auditService.record).not.toHaveBeenCalled();
  });

  it('records changes: null for a request with an empty body (e.g. a DELETE)', async () => {
    const app = buildApp('BusinessUnit');
    await request(app).post('/business-units/bu1').send({});
    await flushPromises();

    expect(auditService.record).toHaveBeenCalledWith(expect.objectContaining({ changes: null }));
  });
});

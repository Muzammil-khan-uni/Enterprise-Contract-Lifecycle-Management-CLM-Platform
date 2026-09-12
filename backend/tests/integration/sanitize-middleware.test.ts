import express from 'express';
import request from 'supertest';
import { sanitizeRequest } from '../../src/core/middleware/sanitize.middleware';

function buildTestApp() {
  const app = express();
  app.use(express.json());
  app.use(sanitizeRequest());

  const firstRead: unknown[] = [];
  app.use((req, _res, next) => {
    firstRead.push(req.query);
    next();
  });

  app.get('/echo', (req, res) => {
    
    
    res.json({ query: req.query, sameReferenceAsFirstRead: req.query === firstRead[0] });
  });

  app.post('/echo-body', (req, res) => {
    res.json({ body: req.body });
  });

  return app;
}

describe('sanitizeRequest() — req.query under Express 5', () => {
  it('strips Mongo operator keys from req.query and the result persists across multiple reads', async () => {
    const app = buildTestApp();

    const res = await request(app).get('/echo').query({ email: { $ne: null } as unknown as string, name: 'ok' });

    expect(res.status).toBe(200);
    expect(res.body.query.email).toBeUndefined(); 
    expect(res.body.query.name).toBe('ok');
    expect(res.body.sameReferenceAsFirstRead).toBe(true);
  });

  it('collapses a repeated query key (HTTP Parameter Pollution) to its last value', async () => {
    const app = buildTestApp();

    const res = await request(app).get('/echo?status=Draft&status=Approved');

    expect(res.body.query.status).toBe('Approved');
    expect(Array.isArray(res.body.query.status)).toBe(false);
  });

  it('leaves an ordinary, clean query string untouched', async () => {
    const app = buildTestApp();

    const res = await request(app).get('/echo').query({ search: 'vendor agreement', limit: '25' });

    expect(res.body.query).toEqual({ search: 'vendor agreement', limit: '25' });
  });

  it('strips a dotted key (another Mongo-operator injection vector) from req.query', async () => {
    const app = buildTestApp();

    const res = await request(app).get('/echo').query({ 'field.injected': 'x', safe: 'y' });

    expect(res.body.query['field.injected']).toBeUndefined();
    expect(res.body.query.safe).toBe('y');
  });

  

  it('preserves a JSON array in req.body instead of collapsing it to its last element', async () => {
    const app = buildTestApp();

    const res = await request(app)
      .post('/echo-body')
      .send({ signers: [{ signerType: 'External', name: 'Jane Doe', email: 'jane@example.com' }] });

    expect(Array.isArray(res.body.body.signers)).toBe(true);
    expect(res.body.body.signers).toHaveLength(1);
    expect(res.body.body.signers[0]).toEqual({ signerType: 'External', name: 'Jane Doe', email: 'jane@example.com' });
  });

  it('preserves a multi-element string array in req.body and still strips Mongo operator keys inside it', async () => {
    const app = buildTestApp();

    const res = await request(app)
      .post('/echo-body')
      .send({ applicableContractTypes: ['NDA', 'MSA'], nested: [{ safe: 'x', $where: 'evil' }] });

    expect(res.body.body.applicableContractTypes).toEqual(['NDA', 'MSA']);
    expect(res.body.body.nested).toEqual([{ safe: 'x' }]);
  });
});

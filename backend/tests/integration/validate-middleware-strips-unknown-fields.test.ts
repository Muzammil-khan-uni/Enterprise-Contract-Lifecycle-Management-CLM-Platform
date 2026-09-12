import express from 'express';
import { z } from 'zod';
import request from 'supertest';
import { validate } from '../../src/core/middleware/validate.middleware';

function buildTestApp() {
  const app = express();
  app.use(express.json());

  const bodySchema = z.object({
    body: z.object({ name: z.string(), code: z.string() }),
    query: z.object({}).optional(),
    params: z.object({}).optional(),
  });

  app.post('/resource', validate(bodySchema), (req, res) => {
    res.json({ body: req.body });
  });

  const querySchema = z.object({
    body: z.object({}).optional(),
    query: z.object({ from: z.string() }),
    params: z.object({}).optional(),
  });

  app.get('/search', validate(querySchema), (req, res) => {
    res.json({ query: req.query });
  });

  return app;
}

describe('validate() strips fields not declared in the schema', () => {
  it('strips an unvalidated field from req.body before it reaches the handler', async () => {
    const app = buildTestApp();

    const res = await request(app)
      .post('/resource')
      .send({ name: 'Engineering', code: 'ENG', tenant: 'some-other-tenants-id', isActive: true });

    expect(res.status).toBe(200);
    expect(res.body.body).toEqual({ name: 'Engineering', code: 'ENG' });
    expect(res.body.body.tenant).toBeUndefined();
    expect(res.body.body.isActive).toBeUndefined();
  });

  it('still accepts a request with only the declared fields', async () => {
    const app = buildTestApp();
    const res = await request(app).post('/resource').send({ name: 'Finance', code: 'FIN' });

    expect(res.status).toBe(200);
    expect(res.body.body).toEqual({ name: 'Finance', code: 'FIN' });
  });

  it('still rejects a request missing a required field', async () => {
    const app = buildTestApp();
    const res = await request(app).post('/resource').send({ name: 'Finance' });

    expect(res.status).toBe(400);
  });

  it('strips an unvalidated field from req.query too, and the result persists past validate()', async () => {
    const app = buildTestApp();
    const res = await request(app).get('/search').query({ from: '2026-01-01', injectedField: '$where:1' });

    expect(res.status).toBe(200);
    expect(res.body.query).toEqual({ from: '2026-01-01' });
    expect(res.body.query.injectedField).toBeUndefined();
  });
});

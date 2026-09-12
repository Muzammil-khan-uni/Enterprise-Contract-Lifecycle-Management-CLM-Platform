import request from 'supertest';
import { createApp } from '../../src/app';

describe('new auth routes are mounted and validate input', () => {
  it('POST /auth/forgot-password rejects a missing tenantSlug (validation runs, route exists)', async () => {
    const app = createApp();
    const res = await request(app).post('/api/v1/auth/forgot-password').send({ email: 'jane@example.com' });
    expect(res.status).toBe(400);
  });

  it('POST /auth/reset-password rejects a weak new password (same strength rule as registration)', async () => {
    const app = createApp();
    const res = await request(app).post('/api/v1/auth/reset-password').send({ token: 'x', newPassword: 'short' });
    expect(res.status).toBe(400);
  });

  it('POST /auth/verify-email rejects a missing token', async () => {
    const app = createApp();
    const res = await request(app).post('/api/v1/auth/verify-email').send({});
    expect(res.status).toBe(400);
  });

  it('POST /auth/resend-verification requires authentication', async () => {
    const app = createApp();
    const res = await request(app).post('/api/v1/auth/resend-verification').send({});
    expect(res.status).toBe(401);
  });

  it('POST /auth/register rejects a malformed organization slug (spaces, symbols)', async () => {
    const app = createApp();
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'SuperSecret123',
      tenantSlug: 'not a valid slug!!',
    });
    expect(res.status).toBe(400);
  });
});

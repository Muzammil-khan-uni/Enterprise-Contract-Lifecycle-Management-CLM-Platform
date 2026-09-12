import request from 'supertest';
import { createApp } from '../../src/app';

describe('security hardening middleware', () => {
  it('strips Mongo operator keys from the request body (NoSQL injection attempt)', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/api/v1/auth/login')
      
      
      
      
      .send({ email: { $ne: null }, password: { $ne: null }, tenantSlug: 'acme' });

    
    
    
    expect(res.status).toBe(400);
  });

  it('sets baseline security headers via helmet', async () => {
    const app = createApp();
    const res = await request(app).get('/api/v1/health');

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-dns-prefetch-control']).toBeDefined();
  });
});

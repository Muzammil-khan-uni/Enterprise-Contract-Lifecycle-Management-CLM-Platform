import request from 'supertest';
import { createApp } from '../../src/app';

describe('GET /api/v1/health', () => {
  it('reports 503/degraded when MongoDB and Redis are not connected', async () => {
    const app = createApp();
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(503);
    expect(res.body).toEqual({
      success: false,
      data: { status: 'degraded', dependencies: { mongo: 'down', redis: 'down' } },
    });
  });
});

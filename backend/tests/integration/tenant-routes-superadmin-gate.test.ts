

import jwt from 'jsonwebtoken';
import request from 'supertest';
import { createApp } from '../../src/app';
import { UserRole, Permission, JwtAccessPayload } from '../../src/modules/users/user.types';

function signToken(overrides: Partial<JwtAccessPayload>): string {
  const payload: JwtAccessPayload = {
    sub: 'user1',
    role: UserRole.ADMIN,
    businessUnit: null,
    tenant: 'tenant1',
    permissions: Object.values(Permission),
    isPlatformSuperAdmin: false,
    ...overrides,
  };
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET as string, { expiresIn: '15m' });
}

describe('GET/POST /tenants requires platform superadmin, not tenant-scoped USER_MANAGE', () => {
  it('rejects a tenant Admin holding every tenant-scoped permission but isPlatformSuperAdmin: false', async () => {
    const app = createApp();
    const token = signToken({ isPlatformSuperAdmin: false });

    const listRes = await request(app).get('/api/v1/tenants').set('Authorization', `Bearer ${token}`);
    expect(listRes.status).toBe(403);

    const createRes = await request(app)
      .post('/api/v1/tenants')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Acme', slug: 'acme' });
    expect(createRes.status).toBe(403);
  });

  it('rejects an unauthenticated request', async () => {
    const app = createApp();
    const res = await request(app).get('/api/v1/tenants');
    expect(res.status).toBe(401);
  });

  it('lets a request with isPlatformSuperAdmin: true past the gate (validation/DB layer takes over next)', async () => {
    const app = createApp();
    const token = signToken({ isPlatformSuperAdmin: true });

    
    
    
    const res = await request(app).post('/api/v1/tenants').set('Authorization', `Bearer ${token}`).send({});
    expect(res.status).toBe(400);
  });
});

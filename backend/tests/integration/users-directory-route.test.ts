

import jwt from 'jsonwebtoken';
import request from 'supertest';
import { createApp } from '../../src/app';
import { UserRole, Permission, JwtAccessPayload } from '../../src/modules/users/user.types';

function signToken(overrides: Partial<JwtAccessPayload>): string {
  const payload: JwtAccessPayload = {
    sub: 'user1',
    role: UserRole.DEPARTMENT_USER,
    businessUnit: 'bu1',
    tenant: 'tenant1',
    permissions: [],
    isPlatformSuperAdmin: false,
    ...overrides,
  };
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET as string, { expiresIn: '15m' });
}

describe('GET /users/directory', () => {
  it('requires authentication', async () => {
    const app = createApp();
    const res = await request(app).get('/api/v1/users/directory');
    expect(res.status).toBe(401);
  });

  it('rejects a caller with neither CONTRACT_UPDATE nor USER_MANAGE', async () => {
    const app = createApp();
    const token = signToken({ permissions: [Permission.CONTRACT_READ] });
    const res = await request(app).get('/api/v1/users/directory').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('is not swallowed by the /:id route — a token with CONTRACT_UPDATE reaches the directory handler, not getById', async () => {
    const app = createApp();
    
    
    
    
    const token = signToken({ permissions: [Permission.CONTRACT_UPDATE] });
    const res = await request(app).get('/api/v1/users/directory').set('Authorization', `Bearer ${token}`);
    
    
    
    
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });
});

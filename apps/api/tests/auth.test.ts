import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { adminCredentials, createAdmin } from './helpers.js';

const app = createApp();

describe('admin auth', () => {
  beforeEach(async () => {
    await createAdmin();
  });

  it('logs in, reads the session and logs out', async () => {
    const agent = request.agent(app);

    const login = await agent.post('/api/admin/auth/login').send(adminCredentials);

    expect(login.status).toBe(200);
    expect(login.body.admin).toMatchObject({
      email: adminCredentials.email,
      name: 'Test Admin',
      role: 'OWNER',
    });
    expect(login.headers['set-cookie']).toBeDefined();

    const me = await agent.get('/api/admin/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.admin.email).toBe(adminCredentials.email);

    const refresh = await agent.post('/api/admin/auth/refresh');
    expect(refresh.status).toBe(200);

    const logout = await agent.post('/api/admin/auth/logout');
    expect(logout.status).toBe(204);

    const meAfterLogout = await agent.get('/api/admin/auth/me');
    expect(meAfterLogout.status).toBe(401);
  });

  it('rejects an invalid password', async () => {
    const response = await request(app).post('/api/admin/auth/login').send({
      email: adminCredentials.email,
      password: 'WrongPassword123!',
    });

    expect(response.status).toBe(401);
    expect(response.body.code).toBe('UNAUTHORIZED');
  });

  it('requires authentication for the session endpoint', async () => {
    const response = await request(app).get('/api/admin/auth/me');

    expect(response.status).toBe(401);
  });
});

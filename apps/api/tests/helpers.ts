import type { Express } from 'express';
import request from 'supertest';
import { AdminModel } from '../src/models/admin.js';
import { hashPassword } from '../src/utils/password.js';

export const adminCredentials = {
  email: 'admin@test.local',
  password: 'StrongPass123!',
};

export async function createAdmin(): Promise<void> {
  await AdminModel.create({
    name: 'Test Admin',
    email: adminCredentials.email,
    passwordHash: await hashPassword(adminCredentials.password),
    role: 'OWNER',
    isActive: true,
  });
}

export async function createAdminAgent(app: Express) {
  await createAdmin();

  const agent = request.agent(app);
  await agent.post('/api/admin/auth/login').send(adminCredentials).expect(200);

  return agent;
}

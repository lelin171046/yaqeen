import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { AdminModel } from '../src/models/admin.js';
import { SettingsModel } from '../src/models/settings.js';
import { SupportMessageModel } from '../src/models/support-message.js';
import { hashPassword } from '../src/utils/password.js';
import { createAdminAgent } from './helpers.js';

const { sendEmailMock, getEmailStatusMock } = vi.hoisted(() => ({
  sendEmailMock: vi.fn(),
  getEmailStatusMock: vi.fn(),
}));

vi.mock('../src/services/email.js', () => ({
  sendEmail: sendEmailMock,
  getEmailStatus: getEmailStatusMock,
}));

const app = createApp();

const validMessage = {
  name: 'Jane Doe',
  email: 'Jane@Example.com',
  phone: '01712345678',
  topic: 'ORDER',
  orderNumber: 'AD-260101-0001',
  message: 'Please help me with my pending order.',
};

async function setSupportEmail(email: string) {
  await SettingsModel.findOneAndUpdate(
    { key: 'store' },
    { $set: { supportEmail: email } },
    { upsert: true },
  );
}

describe('support mail', () => {
  beforeEach(() => {
    getEmailStatusMock.mockReturnValue({ provider: 'resend', configured: true });
    sendEmailMock.mockReset();
    sendEmailMock.mockResolvedValue({ provider: 'resend', messageId: 'test-message-id' });
  });

  it('stores a message and emails both support and the customer when mail is configured', async () => {
    await setSupportEmail('support@test.local');

    const response = await request(app).post('/api/support').send(validMessage);

    expect(response.status).toBe(201);
    expect(response.body.message.ticket).toMatch(/^SUP-\d{5}$/);
    expect(response.body.message.email).toBe('jane@example.com');
    expect(response.body.message.status).toBe('NEW');
    expect(response.body.delivered).toBe(true);
    expect(response.body.message.deliveryStatus).toBe('SENT');
    expect(response.body.message.acknowledgementStatus).toBe('SENT');

    expect(sendEmailMock).toHaveBeenCalledTimes(2);
    expect(sendEmailMock.mock.calls[0]?.[0]).toMatchObject({
      to: ['support@test.local'],
      replyTo: 'jane@example.com',
    });
    expect(sendEmailMock.mock.calls[1]?.[0]).toMatchObject({ to: 'jane@example.com' });

    const saved = await SupportMessageModel.findOne({ ticket: response.body.message.ticket });
    expect(saved?.deliveryStatus).toBe('SENT');
  });

  it('validates the contact form before creating anything', async () => {
    const response = await request(app)
      .post('/api/support')
      .send({ ...validMessage, email: 'not-an-email', phone: '123', message: 'Short' });

    expect(response.status).toBe(422);
    expect(response.body.code).toBe('VALIDATION_ERROR');
    expect(await SupportMessageModel.countDocuments()).toBe(0);
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('still saves the message when email is disabled', async () => {
    getEmailStatusMock.mockReturnValue({ provider: 'disabled', configured: false });
    await setSupportEmail('support@test.local');

    const response = await request(app).post('/api/support').send(validMessage);

    expect(response.status).toBe(201);
    expect(response.body.delivered).toBe(false);
    expect(response.body.message.deliveryStatus).toBe('SKIPPED');
    expect(response.body.message.acknowledgementStatus).toBe('NOT_SENT');
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('protects the admin support inbox', async () => {
    const response = await request(app).get('/api/admin/support');

    expect(response.status).toBe(401);
  });

  it('lets an admin filter, update and reply to support messages', async () => {
    await setSupportEmail('support@test.local');
    const agent = await createAdminAgent(app);

    const first = await request(app).post('/api/support').send(validMessage);
    const second = await request(app)
      .post('/api/support')
      .send({ ...validMessage, name: 'Arif Rahman', topic: 'RETURN' });

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);

    const list = await agent.get('/api/admin/support?status=NEW');
    expect(list.status).toBe(200);
    expect(list.body.items).toHaveLength(2);
    expect(list.body.pagination).toMatchObject({ page: 1, limit: 20, total: 2, pages: 1 });

    const id = first.body.message.id as string;
    const updated = await agent
      .patch(`/api/admin/support/${id}/status`)
      .send({ status: 'RESOLVED' });
    expect(updated.status).toBe(200);
    expect(updated.body.message.status).toBe('RESOLVED');

    const filtered = await agent.get('/api/admin/support?status=RESOLVED');
    expect(filtered.body.items).toHaveLength(1);

    const replied = await agent
      .post(`/api/admin/support/${id}/reply`)
      .send({ message: 'We have checked your order and will update you shortly.' });
    expect(replied.status).toBe(200);
    expect(replied.body.message.replies).toHaveLength(1);
    expect(replied.body.message.status).toBe('RESOLVED');
    expect(sendEmailMock).toHaveBeenCalledTimes(5);
    expect(sendEmailMock.mock.calls.at(-1)?.[0]).toMatchObject({
      to: 'jane@example.com',
      subject: `Re: ${first.body.message.ticket} - Order help`,
    });
  });

  it('does not let non-owner admins send test emails', async () => {
    await AdminModel.create({
      name: 'Staff Admin',
      email: 'staff@test.local',
      passwordHash: await hashPassword('StrongPass123!'),
      role: 'ADMIN',
      isActive: true,
    });
    const agent = request.agent(app);
    const login = await agent
      .post('/api/admin/auth/login')
      .send({ email: 'staff@test.local', password: 'StrongPass123!' });
    expect(login.status).toBe(200);

    const response = await agent.post('/api/admin/settings/test-email').send({});
    expect(response.status).toBe(403);
    expect(sendEmailMock).not.toHaveBeenCalled();
  });
});

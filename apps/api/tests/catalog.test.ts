import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { createAdminAgent } from './helpers.js';

const app = createApp();

const productInput = (categoryId: string) => ({
  name: 'Premium Cashews',
  description: 'Hand-picked creamy cashews packed fresh in small batches.',
  shortDescription: 'Creamy cashews',
  categoryId,
  tags: ['cashew', 'nuts'],
  variants: [
    { label: '250g', grams: 250, price: 450, stock: 25 },
    { label: '500g', grams: 500, price: 850, stock: 10 },
  ],
});

describe('catalog', () => {
  it('creates categories and lists active ones publicly', async () => {
    const agent = await createAdminAgent(app);

    const created = await agent.post('/api/admin/categories').send({
      name: 'Nuts & Seeds',
      description: 'Cashews, almonds and more.',
    });

    expect(created.status).toBe(201);
    expect(created.body.category.slug).toBe('nuts-seeds');

    const list = await request(app).get('/api/categories');
    expect(list.status).toBe(200);
    expect(list.body.items).toHaveLength(1);
    expect(list.body.items[0].name).toBe('Nuts & Seeds');
  });

  it('creates, reads, updates and soft-deletes a product', async () => {
    const agent = await createAdminAgent(app);

    const category = await agent.post('/api/admin/categories').send({
      name: 'Nuts',
    });
    const categoryId = category.body.category._id as string;

    const created = await agent.post('/api/admin/products').send(productInput(categoryId));

    expect(created.status).toBe(201);
    expect(created.body.product).toMatchObject({
      slug: 'premium-cashews',
      basePrice: 450,
      totalStock: 35,
      isActive: true,
    });
    expect(created.body.product.variants).toHaveLength(2);
    expect(created.body.product.variants[0].sku).toBe('PREMIUM-CASHEWS-250G-1');

    const productId = created.body.product._id as string;

    const publicDetail = await request(app).get('/api/products/premium-cashews');
    expect(publicDetail.status).toBe(200);
    expect(publicDetail.body.product.category.slug).toBe('nuts');

    const search = await request(app).get('/api/products').query({ search: 'cashew' });
    expect(search.status).toBe(200);
    expect(search.body.pagination.total).toBe(1);

    const updated = await agent
      .patch(`/api/admin/products/${productId}`)
      .send({ isActive: false, badge: 'Sold out' });
    expect(updated.status).toBe(200);
    expect(updated.body.product.badge).toBe('Sold out');

    const hidden = await request(app).get('/api/products/premium-cashews');
    expect(hidden.status).toBe(404);

    const adminList = await agent.get('/api/admin/products');
    expect(adminList.status).toBe(200);
    expect(adminList.body.pagination.total).toBe(1);

    const removed = await agent.delete(`/api/admin/products/${productId}`);
    expect(removed.status).toBe(204);

    const afterDelete = await agent.get(`/api/admin/products/${productId}`);
    expect(afterDelete.status).toBe(200);
    expect(afterDelete.body.product.isActive).toBe(false);
  });

  it('rejects duplicate variant SKUs across products', async () => {
    const agent = await createAdminAgent(app);

    const category = await agent.post('/api/admin/categories').send({ name: 'Nuts' });
    const categoryId = category.body.category._id as string;
    const sharedSku = [
      { label: '250g', grams: 250, price: 450, stock: 5, sku: 'SHARED-SKU-250' },
    ];

    await agent
      .post('/api/admin/products')
      .send({ ...productInput(categoryId), name: 'Cashews One', variants: sharedSku })
      .expect(201);

    const duplicate = await agent
      .post('/api/admin/products')
      .send({ ...productInput(categoryId), name: 'Cashews Two', variants: sharedSku });

    expect(duplicate.status).toBe(409);
  });

  it('returns 503 when image uploads are not configured', async () => {
    const agent = await createAdminAgent(app);

    const response = await agent
      .post('/api/admin/uploads/image')
      .attach('file', Buffer.from('fake-image'), {
        filename: 'cashew.png',
        contentType: 'image/png',
      });

    expect(response.status).toBe(503);
    expect(response.body.code).toBe('UPLOAD_NOT_CONFIGURED');
  });

  it('requires admin authentication for catalog writes', async () => {
    const response = await request(app).post('/api/admin/categories').send({
      name: 'Unprotected',
    });

    expect(response.status).toBe(401);
  });
});

import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { createAdminAgent } from './helpers.js';

const app = createApp();

const productInput = (categoryId: string) => ({
  name: 'Portable Room Heater',
  description: 'Compact heater for bedrooms and small spaces.',
  shortDescription: 'Portable winter warmth',
  categoryId,
  tags: ['heater', 'winter'],
  variants: [
    { label: '1 L', grams: 1000, price: 450, stock: 25 },
    { label: '2 L', grams: 2000, price: 850, stock: 10 },
  ],
});

describe('catalog', () => {
  it('creates categories and lists active ones publicly', async () => {
    const agent = await createAdminAgent(app);

    const created = await agent.post('/api/admin/categories').send({
      name: 'Winter Essentials',
      description: 'Heaters, blankets and winter must-haves.',
    });

    expect(created.status).toBe(201);
    expect(created.body.category.slug).toBe('winter-essentials');

    const list = await request(app).get('/api/categories');
    expect(list.status).toBe(200);
    expect(list.body.items).toHaveLength(1);
    expect(list.body.items[0].name).toBe('Winter Essentials');
  });

  it('creates, reads, updates and soft-deletes a product', async () => {
    const agent = await createAdminAgent(app);

    const category = await agent.post('/api/admin/categories').send({
      name: 'Winter',
    });
    const categoryId = category.body.category._id as string;

    const created = await agent.post('/api/admin/products').send(productInput(categoryId));

    expect(created.status).toBe(201);
    expect(created.body.product).toMatchObject({
      slug: 'portable-room-heater',
      basePrice: 450,
      totalStock: 35,
      isActive: true,
    });
    expect(created.body.product.variants).toHaveLength(2);
    expect(created.body.product.variants[0].sku).toBe('PORTABLE-ROOM-HEATER-1000G-1');

    const productId = created.body.product._id as string;

    const publicDetail = await request(app).get('/api/products/portable-room-heater');
    expect(publicDetail.status).toBe(200);
    expect(publicDetail.body.product.category.slug).toBe('winter');

    const search = await request(app).get('/api/products').query({ search: 'heater' });
    expect(search.status).toBe(200);
    expect(search.body.pagination.total).toBe(1);

    const updated = await agent
      .patch(`/api/admin/products/${productId}`)
      .send({ isActive: false, badge: 'Sold out' });
    expect(updated.status).toBe(200);
    expect(updated.body.product.badge).toBe('Sold out');

    const hidden = await request(app).get('/api/products/portable-room-heater');
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

  it('exposes active flash sales with real dates and effective prices', async () => {
    const agent = await createAdminAgent(app);
    const category = await agent.post('/api/admin/categories').send({ name: 'Flash Deals' });
    const categoryId = category.body.category._id as string;
    const startsAt = new Date(Date.now() - 60_000).toISOString();
    const endsAt = new Date(Date.now() + 3_600_000).toISOString();

    const created = await agent.post('/api/admin/products').send({
      ...productInput(categoryId),
      name: 'Flash Deal Item',
      variants: [
        {
          label: 'Standard',
          price: 500,
          compareAtPrice: 600,
          flashPrice: 400,
          flashStartsAt: startsAt,
          flashEndsAt: endsAt,
          stock: 5,
        },
      ],
    });

    expect(created.status).toBe(201);

    const flashList = await request(app).get('/api/products').query({ flashSale: true });
    expect(flashList.status).toBe(200);
    expect(flashList.body.pagination.total).toBe(1);
    expect(flashList.body.items[0].variants[0]).toMatchObject({
      effectivePrice: 400,
      discountPercent: 33,
      isOnSale: true,
      saleEndsAt: endsAt,
    });
    expect(flashList.body.items[0].effectiveBasePrice).toBe(400);

    const allProducts = await request(app).get('/api/products');
    expect(allProducts.body.pagination.total).toBe(1);
  });

  it('rejects duplicate variant SKUs across products', async () => {
    const agent = await createAdminAgent(app);

    const category = await agent.post('/api/admin/categories').send({ name: 'Winter' });
    const categoryId = category.body.category._id as string;
    const sharedSku = [{ label: '1 L', grams: 1000, price: 450, stock: 5, sku: 'SHARED-SKU-STD' }];

    await agent
      .post('/api/admin/products')
      .send({ ...productInput(categoryId), name: 'Heater One', variants: sharedSku })
      .expect(201);

    const duplicate = await agent
      .post('/api/admin/products')
      .send({ ...productInput(categoryId), name: 'Heater Two', variants: sharedSku });

    expect(duplicate.status).toBe(409);
  });

  it('returns 503 when image uploads are not configured', async () => {
    const agent = await createAdminAgent(app);

    const response = await agent
      .post('/api/admin/uploads/image')
      .attach('file', Buffer.from('fake-image'), {
        filename: 'heater.png',
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

import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { createAdminAgent } from './helpers.js';

const app = createApp();

const customer = {
  name: 'Ayesha Rahman',
  phone: '01712345678',
  address: 'House 12, Road 5, Dhanmondi',
  district: 'Dhaka',
  area: 'Dhanmondi',
};

async function createProduct(agent: Awaited<ReturnType<typeof createAdminAgent>>) {
  const category = await agent.post('/api/admin/categories').send({ name: 'Nuts' });
  const product = await agent.post('/api/admin/products').send({
    name: 'Premium Cashews',
    description: 'Hand-picked creamy cashews packed fresh in small batches.',
    categoryId: category.body.category._id,
    variants: [
      { label: '250g', grams: 250, price: 450, stock: 25 },
      { label: '500g', grams: 500, price: 850, stock: 10 },
    ],
  });

  return product.body.product as {
    _id: string;
    variants: Array<{ sku: string; stock: number }>;
  };
}

function orderBody(
  productId: string,
  variantSku: string,
  quantity: number,
  extra: Record<string, unknown> = {},
) {
  return {
    items: [{ productId, variantSku, quantity }],
    customer,
    paymentMethod: 'COD',
    ...extra,
  };
}

describe('public orders', () => {
  it('creates a COD order, decrements stock and tracks it by phone', async () => {
    const agent = await createAdminAgent(app);
    const product = await createProduct(agent);
    const variantSku = product.variants[0].sku as string;

    const created = await request(app).post('/api/orders').send(
      orderBody(product._id, variantSku, 2, {
        idempotencyKey: 'checkout-test-0001',
      }),
    );

    expect(created.status).toBe(201);
    expect(created.body.order).toMatchObject({
      status: 'PENDING',
      paymentStatus: 'UNPAID',
      paymentMethod: 'COD',
      subtotal: 900,
      deliveryCharge: 80,
      total: 980,
    });
    expect(created.body.order.orderNumber).toMatch(/^YQ-\d{6}-\d{4}$/);
    expect(created.body.order.customer.phone).toBe('01712345678');

    const orderNumber = created.body.order.orderNumber as string;

    const detail = await request(app).get('/api/products/premium-cashews');
    expect(detail.body.product.variants[0].stock).toBe(23);
    expect(detail.body.product.totalStock).toBe(33);

    const repeated = await request(app)
      .post('/api/orders')
      .send(orderBody(product._id, variantSku, 2, { idempotencyKey: 'checkout-test-0001' }));

    expect(repeated.status).toBe(201);
    expect(repeated.body.order.orderNumber).toBe(orderNumber);

    const afterRepeat = await request(app).get('/api/products/premium-cashews');
    expect(afterRepeat.body.product.variants[0].stock).toBe(23);

    const tracked = await request(app)
      .get(`/api/orders/track/${orderNumber}`)
      .query({ phone: '+8801712345678' });

    expect(tracked.status).toBe(200);
    expect(tracked.body.order.orderNumber).toBe(orderNumber);
    expect(tracked.body.order.statusHistory[0].status).toBe('PENDING');

    const wrongPhone = await request(app)
      .get(`/api/orders/track/${orderNumber}`)
      .query({ phone: '01812345678' });

    expect(wrongPhone.status).toBe(404);
  });

  it('applies free delivery above the threshold', async () => {
    const agent = await createAdminAgent(app);
    const product = await createProduct(agent);

    const created = await request(app)
      .post('/api/orders')
      .send(orderBody(product._id, product.variants[0].sku, 5));

    expect(created.status).toBe(201);
    expect(created.body.order.subtotal).toBe(2250);
    expect(created.body.order.deliveryCharge).toBe(0);
    expect(created.body.order.total).toBe(2250);
  });

  it('rejects manual bKash without a transaction id', async () => {
    const agent = await createAdminAgent(app);
    const product = await createProduct(agent);

    const response = await request(app)
      .post('/api/orders')
      .send(orderBody(product._id, product.variants[0].sku, 1, { paymentMethod: 'BKASH_MANUAL' }));

    expect(response.status).toBe(422);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('accepts manual bKash with a transaction id', async () => {
    const agent = await createAdminAgent(app);
    const product = await createProduct(agent);

    const response = await request(app).post('/api/orders').send(
      orderBody(product._id, product.variants[0].sku, 1, {
        paymentMethod: 'BKASH_MANUAL',
        bkashTrxId: 'TRX123456',
      }),
    );

    expect(response.status).toBe(201);
    expect(response.body.order).toMatchObject({
      paymentMethod: 'BKASH_MANUAL',
      paymentStatus: 'UNPAID',
      bkashTrxId: 'TRX123456',
    });
  });

  it('rejects orders above available stock without creating an order', async () => {
    const agent = await createAdminAgent(app);
    const product = await createProduct(agent);

    const response = await request(app)
      .post('/api/orders')
      .send(orderBody(product._id, product.variants[0].sku, 30));

    expect(response.status).toBe(409);
    expect(response.body.code).toBe('CONFLICT');

    const detail = await request(app).get('/api/products/premium-cashews');
    expect(detail.body.product.variants[0].stock).toBe(25);
  });

  it('exposes safe public store settings', async () => {
    const response = await request(app).get('/api/settings');

    expect(response.status).toBe(200);
    expect(response.body.settings).toMatchObject({
      storeName: 'Yaqeen',
      freeDeliveryThreshold: 2000,
      defaultDeliveryCharge: 80,
    });
    expect(response.body.settings).not.toHaveProperty('adminAlertEmails');
    expect(response.body.settings).not.toHaveProperty('adminAlertWhatsapp');
  });
});

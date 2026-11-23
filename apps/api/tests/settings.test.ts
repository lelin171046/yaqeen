import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { createAdminAgent } from './helpers.js';

const app = createApp();

describe('store settings', () => {
  it('exposes support defaults and send-money merchant fields', async () => {
    const response = await request(app).get('/api/settings');

    expect(response.status).toBe(200);
    expect(response.body.settings).toMatchObject({
      supportEmail: 'rabuofficial007@gmail.com',
      supportPhone: '+880 1770-937260',
    });
    expect(response.body.settings).toHaveProperty('bkashMerchantNumber');
    expect(response.body.settings).toHaveProperty('nagadMerchantNumber');
    expect(response.body.settings).toHaveProperty('rocketMerchantNumber');
  });

  it('persists homepage offer slides and only exposes active slides publicly', async () => {
    const agent = await createAdminAgent(app);

    const saved = await agent.patch('/api/admin/settings').send({
      heroCarousel: {
        autoplaySeconds: 9,
        pauseOnHover: false,
        slides: [
          {
            id: 'visible-offer',
            eyebrow: 'Seasonal picks',
            title: 'Winter essentials',
            description: 'Stay warm with everyday winter products.',
            ctaLabel: 'Shop winter',
            ctaHref: '/shop?category=winter-essentials',
            badge: 'New',
            image: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
            imageAlt: 'Winter essentials',
            theme: 'berry',
            isActive: true,
          },
          {
            id: 'hidden-offer',
            title: 'Hidden offer',
            ctaLabel: 'Shop now',
            ctaHref: '/shop',
            theme: 'navy',
            isActive: false,
          },
        ],
      },
    });

    expect(saved.status).toBe(200);
    expect(saved.body.settings.heroCarousel).toMatchObject({
      autoplaySeconds: 9,
      pauseOnHover: false,
    });
    expect(saved.body.settings.heroCarousel.slides).toHaveLength(2);

    const published = await request(app).get('/api/settings');

    expect(published.status).toBe(200);
    expect(published.body.settings.heroCarousel).toMatchObject({
      autoplaySeconds: 9,
      pauseOnHover: false,
    });
    expect(published.body.settings.heroCarousel.slides).toHaveLength(1);
    expect(published.body.settings.heroCarousel.slides[0]).toMatchObject({
      id: 'visible-offer',
      title: 'Winter essentials',
      theme: 'berry',
    });
  });

  it('publishes scheduled slides, featured categories and delivery benefits', async () => {
    const agent = await createAdminAgent(app);
    const category = await agent.post('/api/admin/categories').send({ name: 'Home & Living' });
    const saved = await agent.patch('/api/admin/settings').send({
      heroCarousel: {
        autoplaySeconds: 6,
        pauseOnHover: true,
        slides: [
          {
            id: 'future-offer',
            eyebrow: 'Coming soon',
            title: 'Future offer',
            ctaLabel: 'Shop now',
            ctaHref: '/shop',
            theme: 'navy',
            isActive: true,
            startsAt: new Date(Date.now() + 86_400_000).toISOString(),
          },
          {
            id: 'live-offer',
            eyebrow: 'On now',
            title: 'Live offer',
            ctaLabel: 'Shop now',
            ctaHref: '/shop',
            theme: 'forest',
            isActive: true,
            startsAt: new Date(Date.now() - 3_600_000).toISOString(),
            endsAt: new Date(Date.now() + 3_600_000).toISOString(),
          },
        ],
      },
      featuredCategoryIds: [category.body.category._id],
      deliveryBenefits: [
        {
          id: 'cash-on-delivery',
          title: 'Cash on delivery',
          description: 'Pay when your order arrives',
          icon: 'wallet',
          isActive: true,
        },
        {
          id: 'hidden-benefit',
          title: 'Hidden benefit',
          description: 'Not shown publicly',
          icon: 'truck',
          isActive: false,
        },
      ],
    });

    expect(saved.status).toBe(200);

    const published = await request(app).get('/api/settings');
    expect(published.status).toBe(200);
    expect(
      published.body.settings.heroCarousel.slides.map((slide: { id: string }) => slide.id),
    ).toEqual(['live-offer']);
    expect(published.body.settings.featuredCategories).toMatchObject([
      { name: 'Home & Living', slug: 'home-living' },
    ]);
    expect(published.body.settings.deliveryBenefits).toHaveLength(1);
    expect(published.body.settings.deliveryBenefits[0]).toMatchObject({
      id: 'cash-on-delivery',
      icon: 'wallet',
      isActive: true,
    });
  });
});

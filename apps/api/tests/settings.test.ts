import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { createAdminAgent } from './helpers.js';

const app = createApp();

describe('store settings', () => {
  it('persists homepage offer slides and only exposes active slides publicly', async () => {
    const agent = await createAdminAgent(app);

    const saved = await agent.patch('/api/admin/settings').send({
      heroCarousel: {
        autoplaySeconds: 9,
        pauseOnHover: false,
        slides: [
          {
            id: 'visible-offer',
            eyebrow: 'Freshly packed',
            title: 'Premium nuts and seeds',
            description: 'Packed fresh for everyday snacking.',
            ctaLabel: 'Shop nuts',
            ctaHref: '/shop?category=nuts-seeds',
            badge: 'New',
            image: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
            imageAlt: 'Premium nuts',
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
      title: 'Premium nuts and seeds',
      theme: 'berry',
    });
  });
});

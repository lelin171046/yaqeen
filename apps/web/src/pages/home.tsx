import { DEFAULT_HERO_CAROUSEL, HERO_SLIDE_THEME_GRADIENTS } from '@anando-deal/shared';
import { motion, type Variants } from 'framer-motion';
import {
  ArrowRight,
  Mail,
  Package,
  Phone,
  ShieldCheck,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { CategorySection } from '@/components/home/category-section';
import { DeliveryBenefits } from '@/components/home/delivery-benefits';
import { FlashSaleSection } from '@/components/home/flash-sale-section';
import { SiteLayout } from '@/components/layout/site-layout';
import { OfferCarousel, type OfferSlide } from '@/components/offer-carousel';
import { ProductCard } from '@/components/product-card';
import { SectionHeading } from '@/components/section-heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useProducts } from '@/hooks/use-catalog';
import { useSettings } from '@/hooks/use-settings';
import { getApiErrorMessage } from '@/lib/api-error';
import { categoryIcon } from '@/lib/category-icon';
import { cn } from '@/lib/utils';
import { getWhatsAppHref } from '@/lib/whatsapp';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

const stagger: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const promises = [
  {
    title: 'Everyday variety',
    description: 'Useful products for your home, family, and daily routine.',
    icon: Package,
  },
  {
    title: 'Clear value',
    description: 'Honest prices, real product details, and visible stock.',
    icon: Wallet,
  },
  {
    title: 'Checked before dispatch',
    description: 'Every order is reviewed before it leaves the store.',
    icon: ShieldCheck,
  },
  {
    title: 'Real support',
    description: 'Talk to a real person on WhatsApp when you need help.',
    icon: Phone,
  },
];

const steps = [
  {
    title: 'Choose your products',
    description: 'Browse real stock, prices, options, and delivery charges.',
  },
  {
    title: 'Share delivery details',
    description: 'Name, phone and address. No account needed.',
  },
  {
    title: 'Receive and pay',
    description: 'Pay cash on delivery or send bKash before dispatch.',
  },
];

function ProductGridSkeleton() {
  return (
    <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-2xl border bg-card">
          <Skeleton className="aspect-square rounded-none" />
          <div className="space-y-3 p-4">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  const whatsappHref = getWhatsAppHref();
  const { data: settings } = useSettings();
  const {
    data: catalog,
    isLoading: isCatalogLoading,
    isError: isCatalogError,
    error: catalogError,
  } = useProducts({
    limit: 12,
    sort: 'newest',
  });

  const products = catalog?.items ?? [];
  const heroImages = products
    .map((product) => product.images[0]?.url)
    .filter((url): url is string => Boolean(url));

  const carousel = settings?.heroCarousel ?? DEFAULT_HERO_CAROUSEL;
  const heroSlides: OfferSlide[] = carousel.slides.map((slide, index) => ({
    id: slide.id,
    eyebrow: slide.eyebrow,
    title: slide.title,
    description: slide.description,
    cta: slide.ctaLabel,
    href: slide.ctaHref,
    image: slide.image || heroImages[index] || heroImages[0],
    imageAlt: slide.imageAlt,
    badge: slide.badge || undefined,
    gradient: HERO_SLIDE_THEME_GRADIENTS[slide.theme] ?? HERO_SLIDE_THEME_GRADIENTS.forest,
  }));

  const sideOffers = (settings?.featuredCategories ?? []).slice(0, 2).map((category, index) => {
    const Icon = categoryIcon(category.slug);

    return {
      id: category.id,
      eyebrow: 'Featured collection',
      title: category.name,
      href: `/shop?category=${category.slug}`,
      icon: Icon,
      gradient: index === 0 ? HERO_SLIDE_THEME_GRADIENTS.forest : HERO_SLIDE_THEME_GRADIENTS.amber,
    };
  });

  return (
    <SiteLayout>
      <main className="pb-16">
        <section className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8">
          <div
            className={cn(
              'grid gap-4',
              heroSlides.length > 0 && 'lg:grid-cols-[minmax(0,1fr)_300px]',
            )}
          >
            {heroSlides.length > 0 && (
              <OfferCarousel
                slides={heroSlides}
                interval={carousel.autoplaySeconds * 1000}
                pauseOnHover={carousel.pauseOnHover}
              />
            )}

            {sideOffers.length > 0 && (
              <div
                className={cn(
                  'grid gap-4 sm:grid-cols-2',
                  heroSlides.length > 0 ? 'lg:grid-cols-1 lg:grid-rows-2' : 'lg:grid-cols-2',
                )}
              >
                {sideOffers.map((offer) => (
                  <Link
                    key={offer.id}
                    to={offer.href}
                    className="group relative flex min-h-[180px] flex-col justify-between overflow-hidden rounded-[1.5rem] border border-white/10 p-5 text-white shadow-lg"
                    style={{ backgroundImage: offer.gradient }}
                  >
                    <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
                    <offer.icon className="pointer-events-none absolute -bottom-4 -right-4 h-28 w-28 text-white/10" />
                    <div className="relative">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
                        {offer.eyebrow}
                      </p>
                      <h2 className="mt-2 max-w-[12rem] font-display text-2xl font-semibold leading-tight">
                        {offer.title}
                      </h2>
                    </div>
                    <span className="relative inline-flex items-center gap-1 text-sm font-semibold">
                      Shop now
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        <div className="mt-8">
          <DeliveryBenefits benefits={settings?.deliveryBenefits ?? []} />
        </div>

        {settings?.flashDealsEnabled !== false && <FlashSaleSection />}

        <CategorySection featuredCategories={settings?.featuredCategories ?? []} />

        <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Customer favourites"
            title="Popular right now"
            description="Recently added products from the live catalog."
            href="/shop"
            linkLabel="See everything"
          />

          {isCatalogLoading ? (
            <ProductGridSkeleton />
          ) : isCatalogError ? (
            <div className="mt-7 rounded-2xl border border-dashed px-6 py-12 text-center">
              <p className="font-semibold">Products could not be loaded</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {getApiErrorMessage(catalogError)}
              </p>
              <Button asChild variant="outline" className="mt-5">
                <Link to="/shop">Open the shop</Link>
              </Button>
            </div>
          ) : products.length > 0 ? (
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.15 }}
              variants={stagger}
              className="mt-7 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4"
            >
              {products.slice(0, 4).map((product) => (
                <motion.div key={product._id} variants={fadeUp}>
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="mt-7 rounded-2xl border bg-card px-6 py-12 text-center">
              <h3 className="text-lg font-semibold">Products are being stocked</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Check back soon or browse the complete shop.
              </p>
              <Button asChild className="mt-5">
                <Link to="/shop">Browse the shop</Link>
              </Button>
            </div>
          )}
        </section>

        {products.length > 4 && (
          <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Just landed"
              title="New arrivals"
              description="The latest products added to the store."
              href="/shop?sort=newest"
              linkLabel="Shop new arrivals"
            />
            <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
              {products.slice(4, 8).map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </section>
        )}

        <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2rem] bg-secondary/70 px-6 py-10 sm:px-10 sm:py-12">
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent/30 blur-3xl" />
            <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <Badge variant="soft" className="gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Shop with confidence
                </Badge>
                <h2 className="mt-4 max-w-2xl text-3xl font-semibold sm:text-4xl">
                  Everything you need, delivered to your door
                </h2>
                <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
                  Browse live stock, clear prices, and delivery options in one place. Add your
                  favourites to the cart and check out without an account.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link to="/shop">
                    Shop all products
                    <ArrowRight />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <a href={whatsappHref} target="_blank" rel="noreferrer">
                    <Phone />
                    Ask on WhatsApp
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section id="why" className="border-y border-border/70 bg-card py-14 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div>
                <p className="text-sm font-semibold text-primary">The Anando Deal promise</p>
                <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">
                  One store for everyday needs
                </h2>
                <p className="mt-4 text-muted-foreground">
                  We bring together useful products with clear details, dependable delivery, and
                  support when you need it.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {promises.map((promise) => (
                  <div key={promise.title} className="rounded-2xl border bg-background p-5">
                    <promise.icon className="h-6 w-6 text-primary" />
                    <h3 className="mt-4 font-semibold">{promise.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{promise.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="how" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold text-primary">Simple ordering</p>
            <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">From browse to doorstep</h2>
            <p className="mt-3 text-muted-foreground">
              No signup, no complicated checkout. Three steps and your order is on its way.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title} className="rounded-2xl border bg-card p-6">
                <span className="font-display text-4xl font-semibold text-accent">
                  0{index + 1}
                </span>
                <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="contact" className="px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-primary px-6 py-12 text-primary-foreground sm:px-10 sm:py-16">
            <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div>
                <Badge className="border-0 bg-white/15 text-white">Need help choosing?</Badge>
                <h2 className="mt-4 max-w-xl text-3xl font-semibold sm:text-4xl">
                  Tell us what you need. We will help you find the right products.
                </h2>
                <p className="mt-3 max-w-xl text-sm text-white/70 sm:text-base">
                  Send us a message or chat on WhatsApp and we will guide you.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
                <Button asChild size="lg" variant="accent">
                  <Link to="/contact">
                    <Mail />
                    Email support
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a href={whatsappHref} target="_blank" rel="noreferrer">
                    <Phone />
                    Chat on WhatsApp
                  </a>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
                >
                  <Link to="/shop">
                    See categories
                    <ArrowRight />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </SiteLayout>
  );
}

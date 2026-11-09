import {
  DEFAULT_HERO_CAROUSEL,
  HERO_SLIDE_THEME_GRADIENTS,
} from '@yaqeen/shared';
import { motion, type Variants } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  Dumbbell,
  Gift,
  Leaf,
  Package,
  PackageCheck,
  Phone,
  Salad,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Sprout,
  Truck,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { SiteLayout } from '@/components/layout/site-layout';
import { OfferCarousel, type OfferSlide } from '@/components/offer-carousel';
import { ProductCard } from '@/components/product-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCategories, useProducts } from '@/hooks/use-catalog';
import { useSettings } from '@/hooks/use-settings';
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

const fallbackCategories: Array<{
  name: string;
  slug: string;
  image: string;
  icon: LucideIcon;
}> = [
  { name: 'Nuts & Seeds', slug: 'nuts-seeds', image: '', icon: Sprout },
  { name: 'Dry Fruits', slug: 'dry-fruits', image: '', icon: Gift },
  { name: 'Diet Foods', slug: 'diet-foods', image: '', icon: Salad },
  {
    name: 'Nutritional Foods',
    slug: 'nutritional-foods',
    image: '',
    icon: Dumbbell,
  },
  { name: 'Gift Boxes', slug: 'gift-boxes', image: '', icon: PackageCheck },
  { name: 'Combo Packs', slug: 'combo-packs', image: '', icon: ShoppingBag },
];

const categoryTones = [
  'bg-emerald-50 text-emerald-700',
  'bg-amber-50 text-amber-700',
  'bg-lime-50 text-lime-700',
  'bg-orange-50 text-orange-700',
  'bg-rose-50 text-rose-700',
  'bg-sky-50 text-sky-700',
];

const trustPoints: Array<{ title: string; description: string; icon: LucideIcon }> = [
  {
    title: '100% natural',
    description: 'Carefully selected, no shortcuts',
    icon: Leaf,
  },
  {
    title: 'Cash on delivery',
    description: 'Pay when your order arrives',
    icon: Wallet,
  },
  {
    title: 'Nationwide delivery',
    description: 'Freshly packed, safely sent',
    icon: Truck,
  },
  {
    title: 'Quality checked',
    description: 'Every batch, every time',
    icon: ShieldCheck,
  },
];

const promises: Array<{ title: string; description: string; icon: LucideIcon }> = [
  {
    title: 'Natural ingredients',
    description: 'No unnecessary fillers or artificial shortcuts.',
    icon: Leaf,
  },
  {
    title: 'Honest value',
    description: 'Fair prices and clear pack sizes, every time.',
    icon: Wallet,
  },
  {
    title: 'Freshness first',
    description: 'Packed close to dispatch so it arrives fresh.',
    icon: BadgeCheck,
  },
  {
    title: 'Real support',
    description: 'Talk to a real person on WhatsApp when you need help.',
    icon: Phone,
  },
];

const steps = [
  {
    title: 'Choose your favourites',
    description: 'Pick your products and the pack size that suits you.',
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

const sideOffers = [
  {
    eyebrow: 'Combo savings',
    title: 'Build a better pantry box',
    href: '/shop?category=combo-packs',
    icon: ShoppingBag,
    gradient: 'linear-gradient(140deg, #14532d 0%, #166534 55%, #0f766e 100%)',
  },
  {
    eyebrow: 'Gift ready',
    title: 'Premium gift boxes',
    href: '/shop?category=gift-boxes',
    icon: Gift,
    gradient: 'linear-gradient(140deg, #3b1d0f 0%, #7c3f1d 55%, #c07a32 100%)',
  },
];

function categoryIcon(slug: string): LucideIcon {
  const value = slug.toLowerCase();

  if (value.includes('nut') || value.includes('seed')) return Sprout;
  if (value.includes('dry') || value.includes('date')) return Gift;
  if (value.includes('diet')) return Salad;
  if (value.includes('nutrition')) return Dumbbell;
  if (value.includes('gift')) return PackageCheck;
  if (value.includes('combo')) return ShoppingBag;

  return Package;
}

function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  linkLabel,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
      <div>
        <p className="text-sm font-semibold text-primary">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">{title}</h2>
        {description && (
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {href && linkLabel && (
        <Link
          to={href}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          {linkLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

function ProductGridSkeleton() {
  return (
    <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="flex h-full flex-col overflow-hidden rounded-2xl border bg-card">
          <div className="aspect-square animate-pulse bg-muted" />
          <div className="flex flex-1 flex-col space-y-3 p-4">
            <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  const whatsappHref = getWhatsAppHref();

  const { data: categories } = useCategories();
  const { data: settings } = useSettings();
  const { data: catalog, isLoading: isCatalogLoading } = useProducts({
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
    gradient:
      HERO_SLIDE_THEME_GRADIENTS[slide.theme] ??
      HERO_SLIDE_THEME_GRADIENTS.forest,
  }));

  const displayCategories =
    categories && categories.length > 0
      ? categories.map((category) => ({
          name: category.name,
          slug: category.slug,
          image: category.image,
          icon: categoryIcon(category.slug),
        }))
      : fallbackCategories;

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

            <div
              className={cn(
                'grid gap-4 sm:grid-cols-2',
                heroSlides.length > 0
                  ? 'lg:grid-cols-1 lg:grid-rows-2'
                  : 'lg:grid-cols-2',
              )}
            >
              {sideOffers.map((offer) => (
                <Link
                  key={offer.title}
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
          </div>
        </section>

        <section className="mt-8 border-y border-border/70 bg-card">
          <div className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
            {trustPoints.map((point) => (
              <div key={point.title} className="flex items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-secondary">
                  <point.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{point.title}</p>
                  <p className="text-xs text-muted-foreground">{point.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="categories" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <SectionHeading
            eyebrow="Shop by category"
            title="Find your everyday goodness"
            description="Browse the pantry by category, from premium nuts to ready-to-gift boxes."
            href="/shop"
            linkLabel="View all products"
          />

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
            className="mt-8 flex gap-5 overflow-x-auto pb-3 sm:grid sm:grid-cols-3 sm:overflow-visible lg:grid-cols-6"
          >
            {displayCategories.map((category, index) => (
              <motion.div key={category.slug} variants={fadeUp}>
                <Link
                  to={`/shop?category=${category.slug}`}
                  className="group flex w-[116px] shrink-0 flex-col items-center text-center sm:w-auto"
                >
                  <div className="grid h-24 w-24 place-items-center overflow-hidden rounded-full border bg-card p-1.5 transition-all group-hover:-translate-y-1 group-hover:border-primary/30 group-hover:shadow-lg">
                    {category.image ? (
                      <img
                        src={category.image}
                        alt=""
                        loading="lazy"
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <span
                        className={cn(
                          'grid h-full w-full place-items-center rounded-full',
                          categoryTones[index % categoryTones.length],
                        )}
                      >
                        <category.icon className="h-8 w-8" />
                      </span>
                    )}
                  </div>
                  <span className="mt-3 line-clamp-2 text-xs font-semibold sm:text-sm">
                    {category.name}
                  </span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Customer favourites"
            title="Popular right now"
            description="Freshly packed bestsellers that keep coming back to the pantry."
            href="/shop"
            linkLabel="See everything"
          />

          {isCatalogLoading ? (
            <ProductGridSkeleton />
          ) : products.length > 0 ? (
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.15 }}
              variants={stagger}
              className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
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
              title="New additions to the pantry"
              description="The latest packs and flavours added to the Yaqeen range."
              href="/shop?sort=newest"
              linkLabel="Shop new arrivals"
            />
            <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
                  Bundle & save
                </Badge>
                <h2 className="mt-4 max-w-2xl text-3xl font-semibold sm:text-4xl">
                  Build your own healthy pantry box
                </h2>
                <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
                  Mix nuts, dates, diet foods and nutritional essentials into one order. We will
                  pack it fresh and deliver it to your door.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link to="/shop">
                    Shop combos
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
                <p className="text-sm font-semibold text-primary">The Yaqeen promise</p>
                <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">
                  Food you can feel good about
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Yaqeen means certainty. We built this store around one simple idea: you should
                  know exactly what you are eating, where it came from, and that it is worth the
                  price.
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
            <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">From ad to doorstep</h2>
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
                  Tell us your goal. We will help you build the right box.
                </h2>
                <p className="mt-3 max-w-xl text-sm text-white/70 sm:text-base">
                  Weight loss, gym fuel, healthy snacking or a gift box - message us on WhatsApp
                  and we will guide you.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
                <Button asChild size="lg" variant="accent">
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


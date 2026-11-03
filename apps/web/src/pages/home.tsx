import { motion, type Variants } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Dumbbell,
  Gift,
  Leaf,
  PackageCheck,
  Phone,
  Salad,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Sprout,
  Star,
  Truck,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { SiteLayout } from '@/components/layout/site-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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

const categories: Array<{
  name: string;
  slug: string;
  description: string;
  icon: LucideIcon;
  tone: string;
}> = [
  {
    name: 'Nuts & Seeds',
    slug: 'nuts-seeds',
    description: 'Kaju, badam, pista and more',
    icon: Sprout,
    tone: 'bg-emerald-50 text-emerald-700',
  },
  {
    name: 'Dry Fruits',
    slug: 'dry-fruits',
    description: 'Dates, raisins and figs',
    icon: Gift,
    tone: 'bg-amber-50 text-amber-700',
  },
  {
    name: 'Diet Foods',
    slug: 'diet-foods',
    description: 'Light, clean and filling',
    icon: Salad,
    tone: 'bg-lime-50 text-lime-700',
  },
  {
    name: 'Nutritional Foods',
    slug: 'nutritional-foods',
    description: 'Protein, fibre and energy',
    icon: Dumbbell,
    tone: 'bg-orange-50 text-orange-700',
  },
  {
    name: 'Gift Boxes',
    slug: 'gift-boxes',
    description: 'Thoughtful and premium',
    icon: PackageCheck,
    tone: 'bg-rose-50 text-rose-700',
  },
  {
    name: 'Combo Packs',
    slug: 'combo-packs',
    description: 'More value, more goodness',
    icon: ShoppingBag,
    tone: 'bg-sky-50 text-sky-700',
  },
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

export default function HomePage() {

  const whatsappNumber = import.meta.env.VITE_STORE_WHATSAPP;
  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/\D/g, '')}`
    : '#contact';

  return (
    <SiteLayout>
      <main>
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-accent/25 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 top-64 h-80 w-80 rounded-full bg-emerald-200/40 blur-3xl" />

          <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pb-24 lg:pt-20">
            <motion.div initial="hidden" animate="show" variants={stagger}>
              <motion.div variants={fadeUp}>
                <Badge variant="soft" className="gap-1.5 px-3 py-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Natural. Honest. Delivered.
                </Badge>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                className="mt-5 max-w-2xl text-4xl leading-[1.05] font-semibold sm:text-5xl lg:text-6xl"
              >
                Goodness you can trust, delivered to your door.
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
              >
                Premium nuts, dry fruits, diet foods and nutritional essentials, packed fresh
                in Bangladesh and delivered with care.
              </motion.p>

              <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-3">
                <Button asChild size="lg">
                  <Link to="/shop">
                    Explore our range
                    <ArrowRight />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <a href={whatsappHref} target="_blank" rel="noreferrer">
                    <Phone />
                    Order on WhatsApp
                  </a>
                </Button>
              </motion.div>

              <motion.div
                variants={fadeUp}
                className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground"
              >
                {['No account needed', 'Cash on delivery', 'Freshly packed'].map((item) => (
                  <span key={item} className="inline-flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    {item}
                  </span>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
              className="relative mx-auto w-full max-w-md"
            >
              <div className="absolute -right-4 -top-5 h-24 w-24 rounded-full bg-accent" />
              <div className="relative overflow-hidden rounded-[2rem] bg-primary p-5 shadow-2xl shadow-primary/20 sm:p-6">
                <div className="flex items-center justify-between">
                  <Badge className="border-0 bg-white/15 text-white">Best seller</Badge>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">
                    Yaqeen pick
                  </span>
                </div>

                <div className="relative mt-6 grid aspect-square place-items-center rounded-[1.5rem] bg-white/10">
                  <div className="relative h-56 w-56 sm:h-64 sm:w-64">
                    <div className="absolute inset-0 rounded-full bg-accent/90" />
                    <div className="absolute left-5 top-9 h-20 w-24 rotate-12 rounded-[50%] bg-[#d8b25a] shadow-inner" />
                    <div className="absolute right-4 top-16 h-16 w-20 -rotate-12 rounded-[50%] bg-[#c79a3f]" />
                    <div className="absolute bottom-8 left-16 h-16 w-20 rotate-6 rounded-[50%] bg-[#e2c27a]" />
                    <div className="absolute bottom-4 right-10 h-12 w-16 rotate-12 rounded-[50%] bg-[#b98b35]" />
                  </div>
                </div>

                <div className="mt-5 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs text-white/60">Premium kaju</p>
                    <p className="font-display text-xl text-white sm:text-2xl">Roasted cashews</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-white/50 line-through">৳ 950</p>
                    <p className="text-lg font-semibold text-white sm:text-xl">৳ 850</p>
                  </div>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="absolute -bottom-6 -left-3 rounded-2xl border bg-card p-4 shadow-xl sm:-left-8"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-secondary">
                    <Truck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Delivery</p>
                    <p className="text-sm font-semibold">Nationwide COD</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65, duration: 0.5 }}
                className="absolute -right-2 top-28 rounded-2xl border bg-card p-3 shadow-xl sm:-right-6"
              >
                <div className="flex items-center gap-1.5 text-sm font-semibold">
                  <Star className="h-4 w-4 fill-accent text-accent" />
                  4.9 / 5
                </div>
                <p className="text-xs text-muted-foreground">Loved by customers</p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section className="border-y border-border/70 bg-card">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
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

        <section id="categories" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            variants={stagger}
            className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"
          >
            <div>
              <motion.p variants={fadeUp} className="text-sm font-semibold text-primary">
                Shop by category
              </motion.p>
              <motion.h2 variants={fadeUp} className="mt-2 text-3xl font-semibold sm:text-4xl">
                Everyday goodness, thoughtfully picked
              </motion.h2>
            </div>
            <motion.p variants={fadeUp} className="max-w-md text-sm text-muted-foreground">
              From everyday snacking to fitness goals, find clean, honest food that fits your
              routine.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
            variants={stagger}
            className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {categories.map((category) => (
              <motion.div key={category.name} variants={fadeUp} whileHover={{ y: -4 }}>
                <Link
                  to={`/shop?category=${category.slug}`}
                  className="group block h-full rounded-2xl border bg-card p-6 transition-shadow hover:shadow-lg hover:shadow-primary/5"
                >
                  <div className={cn('grid h-12 w-12 place-items-center rounded-xl', category.tone)}>
                    <category.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold">{category.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                    Browse
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </section>

        <section id="why" className="border-y border-border/70 bg-secondary/40 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <motion.div
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.4 }}
                variants={stagger}
              >
                <motion.p variants={fadeUp} className="text-sm font-semibold text-primary">
                  The Yaqeen promise
                </motion.p>
                <motion.h2 variants={fadeUp} className="mt-2 text-3xl font-semibold sm:text-4xl">
                  Food you can feel good about
                </motion.h2>
                <motion.p variants={fadeUp} className="mt-4 text-muted-foreground">
                  Yaqeen means certainty. We built this store around one simple idea: you should
                  know exactly what you are eating, where it came from, and that it is worth the
                  price.
                </motion.p>

                <motion.div variants={fadeUp} className="mt-8 space-y-4">
                  {[
                    'Carefully sourced ingredients',
                    'Freshly packed in small batches',
                    'Clear pricing with no surprises',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <div className="mt-0.5 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-3 w-3" />
                      </div>
                      <span className="text-sm font-medium">{item}</span>
                    </div>
                  ))}
                </motion.div>
              </motion.div>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  {
                    title: 'Natural ingredients',
                    description: 'No unnecessary fillers or artificial shortcuts.',
                    icon: BadgeCheck,
                  },
                  {
                    title: 'Honest value',
                    description: 'Fair prices and clear pack sizes, every time.',
                    icon: Wallet,
                  },
                  {
                    title: 'Freshness first',
                    description: 'Packed close to dispatch so it arrives fresh.',
                    icon: Leaf,
                  },
                  {
                    title: 'Real support',
                    description: 'Talk to a real person on WhatsApp when you need help.',
                    icon: Phone,
                  },
                ].map((item, index) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ delay: index * 0.08, duration: 0.45 }}
                    className="rounded-2xl border bg-card p-6"
                  >
                    <item.icon className="h-6 w-6 text-primary" />
                    <h3 className="mt-4 font-semibold">{item.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="how" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold text-primary">Simple ordering</p>
            <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">From ad to doorstep</h2>
            <p className="mt-3 text-muted-foreground">
              No signup, no complicated checkout. Three steps and your order is on its way.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ delay: index * 0.1, duration: 0.45 }}
                className="relative rounded-2xl border bg-card p-6"
              >
                <span className="font-display text-4xl font-semibold text-accent">
                  0{index + 1}
                </span>
                <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section id="contact" className="px-4 pb-16 sm:px-6 sm:pb-24 lg:px-8">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-primary px-6 py-12 text-primary-foreground sm:px-10 sm:py-16">
            <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div>
                <Badge className="border-0 bg-white/15 text-white">Need help choosing?</Badge>
                <h2 className="mt-4 max-w-xl text-3xl font-semibold sm:text-4xl">
                  Tell us your goal. We will help you build the right box.
                </h2>
                <p className="mt-3 max-w-xl text-sm text-white/70 sm:text-base">
                  Weight loss, gym fuel, healthy snacking or a gift box — message us on WhatsApp
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

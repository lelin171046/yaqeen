import { BRAND_LOGO_URL } from '@anando-deal/shared';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface OfferSlide {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  cta: string;
  href: string;
  image?: string;
  imageAlt?: string;
  badge?: string;
  gradient: string;
}

export function OfferCarousel({
  slides,
  className,
  interval = 6000,
  pauseOnHover = true,
}: {
  slides: OfferSlide[];
  className?: string;
  interval?: number;
  pauseOnHover?: boolean;
}) {
  const [active, setActive] = useState(0);
  const [interactionPaused, setInteractionPaused] = useState(false);
  const paused = pauseOnHover && interactionPaused;
  const count = slides.length;

  useEffect(() => {
    if (paused || count < 2 || interval <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % count);
    }, interval);

    return () => window.clearInterval(timer);
  }, [count, interval, paused]);

  const current = count > 0 ? active % count : 0;
  const slide = slides[current] ?? slides[0];

  if (!slide) {
    return null;
  }

  const goTo = (next: number) => {
    setActive(((next % count) + count) % count);
  };

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-[2rem] border border-white/10 text-white shadow-2xl shadow-primary/15',
        className,
      )}
      aria-roledescription="carousel"
      aria-label="Offer banners"
      onMouseEnter={() => setInteractionPaused(true)}
      onMouseLeave={() => setInteractionPaused(false)}
      onFocusCapture={() => setInteractionPaused(true)}
      onBlurCapture={() => setInteractionPaused(false)}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={slide.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="relative min-h-[390px] p-6 pb-20 sm:min-h-[420px] sm:p-10 lg:min-h-[470px] lg:p-12"
          style={{ backgroundImage: slide.gradient }}
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-black/15 blur-3xl" />
            <div className="absolute right-1/3 top-10 h-24 w-24 rounded-full border border-white/15" />
            <div className="absolute bottom-12 right-16 h-16 w-16 rounded-full border border-white/10" />
          </div>

          <div className="relative grid h-full gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="max-w-xl">
              <Badge className="border-0 bg-white/15 px-3 py-1.5 text-white backdrop-blur">
                {slide.eyebrow}
              </Badge>
              <h1 className="mt-5 text-3xl leading-[1.05] font-semibold sm:text-4xl lg:text-5xl">
                {slide.title}
              </h1>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/75 sm:text-base">
                {slide.description}
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Button asChild size="lg" variant="accent">
                  {/^https?:\/\//i.test(slide.href) ? (
                    <a href={slide.href} target="_blank" rel="noreferrer">
                      {slide.cta}
                      <ArrowRight />
                    </a>
                  ) : (
                    <Link to={slide.href}>
                      {slide.cta}
                      <ArrowRight />
                    </Link>
                  )}
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/25 bg-white/5 text-white hover:bg-white/15 hover:text-white"
                >
                  <Link to="/shop">Browse all products</Link>
                </Button>
              </div>
            </div>

            <div className="relative mx-auto hidden w-full max-w-sm lg:block">
              <div className="absolute inset-8 rounded-full bg-white/10 blur-2xl" />
              <div className="relative rotate-2 overflow-hidden rounded-[2rem] border border-white/20 bg-white/10 p-3 shadow-2xl backdrop-blur-sm">
                {slide.image ? (
                  <img
                    src={slide.image}
                    alt={slide.imageAlt ?? ''}
                    className="aspect-square w-full rounded-[1.6rem] object-cover"
                  />
                ) : (
                  <div className="grid aspect-square place-items-center rounded-[1.6rem] bg-white/10">
                    <img
                      src={BRAND_LOGO_URL}
                      alt="Anando Deal"
                      className="h-36 w-36 rounded-full shadow-2xl"
                    />
                  </div>
                )}
              </div>

              {slide.badge && (
                <div className="absolute -left-4 top-8 -rotate-6 rounded-full bg-accent px-4 py-2 text-xs font-bold text-accent-foreground shadow-xl">
                  {slide.badge}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-5 left-6 z-10 flex items-center gap-2 sm:left-10">
        {slides.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => goTo(index)}
            className={cn(
              'h-2 rounded-full transition-all',
              index === current ? 'w-7 bg-white' : 'w-2 bg-white/40 hover:bg-white/70',
            )}
            aria-label={`Go to slide ${index + 1}`}
            aria-current={index === current}
          />
        ))}
      </div>

      {count > 1 && (
        <div className="absolute bottom-5 right-5 z-10 flex items-center gap-2 sm:right-8">
          <button
            type="button"
            onClick={() => goTo(current - 1)}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-white/10 text-white transition-colors hover:bg-white/20"
            aria-label="Previous offer"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => goTo(current + 1)}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-white/10 text-white transition-colors hover:bg-white/20"
            aria-label="Next offer"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </section>
  );
}

import { Link } from 'react-router-dom';
import { SectionHeading } from '@/components/section-heading';
import { Skeleton } from '@/components/ui/skeleton';
import { useCategories } from '@/hooks/use-catalog';
import { categoryIcon } from '@/lib/category-icon';
import type { CategoryDto } from '@/lib/types';
import { cn } from '@/lib/utils';

const categoryTones = [
  'bg-primary/10 text-primary',
  'bg-secondary text-foreground',
  'bg-muted text-foreground',
  'bg-black text-white',
  'bg-neutral-200 text-black',
  'bg-neutral-100 text-black',
];

export function CategorySection({
  featuredCategories,
}: {
  featuredCategories: Array<{ id: string; name: string; slug: string; image: string }>;
}) {
  const { data: categories, isLoading, isError } = useCategories();

  const displayCategories: CategoryDto[] = featuredCategories.length
    ? featuredCategories.map((category) => ({
        _id: category.id,
        name: category.name,
        slug: category.slug,
        image: category.image,
        description: '',
        sortOrder: 0,
        isActive: true,
      }))
    : (categories ?? []);

  return (
    <section id="categories" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <SectionHeading
        eyebrow="Shop by category"
        title="Find what you need"
        description="Browse the collections currently set up in the store."
        href="/shop"
        linkLabel="View all products"
      />

      {isLoading && !featuredCategories.length ? (
        <div className="mt-8 flex gap-5 overflow-hidden sm:grid sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex flex-col items-center gap-3">
              <Skeleton className="h-24 w-24 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      ) : isError && !featuredCategories.length ? (
        <div className="mt-8 rounded-2xl border border-dashed px-6 py-12 text-center">
          <p className="font-semibold">Categories could not be loaded</p>
          <p className="mt-1 text-sm text-muted-foreground">Please try again in a moment.</p>
        </div>
      ) : displayCategories.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed px-6 py-12 text-center">
          <p className="font-semibold">Categories are being added</p>
          <p className="mt-1 text-sm text-muted-foreground">Browse all products in the meantime.</p>
        </div>
      ) : (
        <div className="mt-8 flex gap-5 overflow-x-auto pb-3 sm:grid sm:grid-cols-3 sm:overflow-visible lg:grid-cols-6">
          {displayCategories.map((category, index) => (
            <Link
              key={category._id}
              to={category.slug ? `/shop?category=${category.slug}` : '/shop'}
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
                    {(() => {
                      const Icon = categoryIcon(category.slug);
                      return <Icon className="h-8 w-8" />;
                    })()}
                  </span>
                )}
              </div>
              <span className="mt-3 line-clamp-2 text-xs font-semibold sm:text-sm">
                {category.name}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

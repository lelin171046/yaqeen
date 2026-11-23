import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function SectionHeading({
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

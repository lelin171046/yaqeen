import { AppError } from './app-error.js';

export function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 160);
}

export async function ensureUniqueSlug(
  value: string,
  isTaken: (slug: string) => Promise<boolean>,
): Promise<string> {
  const base = slugify(value) || 'item';
  let slug = base;
  let suffix = 1;

  while (await isTaken(slug)) {
    slug = `${base}-${suffix}`;
    suffix += 1;

    if (suffix > 1000) {
      throw AppError.conflict('Could not generate a unique slug');
    }
  }

  return slug;
}

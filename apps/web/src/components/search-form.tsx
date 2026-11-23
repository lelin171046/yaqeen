import { Search } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function SearchForm({
  className,
  inputClassName,
  placeholder = 'Search products',
  onSubmitted,
}: {
  className?: string;
  inputClassName?: string;
  placeholder?: string;
  onSubmitted?: () => void;
}) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = search.trim();
    navigate(query ? `/shop?search=${encodeURIComponent(query)}` : '/shop');
    onSubmitted?.();
  };

  return (
    <form onSubmit={submit} className={className}>
      <div className="flex items-center gap-2 rounded-full border bg-card px-3 py-2">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={placeholder}
          className={cn(
            'w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground',
            inputClassName,
          )}
          aria-label="Search products"
        />
      </div>
    </form>
  );
}

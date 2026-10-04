import React, { useMemo, useState } from 'react';
import { PackageSearchIcon, SearchIcon } from 'lucide-react';
import type { Product, Variant } from '../../types/catalog';
import { cn } from '../../utils/cn';
import { formatMoney } from '../../utils/money';
import { EmptyState } from '../ui/EmptyState';

export interface PosItem {
  variant: Variant;
  product: Product;
  /** null for services and bundles, which aren't stocked directly. */
  available: number | null;
  inCart: number;
}

interface PosProductGridProps {
  items: PosItem[];
  onAdd: (item: PosItem) => void;
}

export function PosProductGrid({ items, onAdd }: PosProductGridProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const categories = useMemo(() => Array.from(new Set(items.map((i) => i.product.category))).sort(), [items]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => {
      if (category !== 'all' && i.product.category !== category) return false;
      if (!q) return true;
      return i.product.name.toLowerCase().includes(q) || i.variant.sku.toLowerCase().includes(q) || i.variant.barcode.includes(q) || i.variant.title.toLowerCase().includes(q);
    });
  }, [items, query, category]);

  return (
    <section aria-label="Products" className="min-w-0">
      <label className="relative mb-3 flex items-center">
        <span className="sr-only">Search or scan</span>
        <SearchIcon className="pointer-events-none absolute left-3 h-4 w-4 text-subtle" aria-hidden />
        <input
          data-table-search
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name or SKU, or scan a barcode"
          className="h-11 w-full rounded-lg border border-line-strong bg-surface pl-9 pr-3 text-sm text-ink placeholder:text-subtle focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
        
      </label>
      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Categories">
        {['all', ...categories].map((c) =>
        <button
          key={c}
          type="button"
          role="tab"
          aria-selected={category === c}
          onClick={() => setCategory(c)}
          className={cn(
            'h-9 shrink-0 whitespace-nowrap rounded-full border px-3.5 text-[13px] transition-colors duration-150',
            category === c ? 'border-ink bg-ink text-white' : 'border-line-strong bg-surface text-muted hover:text-ink'
          )}>
          
            {c === 'all' ? 'All items' : c}
          </button>
        )}
      </div>
      {visible.length === 0 ?
      <div className="rounded-lg border border-line bg-surface">
          <EmptyState icon={PackageSearchIcon} title="Nothing matches" description="Try another name, SKU or category." />
        </div> :

      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
          {visible.map((item) => {
          const out = item.available !== null && item.available - item.inCart <= 0;
          const low = item.available !== null && item.available > 0 && item.available <= 3;
          return (
            <li key={item.variant.id}>
                <button
                type="button"
                disabled={out}
                onClick={() => onAdd(item)}
                className={cn(
                  'relative flex h-full min-h-[104px] w-full flex-col rounded-lg border bg-surface p-3 text-left transition-[border-color,background-color,transform] duration-150 active:scale-[0.98]',
                  item.inCart > 0 ? 'border-accent ring-1 ring-accent' : 'border-line hover:border-line-strong',
                  out && 'cursor-not-allowed opacity-50'
                )}>
                
                  <span className="line-clamp-2 text-[13px] font-medium leading-snug text-ink">{item.product.name}</span>
                  {item.variant.title && item.variant.title !== 'Default' && <span className="mt-0.5 truncate text-xs text-muted">{item.variant.title}</span>}
                  <span className="mt-auto flex items-end justify-between gap-2 pt-2">
                    <span className="tabular text-sm font-semibold text-ink">{formatMoney(item.variant.price)}</span>
                    {item.available !== null &&
                  <span className={cn('tabular text-[11px]', out ? 'text-critical' : low ? 'text-warning' : 'text-subtle')}>{out ? 'Out' : `${item.available} left`}</span>
                  }
                  </span>
                  {item.inCart > 0 &&
                <span className="tabular absolute right-2 top-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-semibold text-white">{item.inCart}</span>
                }
                </button>
              </li>);

        })}
        </ul>
      }
    </section>);

}
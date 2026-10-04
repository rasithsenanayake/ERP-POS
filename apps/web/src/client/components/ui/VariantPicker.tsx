import React, { useMemo, useState } from 'react';
import { ScanBarcodeIcon, SearchIcon } from 'lucide-react';
import { useErp } from '../../contexts/ErpContext';
import { cn } from '../../utils/cn';
import { variantAvailable } from '../../utils/inventory';
import { formatMoney } from '../../utils/money';

interface VariantPickerProps {
  onSelect: (variantId: string) => void;
  warehouseId?: string | null;
  physicalOnly?: boolean;
  exclude?: string[];
  placeholder?: string;
  id?: string;
}

export function VariantPicker({ onSelect, warehouseId, physicalOnly = false, exclude = [], placeholder = 'Search by name, SKU or scan a barcode', id }: VariantPickerProps) {
  const { state, lookups } = useErp();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.variants.
    filter((v) => {
      const product = lookups.productsById.get(v.productId);
      if (!product || product.status !== 'active' || exclude.includes(v.id)) return false;
      if (physicalOnly && product.type !== 'physical') return false;
      if (!q) return true;
      return product.name.toLowerCase().includes(q) || v.sku.toLowerCase().includes(q) || v.barcode.includes(q) || v.title.toLowerCase().includes(q);
    }).
    slice(0, 8);
  }, [query, state.variants, lookups.productsById, exclude, physicalOnly]);

  const choose = (variantId: string) => {
    onSelect(variantId);
    setQuery('');
    setActive(0);
  };

  return (
    <div className="relative">
      <SearchIcon className="pointer-events-none absolute left-2.5 top-2 h-4 w-4 text-subtle" aria-hidden />
      <input
        id={id}
        role="combobox"
        aria-expanded={open && results.length > 0}
        aria-controls={id ? `${id}-list` : undefined}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive((a) => Math.min(results.length - 1, a + 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((a) => Math.max(0, a - 1));
          } else if (e.key === 'Enter') {
            e.preventDefault();
            const exact = state.variants.find((v) => v.barcode === query.trim() || v.sku.toLowerCase() === query.trim().toLowerCase());
            if (exact && !exclude.includes(exact.id)) choose(exact.id);else
            if (results[active]) choose(results[active].id);
          }
        }}
        placeholder={placeholder}
        className="h-9 w-full rounded-md border border-line-strong bg-surface pl-8 pr-8 text-[13px] placeholder:text-subtle focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
      
      <ScanBarcodeIcon className="pointer-events-none absolute right-2.5 top-2 h-4 w-4 text-subtle" aria-hidden />
      {open && results.length > 0 &&
      <ul id={id ? `${id}-list` : undefined} role="listbox" className="absolute left-0 right-0 top-full z-30 mt-1 max-h-72 overflow-y-auto rounded-lg border border-line bg-surface p-1 shadow-pop">
          {results.map((variant, index) => {
          const product = lookups.productsById.get(variant.productId)!;
          const warehouseIds = warehouseId ? [warehouseId] : state.warehouses.map((w) => w.id);
          const available = variantAvailable(variant, product, state.balances, warehouseIds);
          return (
            <li key={variant.id} role="option" aria-selected={index === active}>
                <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(variant.id)}
                onMouseEnter={() => setActive(index)}
                className={cn('flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left', index === active && 'bg-surface-2')}>
                
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium text-ink">{product.name}</div>
                    <div className="truncate text-xs text-muted">
                      {variant.title !== 'Default' ? `${variant.title} · ` : ''}
                      {variant.sku}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="tabular text-[13px] text-ink">{formatMoney(variant.price)}</div>
                    <div className={cn('tabular text-xs', available !== null && available <= 0 ? 'text-critical' : 'text-muted')}>
                      {available === null ? 'Service' : `${available} available`}
                    </div>
                  </div>
                </button>
              </li>);

        })}
        </ul>
      }
    </div>);

}
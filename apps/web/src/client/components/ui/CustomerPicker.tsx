import React, { useMemo, useState } from 'react';
import { SearchIcon, UserIcon, XIcon } from 'lucide-react';
import { useErp } from '../../contexts/ErpContext';
import { cn } from '../../utils/cn';

interface CustomerPickerProps {
  value: string | null;
  onChange: (customerId: string | null) => void;
  id?: string;
}

export function CustomerPicker({ value, onChange, id }: CustomerPickerProps) {
  const { scoped, lookups } = useErp();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const selected = value ? lookups.customersById.get(value) : null;

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const digits = q.replace(/\D/g, '');
    return scoped.customers.
    filter((c) => !q || c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q) || digits.length >= 3 && c.phone.replace(/\D/g, '').includes(digits)).
    slice(0, 6);
  }, [query, scoped.customers]);

  if (selected) {
    return (
      <div className="flex items-center gap-3 rounded-md border border-line-strong bg-surface px-3 py-2">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-medium text-ink">{selected.name}</div>
          <div className="truncate text-xs text-muted">
            {selected.company ? `${selected.company} · ` : ''}
            {selected.phone}
          </div>
        </div>
        <button type="button" onClick={() => onChange(null)} aria-label="Remove customer" className="rounded p-1 text-muted hover:bg-surface-2 hover:text-ink">
          <XIcon className="h-4 w-4" />
        </button>
      </div>);

  }

  return (
    <div className="relative">
      <SearchIcon className="pointer-events-none absolute left-2.5 top-2 h-4 w-4 text-subtle" aria-hidden />
      <input
        id={id}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        placeholder="Search name, company or phone — or leave as walk-in"
        className="h-9 w-full rounded-md border border-line-strong bg-surface pl-8 pr-3 text-[13px] placeholder:text-subtle focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
      
      {open &&
      <ul role="listbox" className="absolute left-0 right-0 top-full z-30 mt-1 rounded-lg border border-line bg-surface p-1 shadow-pop">
          {results.map((customer) =>
        <li key={customer.id} role="option" aria-selected={false}>
              <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              onChange(customer.id);
              setQuery('');
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-surface-2">
            
                <UserIcon className="h-4 w-4 shrink-0 text-subtle" aria-hidden />
                <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{customer.name}</span>
                <span className={cn('shrink-0 text-xs text-muted')}>{customer.phone}</span>
              </button>
            </li>
        )}
          {results.length === 0 && <li className="px-2 py-2 text-[13px] text-muted">No customers match “{query}”.</li>}
        </ul>
      }
    </div>);

}
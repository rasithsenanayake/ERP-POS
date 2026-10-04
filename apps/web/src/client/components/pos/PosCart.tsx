import React, { useMemo, useState } from 'react';
import { BanknoteIcon, CreditCardIcon, MinusIcon, PlusIcon, QrCodeIcon, ShoppingBasketIcon, Trash2Icon } from 'lucide-react';
import type { PaymentMethod } from '../../types/sales';
import { cn } from '../../utils/cn';
import { formatMoney, parseMoneyInput } from '../../utils/money';
import { Button } from '../ui/Button';
import { CustomerPicker } from '../ui/CustomerPicker';
import type { PosItem } from './PosProductGrid';

export interface CheckoutInput {
  method: PaymentMethod;
  tendered: number;
  customerId: string | null;
}

interface PosCartProps {
  items: PosItem[];
  taxRateBps: number;
  taxLabel: string;
  busy: boolean;
  onQuantity: (variantId: string, quantity: number) => void;
  onClear: () => void;
  onCheckout: (input: CheckoutInput) => void;
}

const methods: {value: PaymentMethod;label: string;icon: typeof BanknoteIcon;}[] = [
{ value: 'cash', label: 'Cash', icon: BanknoteIcon },
{ value: 'card', label: 'Card', icon: CreditCardIcon },
{ value: 'qr', label: 'LankaQR', icon: QrCodeIcon }];


export function PosCart({ items, taxRateBps, taxLabel, busy, onQuantity, onClear, onCheckout }: PosCartProps) {
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [tenderedInput, setTenderedInput] = useState('');
  const [customerId, setCustomerId] = useState<string | null>(null);

  const total = useMemo(() => items.reduce((sum, i) => sum + i.variant.price * i.inCart, 0), [items]);
  const tax = total - Math.round(total * 10000 / (10000 + taxRateBps));
  const units = items.reduce((s, i) => s + i.inCart, 0);
  const tendered = method === 'cash' ? parseMoneyInput(tenderedInput) ?? 0 : total;
  const change = tendered - total;
  const canCharge = items.length > 0 && (method !== 'cash' || tendered >= total) && !busy;
  const quickCash = useMemo(() => {
    const round = (step: number) => Math.ceil(total / step) * step;
    return Array.from(new Set([total, round(100_000), round(500_000), round(1_000_000)])).filter((v) => v >= total).slice(0, 4);
  }, [total]);

  const submit = () => {
    if (!canCharge) return;
    onCheckout({ method, tendered, customerId });
    setTenderedInput('');
    setCustomerId(null);
  };

  return (
    <aside aria-label="Current sale" className="flex flex-col rounded-lg border border-line bg-surface shadow-card lg:sticky lg:top-20 lg:max-h-[calc(100vh-104px)]">
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="text-sm font-semibold text-ink">
          Current sale {units > 0 && <span className="tabular font-normal text-muted">· {units} item{units === 1 ? '' : 's'}</span>}
        </h2>
        {items.length > 0 &&
        <button type="button" onClick={onClear} className="text-[13px] text-muted hover:text-critical">
            Clear
          </button>
        }
      </header>

      <div className="border-b border-line px-4 py-3">
        <CustomerPicker value={customerId} onChange={setCustomerId} id="pos-customer" />
      </div>

      <div className="min-h-[120px] flex-1 overflow-y-auto">
        {items.length === 0 ?
        <div className="flex flex-col items-center px-6 py-10 text-center">
            <ShoppingBasketIcon className="mb-2 h-6 w-6 text-subtle" aria-hidden />
            <p className="text-[13px] text-muted">Tap a product or scan a barcode to start a sale.</p>
          </div> :

        <ul className="divide-y divide-line">
            {items.map((item) => {
            const max = item.available ?? 999;
            return (
              <li key={item.variant.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium text-ink">{item.product.name}</div>
                    <div className="tabular truncate text-xs text-muted">
                      {item.variant.title && item.variant.title !== 'Default' ? `${item.variant.title} · ` : ''}
                      {formatMoney(item.variant.price)}
                    </div>
                  </div>
                  <div className="flex items-center rounded-md border border-line-strong">
                    <button type="button" aria-label={`Decrease ${item.product.name}`} onClick={() => onQuantity(item.variant.id, item.inCart - 1)} className="flex h-8 w-8 items-center justify-center text-muted hover:text-ink">
                      {item.inCart === 1 ? <Trash2Icon className="h-3.5 w-3.5" /> : <MinusIcon className="h-3.5 w-3.5" />}
                    </button>
                    <span className="tabular w-7 text-center text-[13px] font-medium" aria-live="polite">
                      {item.inCart}
                    </span>
                    <button
                    type="button"
                    aria-label={`Increase ${item.product.name}`}
                    disabled={item.inCart >= max}
                    onClick={() => onQuantity(item.variant.id, item.inCart + 1)}
                    className="flex h-8 w-8 items-center justify-center text-muted hover:text-ink disabled:opacity-40">
                    
                      <PlusIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="tabular w-20 text-right text-[13px] font-medium text-ink">{formatMoney(item.variant.price * item.inCart)}</span>
                </li>);

          })}
          </ul>
        }
      </div>

      <div className="border-t border-line px-4 py-3">
        <div className="flex justify-between text-xs text-muted">
          <span>Includes {taxLabel}</span>
          <span className="tabular">{formatMoney(tax, { decimals: true })}</span>
        </div>
        <div className="mt-1 flex items-baseline justify-between">
          <span className="text-sm font-medium text-ink">Total</span>
          <span className="tabular text-2xl font-semibold tracking-[-0.01em] text-ink">{formatMoney(total, { decimals: true })}</span>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="Payment method">
          {methods.map((m) => {
            const Icon = m.icon;
            const active = method === m.value;
            return (
              <button
                key={m.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setMethod(m.value)}
                className={cn(
                  'flex h-11 items-center justify-center gap-1.5 rounded-md border text-[13px] font-medium transition-colors duration-150',
                  active ? 'border-accent bg-accent-soft text-accent' : 'border-line-strong text-muted hover:text-ink'
                )}>
                
                <Icon className="h-4 w-4" aria-hidden />
                {m.label}
              </button>);

          })}
        </div>

        {method === 'cash' && items.length > 0 &&
        <div className="mt-3">
            <label htmlFor="pos-tendered" className="mb-1 block text-xs font-medium text-muted">
              Cash received
            </label>
            <input
            id="pos-tendered"
            inputMode="decimal"
            value={tenderedInput}
            onChange={(e) => setTenderedInput(e.target.value)}
            placeholder="0"
            className="tabular h-10 w-full rounded-md border border-line-strong bg-surface px-3 text-right text-base font-medium text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
          
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {quickCash.map((v) =>
            <button key={v} type="button" onClick={() => setTenderedInput(String(v / 100))} className="tabular h-7 rounded border border-line px-2 text-xs text-muted hover:bg-surface-2 hover:text-ink">
                  {v === total ? 'Exact' : formatMoney(v)}
                </button>
            )}
            </div>
            {tendered > 0 &&
          <div className={cn('mt-2 flex justify-between text-[13px] font-medium', change >= 0 ? 'text-positive' : 'text-critical')}>
                <span>{change >= 0 ? 'Change due' : 'Still owed'}</span>
                <span className="tabular">{formatMoney(Math.abs(change), { decimals: true })}</span>
              </div>
          }
          </div>
        }

        <Button variant="primary" className="mt-3 h-12 w-full text-sm" disabled={!canCharge} loading={busy} onClick={submit}>
          {items.length === 0 ? 'Charge' : `Charge ${formatMoney(total)}`}
        </Button>
      </div>
    </aside>);

}
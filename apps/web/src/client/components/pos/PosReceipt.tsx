import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckIcon, PrinterIcon } from 'lucide-react';
import type { Order } from '../../types/sales';
import { formatDateTime } from '../../utils/dates';
import { formatMoney } from '../../utils/money';
import { orderTotals } from '../../utils/orderMath';
import { methodLabels } from '../../utils/domain/orders';
import { ease } from '../../utils/styles';
import { Button } from '../ui/Button';

interface PosReceiptProps {
  order: Order;
  taxRateBps: number;
  taxLabel: string;
  tendered: number;
  branchName: string;
  customerName: string | null;
  onNewSale: () => void;
}

export function PosReceipt({ order, taxRateBps, taxLabel, tendered, branchName, customerName, onNewSale }: PosReceiptProps) {
  const totals = orderTotals(order, taxRateBps);
  const method = order.payments[0]?.method ?? 'cash';
  const change = method === 'cash' ? tendered - totals.total : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24, ease }} className="mx-auto max-w-md">
      <div className="mb-5 text-center">
        <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-positive-soft text-positive">
          <CheckIcon className="h-5 w-5" aria-hidden />
        </span>
        <h2 className="text-lg font-semibold text-ink">Sale complete</h2>
        {change > 0 &&
        <p className="mt-1 text-sm text-muted">
            Give change of <span className="tabular font-semibold text-ink">{formatMoney(change, { decimals: true })}</span>
          </p>
        }
      </div>

      <section aria-label="Receipt" className="rounded-lg border border-line bg-surface p-5 font-mono text-xs text-ink shadow-card">
        <div className="text-center">
          <div className="font-sans text-sm font-semibold">Serendib Lifestyle</div>
          <div className="text-muted">{branchName}</div>
          <div className="mt-1 text-muted">
            {order.number} · {formatDateTime(order.createdAt)}
          </div>
          {customerName && <div className="text-muted">Customer: {customerName}</div>}
        </div>
        <div className="my-3 border-t border-dashed border-line-strong" />
        <ul className="space-y-1.5">
          {order.items.map((item) =>
          <li key={item.id} className="flex justify-between gap-3">
              <span className="min-w-0 truncate">
                {item.quantity} × {item.name}
              </span>
              <span className="tabular shrink-0">{formatMoney(item.unitPrice * item.quantity, { decimals: true })}</span>
            </li>
          )}
        </ul>
        <div className="my-3 border-t border-dashed border-line-strong" />
        <div className="space-y-1">
          <div className="flex justify-between text-muted">
            <span>{taxLabel} included</span>
            <span className="tabular">{formatMoney(totals.tax, { decimals: true })}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold">
            <span>Total</span>
            <span className="tabular">{formatMoney(totals.total, { decimals: true })}</span>
          </div>
          <div className="flex justify-between text-muted">
            <span>{methodLabels[method]}</span>
            <span className="tabular">{formatMoney(method === 'cash' ? tendered : totals.total, { decimals: true })}</span>
          </div>
          {change > 0 &&
          <div className="flex justify-between text-muted">
              <span>Change</span>
              <span className="tabular">{formatMoney(change, { decimals: true })}</span>
            </div>
          }
        </div>
      </section>

      <div className="no-print mt-4 flex flex-wrap justify-center gap-2">
        <Button icon={PrinterIcon} onClick={() => window.print()}>
          Print receipt
        </Button>
        <Link to={`/orders/${order.id}`} className="inline-flex h-8 items-center rounded-md px-3 text-[13px] font-medium text-ink hover:bg-surface-2">
          View order
        </Link>
        <Button variant="primary" onClick={onNewSale} autoFocus>
          New sale
        </Button>
      </div>
    </motion.div>);

}
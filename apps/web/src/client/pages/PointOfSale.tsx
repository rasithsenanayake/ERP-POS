import React, { useMemo, useState } from 'react';
import { CheckoutInput, PosCart } from '../components/pos/PosCart';
import { PosItem, PosProductGrid } from '../components/pos/PosProductGrid';
import { PosReceipt } from '../components/pos/PosReceipt';
import { PageHeader } from '../components/ui/PageHeader';
import { useErp } from '../contexts/ErpContext';
import { usePosCart } from '../hooks/usePosCart';
import type { Order } from '../types/sales';
import { availableQty, getBalance } from '../utils/inventory';
import { orderTotals } from '../utils/orderMath';
import { selectChevron, selectClass } from '../utils/styles';

export function PointOfSale() {
  const { state, scoped, user, branchId, actions, lookups } = useErp();
  const cart = usePosCart();
  const [registerBranch, setRegisterBranch] = useState(branchId ?? user.branchId ?? scoped.branches[0]?.id ?? state.branches[0].id);
  const activeBranchId = branchId ?? registerBranch;
  const branch = lookups.branchesById.get(activeBranchId) ?? state.branches[0];
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<{order: Order;tendered: number;} | null>(null);

  const items = useMemo<PosItem[]>(() => {
    const inCart = new Map(cart.lines.map((l) => [l.variantId, l.quantity]));
    return state.variants.
    map((variant) => {
      const product = lookups.productsById.get(variant.productId);
      if (!product || product.status !== 'active') return null;
      const available = product.type === 'physical' ? availableQty(getBalance(state.balances, variant.id, branch.warehouseId)) : null;
      return { variant, product, available, inCart: inCart.get(variant.id) ?? 0 };
    }).
    filter((x): x is PosItem => x !== null);
  }, [state.variants, state.balances, lookups.productsById, branch.warehouseId, cart.lines]);

  const cartItems = items.filter((i) => i.inCart > 0);

  const checkout = ({ method, tendered, customerId }: CheckoutInput) => {
    setBusy(true);
    const order = actions.createOrder({
      customerId,
      branchId: branch.id,
      channel: 'in_store',
      lines: cart.lines,
      orderDiscount: 0,
      customerNote: '',
      confirm: true
    });
    if (!order) {
      setBusy(false);
      return;
    }
    const total = orderTotals(order, state.company.taxRateBps).total;
    const paid = actions.recordPayment({ orderId: order.id, amount: total, method, reference: method === 'cash' ? '' : 'POS terminal' });
    const fulfilled = paid ? actions.fulfilOrder(order.id) : null;
    setBusy(false);
    if (!paid) return;
    cart.clear();
    setReceipt({ order: fulfilled ?? paid, tendered });
  };

  if (receipt) {
    const customer = receipt.order.customerId ? lookups.customersById.get(receipt.order.customerId) : null;
    return (
      <div className="py-4">
        <PosReceipt
          order={receipt.order}
          taxRateBps={state.company.taxRateBps}
          taxLabel={state.company.taxLabel}
          tendered={receipt.tendered}
          branchName={branch.name}
          customerName={customer?.name ?? null}
          onNewSale={() => setReceipt(null)} />
        
      </div>);

  }

  return (
    <div>
      <PageHeader
        title="Point of Sale"
        meta={`Register · ${branch.name} · ${user.name}`}
        actions={
        !branchId && scoped.branches.length > 1 ?
        <label className="flex items-center gap-2 text-[13px] text-muted">
              Register
              <select value={registerBranch} onChange={(e) => setRegisterBranch(e.target.value)} className={`${selectClass} w-44`} style={selectChevron} disabled={cart.lines.length > 0}>
                {scoped.branches.map((b) =>
            <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
            )}
              </select>
            </label> :
        undefined
        } />
      
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <PosProductGrid items={items} onAdd={(item) => cart.add(item.variant.id, item.available ?? 999)} />
        <PosCart
          items={cartItems}
          taxRateBps={state.company.taxRateBps}
          taxLabel={state.company.taxLabel}
          busy={busy}
          onQuantity={cart.setQuantity}
          onClear={cart.clear}
          onCheckout={checkout} />
        
      </div>
    </div>);

}
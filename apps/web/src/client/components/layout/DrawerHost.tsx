import React from 'react';
import { useErp } from '../../contexts/ErpContext';
import { useUi } from '../../contexts/UiContext';
import { CustomerFormDrawer } from '../customers/CustomerFormDrawer';
import { StockAdjustmentDrawer } from '../inventory/StockAdjustmentDrawer';
import { TransferFormDrawer } from '../inventory/TransferFormDrawer';
import { NewOrderDrawer } from '../orders/NewOrderDrawer';
import { ProductFormDrawer } from '../products/ProductFormDrawer';

/** Hosts the global create/quick-action drawers so they open over any page without losing context. */
export function DrawerHost() {
  const { drawer, closeDrawer } = useUi();
  const { lookups } = useErp();
  const payload = drawer?.payload ?? {};
  const editingCustomer = drawer?.kind === 'customer' && payload.customerId ? lookups.customersById.get(payload.customerId) : undefined;

  return (
    <>
      <NewOrderDrawer open={drawer?.kind === 'order'} onClose={closeDrawer} initialCustomerId={drawer?.kind === 'order' ? payload.customerId : undefined} />
      <CustomerFormDrawer open={drawer?.kind === 'customer'} onClose={closeDrawer} customer={editingCustomer} />
      <ProductFormDrawer open={drawer?.kind === 'product'} onClose={closeDrawer} />
      <StockAdjustmentDrawer
        open={drawer?.kind === 'adjust'}
        onClose={closeDrawer}
        initialVariantId={drawer?.kind === 'adjust' ? payload.variantId : undefined}
        initialWarehouseId={drawer?.kind === 'adjust' ? payload.warehouseId : undefined} />
      
      <TransferFormDrawer open={drawer?.kind === 'transfer'} onClose={closeDrawer} />
    </>);

}
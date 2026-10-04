import { useMemo } from 'react';
import { useErp } from '../contexts/ErpContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { computeInsights } from '../utils/insights';
import {
  branchComparison,
  getPeriodRange,
  inventoryValue,
  lowStockRows,
  pctChange,
  receivables,
  revenueSeries,
  summarize,
  topProducts } from
'../utils/metrics';
import { getBalance } from '../utils/inventory';

/** All Home numbers are derived from stored records each time state changes. */
export function useDashboardData() {
  const { state, scoped, lookups, can } = useErp();
  const { period } = usePreferences();
  const bps = state.company.taxRateBps;

  return useMemo(() => {
    const now = new Date();
    const range = getPeriodRange(period, now);
    const current = summarize(scoped.orders, range.start, range.end, bps);
    const previous = summarize(scoped.orders, range.prevStart, range.prevEnd, bps);
    const warehouseIds = scoped.warehouses.map((w) => w.id);
    const physicalVariants = state.variants.filter((v) => lookups.productsById.get(v.productId)?.type === 'physical');
    const unitsOnHand = physicalVariants.reduce((s, v) => s + warehouseIds.reduce((t, w) => t + getBalance(state.balances, v.id, w).onHand, 0), 0);
    const low = lowStockRows(state.balances, state.variants, lookups.productsById, scoped.warehouses);
    return {
      range,
      current,
      previous,
      salesDelta: pctChange(current.netSales, previous.netSales),
      ordersDelta: pctChange(current.orders, previous.orders),
      aovDelta: pctChange(current.aov, previous.aov),
      profitDelta: pctChange(current.grossProfit, previous.grossProfit),
      series: revenueSeries(scoped.orders, range, bps, now),
      receivables: receivables(scoped.orders, bps),
      inventoryValue: inventoryValue(state.balances, state.variants, lookups.productsById, warehouseIds),
      unitsOnHand,
      lowStockCount: low.length,
      branches: branchComparison(scoped.orders, scoped.branches, range, bps),
      topProducts: topProducts(scoped.orders, range, bps, 5),
      recentOrders: [...scoped.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6),
      insights: computeInsights({
        orders: scoped.orders,
        products: state.products,
        variants: state.variants,
        productsById: lookups.productsById,
        balances: state.balances,
        ledger: state.ledger,
        warehouses: scoped.warehouses,
        branches: scoped.branches,
        customers: state.customers,
        range,
        bps,
        now,
        canViewCost: can('products.view_cost')
      })
    };
  }, [state, scoped, lookups, period, bps, can]);
}
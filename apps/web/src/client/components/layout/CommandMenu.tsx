import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRightIcon, ClockIcon, HouseIcon, PackageXIcon, PlusIcon, ReceiptTextIcon, SearchIcon, StoreIcon, TagIcon, TrendingUpIcon, UserIcon, WarehouseIcon } from "lucide-react";
import type { LucideIcon } from 'lucide-react';
import { useErp } from "../../contexts/ErpContext";
import { usePreferences } from "../../contexts/PreferencesContext";
import { useUi } from "../../contexts/UiContext";
import { quickCreateActions } from "../../data/quickCreate";
import { navSections, primaryNav } from "../../data/navigation";
import { cn } from "../../utils/cn";
import { formatMoney } from "../../utils/money";
import { orderTotals } from "../../utils/orderMath";
import { ease } from "../../utils/styles";
import { statusLabel } from "../ui/StatusBadge";
interface CommandItem {
  id: string;
  group: string;
  label: string;
  sublabel?: string;
  icon: LucideIcon;
  run: () => void;
}
export function CommandMenu() {
  const {
    commandOpen,
    setCommandOpen,
    openDrawer
  } = useUi();
  const {
    state,
    scoped,
    lookups,
    can,
    isModuleOn,
    role,
    setBranchSelection
  } = useErp();
  const {
    recent,
    trackQuickCreate
  } = usePreferences();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (commandOpen) {
      setQuery('');
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [commandOpen]);
  const close = () => setCommandOpen(false);
  const go = (path: string) => {
    navigate(path);
    close();
  };
  const items = useMemo<CommandItem[]>(() => {
    const q = query.trim().toLowerCase();
    const digits = q.replace(/\D/g, '');
    const matches = (text: string) => text.toLowerCase().includes(q);
    const commands: CommandItem[] = [...quickCreateActions.filter((a) => a.available && a.kind && (!a.module || isModuleOn(a.module)) && (!a.permission || can(a.permission))).map((a) => ({
      id: `create-${a.id}`,
      group: 'Actions',
      label: a.label,
      icon: PlusIcon,
      run: () => {
        trackQuickCreate(a.id);
        openDrawer(a.kind!);
      }
    })), {
      id: 'go-low',
      group: 'Actions',
      label: 'View low stock',
      icon: PackageXIcon,
      run: () => go('/inventory?view=low')
    }, {
      id: 'go-today',
      group: 'Actions',
      label: "Open today's sales",
      icon: TrendingUpIcon,
      run: () => go('/orders?view=today')
    }, ...(role.scope === 'BRANCH' ? [] : [{
      id: 'branch-all',
      group: 'Actions',
      label: 'Switch to all branches',
      icon: StoreIcon,
      run: () => {
        setBranchSelection('all');
        close();
      }
    }, ...state.branches.map((b) => ({
      id: `branch-${b.id}`,
      group: 'Actions',
      label: `Switch branch: ${b.name}`,
      icon: StoreIcon,
      run: () => {
        setBranchSelection(b.id);
        close();
      }
    }))]), {
      id: 'nav-home',
      group: 'Go to',
      label: 'Home',
      icon: HouseIcon,
      run: () => go('/dashboard')
    }, ...(isModuleOn('sales') ? [{
      id: 'nav-orders',
      group: 'Go to',
      label: 'Orders',
      icon: ReceiptTextIcon,
      run: () => go('/orders')
    }, {
      id: 'nav-customers',
      group: 'Go to',
      label: 'Customers',
      icon: UserIcon,
      run: () => go('/customers')
    }] : []), {
      id: 'nav-products',
      group: 'Go to',
      label: 'Products',
      icon: TagIcon,
      run: () => go('/products')
    }, ...(isModuleOn('inventory') ? [{
      id: 'nav-inventory',
      group: 'Go to',
      label: 'Stock levels',
      icon: WarehouseIcon,
      run: () => go('/inventory')
    }, {
      id: 'nav-ledger',
      group: 'Go to',
      label: 'Stock ledger',
      icon: WarehouseIcon,
      run: () => go('/inventory/ledger')
    }, {
      id: 'nav-transfers',
      group: 'Go to',
      label: 'Stock transfers',
      icon: WarehouseIcon,
      run: () => go('/inventory/transfers')
    }] : []), ...[...primaryNav.filter((n) => ['pos', 'purchasing', 'finance'].includes(n.id)), ...navSections.flatMap((s) => s.items)].filter((n) => !n.module || isModuleOn(n.module)).map((n) => ({
      id: `nav-${n.id}`,
      group: 'Go to',
      label: n.label,
      icon: n.icon,
      run: () => go(n.to)
    }))];
    if (!q) {
      const recentItems: CommandItem[] = recent.slice(0, 5).map((r) => ({
        id: `recent-${r.type}-${r.id}`,
        group: 'Recently viewed',
        label: r.label,
        sublabel: r.sublabel,
        icon: ClockIcon,
        run: () => go(r.href)
      }));
      return [...recentItems, ...commands.filter((c) => c.group === 'Actions').slice(0, 6), ...commands.filter((c) => c.group === 'Go to')];
    }
    const results: CommandItem[] = commands.filter((c) => matches(c.label));
    if (isModuleOn('sales') && can('orders.view')) {
      scoped.orders.filter((o) => {
        const customer = o.customerId ? lookups.customersById.get(o.customerId) : null;
        return matches(o.number) || customer && (matches(customer.name) || matches(customer.company));
      }).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5).forEach((o) => {
        const customer = o.customerId ? lookups.customersById.get(o.customerId) : null;
        results.push({
          id: `order-${o.id}`,
          group: 'Orders',
          label: o.number,
          sublabel: `${customer?.name ?? 'Walk-in'} · ${formatMoney(orderTotals(o, state.company.taxRateBps).total)} · ${statusLabel('order', o.status)}`,
          icon: ReceiptTextIcon,
          run: () => go(`/orders/${o.id}`)
        });
      });
      scoped.customers.filter((c) => matches(c.name) || matches(c.company) || matches(c.email) || matches(c.number) || digits.length >= 3 && c.phone.replace(/\D/g, '').includes(digits)).slice(0, 5).forEach((c) => results.push({
        id: `customer-${c.id}`,
        group: 'Customers',
        label: c.name,
        sublabel: `${c.company ? `${c.company} · ` : ''}${c.phone}`,
        icon: UserIcon,
        run: () => go(`/customers/${c.id}`)
      }));
    }
    state.variants.filter((v) => {
      const p = lookups.productsById.get(v.productId);
      return p && (matches(p.name) || matches(v.sku) || v.barcode.includes(q) || matches(p.brand));
    }).slice(0, 6).forEach((v) => {
      const p = lookups.productsById.get(v.productId)!;
      results.push({
        id: `variant-${v.id}`,
        group: 'Products',
        label: `${p.name}${v.title !== 'Default' ? ` · ${v.title}` : ''}`,
        sublabel: `${v.sku} · ${formatMoney(v.price)}`,
        icon: TagIcon,
        run: () => go(`/products/${p.id}`)
      });
    });
    return results;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, state, scoped, lookups, recent, can, isModuleOn, role.scope]);
  useEffect(() => setActive(0), [query]);
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`);
    el?.scrollIntoView({
      block: 'nearest'
    });
  }, [active]);
  const groups = items.reduce<{
    name: string;
    items: (CommandItem & {
      index: number;
    })[];
  }[]>((acc, item, index) => {
    const group = acc.find((g) => g.name === item.group);
    if (group) group.items.push({
      ...item,
      index
    });else acc.push({
      name: item.group,
      items: [{
        ...item,
        index
      }]
    });
    return acc;
  }, []);
  return <AnimatePresence>
      {commandOpen && <div className="fixed inset-0 z-[80] flex items-start justify-center px-4 pt-[12vh]">
          <motion.div className="absolute inset-0 bg-ink/30" initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} transition={{
        duration: 0.15
      }} onClick={close} aria-hidden />
          <motion.div role="dialog" aria-modal="true" aria-label="Search and commands" initial={{
        opacity: 0,
        scale: 0.97,
        y: -6
      }} animate={{
        opacity: 1,
        scale: 1,
        y: 0
      }} exit={{
        opacity: 0,
        scale: 0.97,
        y: -6
      }} transition={{
        duration: 0.18,
        ease
      }} className="relative w-full max-w-xl overflow-hidden rounded-xl border border-line bg-surface shadow-pop">
            <div className="flex items-center gap-2 border-b border-line px-4">
              <SearchIcon className="h-4 w-4 shrink-0 text-subtle" aria-hidden />
              <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActive((a) => Math.min(items.length - 1, a + 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActive((a) => Math.max(0, a - 1));
            } else if (e.key === 'Enter') {
              e.preventDefault();
              items[active]?.run();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              close();
            }
          }} placeholder="Search ORD-1032, a customer, phone, SKU — or type a command" aria-label="Search" role="combobox" aria-expanded="true" aria-controls="command-list" className="h-12 w-full bg-transparent text-sm text-ink placeholder:text-subtle focus:outline-none" />
              <kbd className="rounded border border-line px-1.5 text-[11px] text-subtle">Esc</kbd>
            </div>
            <div ref={listRef} id="command-list" role="listbox" className="max-h-[56vh] overflow-y-auto p-1.5">
              {groups.map((group) => <div key={group.name} className="mb-1">
                  <div className="px-2 pb-1 pt-2 text-[11px] font-medium text-subtle">{group.name}</div>
                  {group.items.map((item) => {
              const Icon = item.icon;
              return <button key={item.id} type="button" role="option" aria-selected={item.index === active} data-index={item.index} onMouseMove={() => setActive(item.index)} onClick={item.run} className={cn('flex w-full items-center gap-3 rounded-md px-2 py-2 text-left', item.index === active && 'bg-surface-2')}>
                        <Icon className="h-4 w-4 shrink-0 text-muted" aria-hidden />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] text-ink">{item.label}</span>
                          {item.sublabel && <span className="block truncate text-xs text-muted">{item.sublabel}</span>}
                        </span>
                        {item.index === active && <ArrowRightIcon className="h-3.5 w-3.5 shrink-0 text-subtle" aria-hidden />}
                      </button>;
            })}
                </div>)}
              {items.length === 0 && <div className="px-4 py-10 text-center">
                  <p className="text-[13px] font-medium text-ink">No results for “{query}”</p>
                  <p className="mt-1 text-xs text-muted">Try an order number, customer name, phone number or SKU.</p>
                </div>}
            </div>
          </motion.div>
        </div>}
    </AnimatePresence>;
}

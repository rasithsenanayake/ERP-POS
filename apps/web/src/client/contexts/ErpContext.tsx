import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { BootScreen } from '../components/layout/BootScreen';
import type { Product, Variant } from '../types/catalog';
import type { ErpState } from '../types/erp';
import type { Branch, Company, ModuleKey, Permission, PreviewRole, Role, User, Warehouse } from '../types/org';
import type { Customer, Order } from '../types/sales';
import type { AuditEntry } from '../types/system';
import { hydrateErpState, persistChangedSlices, sliceFromKey } from '../utils/backend/erpSlices';
import { addCustomerNote, createCustomer, CustomerInput, updateCustomer } from '../utils/domain/customers';
import { createProduct, ProductInput } from '../utils/domain/catalog';
import { DomainContext, DomainResult, withAudit } from '../utils/domain/helpers';
import { AdjustmentInput, advanceTransfer, adjustStock, cancelTransfer, createTransfer, TransferInput } from '../utils/domain/inventory';
import {
  addOrderNote,
  assignOrder,
  cancelOrder,
  confirmOrder,
  createOrder,
  duplicateOrder,
  fulfilOrder,
  NewOrderInput,
  PaymentInput,
  recordPayment,
  refundOrder,
  RefundInput } from
'../utils/domain/orders';
import { BranchInput, CompanyInput, inviteMember, MemberInput, saveBranch, setMemberActive, updateCompany, updateMember } from '../utils/domain/settings';
import { DomainError, isDomainError } from '../utils/errors';
import { createId, referenceId } from '../utils/ids';
import { resolveBranch, scopeCustomers, scopeOrders, scopeWarehouses } from '../utils/permissions';
import { moduleDefinitions } from '../data/modules';
import { useBackend } from './BackendContext';

const PREVIEW_USERS: Record<PreviewRole, string> = {
  owner: 'u-nimali',
  branch_manager: 'u-kasun',
  salesperson: 'u-tharushi'
};

export interface Lookups {
  productsById: Map<string, Product>;
  variantsById: Map<string, Variant>;
  customersById: Map<string, Customer>;
  usersById: Map<string, User>;
  branchesById: Map<string, Branch>;
  warehousesById: Map<string, Warehouse>;
}

export interface BulkResult {
  ok: number;
  failed: string[];
}

export type AuditInput = Omit<AuditEntry, 'id' | 'userId' | 'createdAt' | 'ip'>;

interface ErpValue {
  state: ErpState;
  user: User;
  role: Role;
  can: (permission: Permission) => boolean;
  branchSelection: string;
  setBranchSelection: (id: string) => void;
  branchId: string | null;
  lookups: Lookups;
  scoped: {orders: Order[];customers: Customer[];warehouses: Warehouse[];branches: Branch[];};
  isModuleOn: (key: ModuleKey) => boolean;
  actions: {
    createOrder: (input: NewOrderInput) => Order | null;
    confirmOrder: (orderId: string) => Order | null;
    recordPayment: (input: PaymentInput) => Order | null;
    fulfilOrder: (orderId: string) => Order | null;
    cancelOrder: (orderId: string, reason: string) => Order | null;
    refundOrder: (input: RefundInput) => Order | null;
    addOrderNote: (orderId: string, body: string) => Order | null;
    assignOrder: (orderId: string, userId: string) => Order | null;
    duplicateOrder: (orderId: string) => Order | null;
    bulkFulfil: (orderIds: string[]) => BulkResult;
    bulkAssign: (orderIds: string[], userId: string) => BulkResult;
    bulkCancel: (orderIds: string[], reason: string) => BulkResult;
    createCustomer: (input: CustomerInput) => Customer | null;
    updateCustomer: (id: string, input: CustomerInput) => Customer | null;
    addCustomerNote: (id: string, body: string) => Customer | null;
    createProduct: (input: ProductInput) => Product | null;
    adjustStock: (input: AdjustmentInput) => boolean;
    createTransfer: (input: TransferInput) => boolean;
    advanceTransfer: (id: string) => boolean;
    cancelTransfer: (id: string) => boolean;
    toggleModule: (key: ModuleKey) => void;
    markNotificationRead: (id: string) => void;
    markAllNotificationsRead: () => void;
    /** Records an entry in the audit log for changes made outside the core ERP (CRM, HR, Finance…). */
    recordAudit: (entry: AuditInput) => void;
    updateCompany: (input: CompanyInput) => Company | null;
    saveBranch: (input: BranchInput) => Branch | null;
    inviteMember: (input: MemberInput, invited: boolean) => User | null;
    updateMember: (id: string, input: MemberInput) => User | null;
    setMemberActive: (id: string, active: boolean) => User | null;
  };
}

const ErpContext = createContext<ErpValue | null>(null);

export function ErpProvider({ children, previewRole }: {children: ReactNode;previewRole: PreviewRole;}) {
  const { store, mode, account, signOut } = useBackend();
  const origin = useRef(createId('erp')).current;
  const [state, setState] = useState<ErpState>(() => hydrateErpState(store));
  const stateRef = useRef(state);
  stateRef.current = state;
  const [branchSelection, setBranchSelection] = useState('all');

  // Apply workspace updates received from the server.
  useEffect(
    () =>
    store.subscribe((key, value, from) => {
      if (from === origin) return;
      const slice = sliceFromKey(key);
      if (!slice) return;
      setState((s) => {
        const next = { ...s, [slice]: value } as ErpState;
        stateRef.current = next;
        return next;
      });
    }),
    [store, origin]
  );

  const commit = useCallback(
    (next: ErpState) => {
      const prev = stateRef.current;
      stateRef.current = next;
      setState(next);
      persistChangedSlices(store, prev, next, origin);
    },
    [store, origin]
  );

  const cloudUser = useMemo(() => {
    if (mode !== 'server' || !account) return null;
    return state.users.find((u) => u.email.toLowerCase() === account.email.toLowerCase()) ?? null;
  }, [mode, account, state.users]);

  // First sign-in to a workspace: add the person to the team with the role from their membership.
  useEffect(() => {
    if (mode !== 'server' || !account) return;
    const current = stateRef.current;
    const existing = current.users.find((u) => u.email.toLowerCase() === account.email.toLowerCase());
    if (existing) {
      if (existing.invited) commit({ ...current, users: current.users.map((u) => u.id === existing.id ? { ...u, invited: false } : u) });
      return;
    }
    const local = account.email.split('@')[0] ?? 'Teammate';
    const name = local.
    split(/[._-]+/).
    filter(Boolean).
    map((p) => p[0]!.toUpperCase() + p.slice(1)).
    join(' ');
    const roleName = current.roles.find((r) => r.key === account.role)?.name ?? 'Member';
    const user: User = {
      id: `u-${account.userId.slice(0, 8)}`,
      name,
      initials: name.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase(),
      email: account.email.toLowerCase(),
      role: account.role,
      branchId: account.branchId,
      title: roleName,
      kind: 'person',
      active: true
    };
    commit({ ...current, users: [...current.users, user] });
  }, [mode, account, commit]);

  const user = useMemo(() => {
    if (mode === 'server' && account) {
      return (
        cloudUser ?? {
          id: `u-${account.userId.slice(0, 8)}`,
          name: account.email,
          initials: account.email.slice(0, 2).toUpperCase(),
          email: account.email,
          role: account.role,
          branchId: account.branchId,
          title: '',
          kind: 'person' as const
        });

    }
    return state.users.find((u) => u.id === PREVIEW_USERS[previewRole]) ?? state.users[0]!;
  }, [mode, account, cloudUser, state.users, previewRole]);
  const role = useMemo(() => state.roles.find((r) => r.key === user.role) ?? state.roles[0]!, [state.roles, user]);

  useEffect(() => setBranchSelection('all'), [previewRole]);

  const branchId = resolveBranch(user, role, branchSelection);
  const can = useCallback((permission: Permission) => role.permissions.includes(permission), [role]);
  const isModuleOn = useCallback((key: ModuleKey) => state.modules[key], [state.modules]);

  const lookups = useMemo<Lookups>(
    () => ({
      productsById: new Map(state.products.map((p) => [p.id, p])),
      variantsById: new Map(state.variants.map((v) => [v.id, v])),
      customersById: new Map(state.customers.map((c) => [c.id, c])),
      usersById: new Map(state.users.map((u) => [u.id, u])),
      branchesById: new Map(state.branches.map((b) => [b.id, b])),
      warehousesById: new Map(state.warehouses.map((w) => [w.id, w]))
    }),
    [state.products, state.variants, state.customers, state.users, state.branches, state.warehouses]
  );

  const scoped = useMemo(
    () => ({
      orders: scopeOrders(state.orders, user, role, branchId),
      customers: scopeCustomers(state.customers, user, role, branchId),
      warehouses: scopeWarehouses(state.warehouses, branchId),
      branches: branchId ? state.branches.filter((b) => b.id === branchId) : role.scope === 'BRANCH' ? state.branches.filter((b) => b.id === user.branchId) : state.branches
    }),
    [state.orders, state.customers, state.warehouses, state.branches, user, role, branchId]
  );

  const actions = useMemo(() => {
    const ctx = (): DomainContext => ({ user, role, now: new Date() });
    const reportError = (error: unknown) => {
      if (isDomainError(error)) {
        toast.error(error.message, { description: `Reference ${referenceId()}` });
        return;
      }
      console.error(error);
      toast.error('Something went wrong on our side.', { description: `Nothing was saved. Reference ${referenceId()}` });
    };
    function run<T>(fn: (s: ErpState, c: DomainContext) => DomainResult<T>): T | null {
      try {
        const { state: next, result } = fn(stateRef.current, ctx());
        commit(next);
        return result;
      } catch (error) {
        reportError(error);
        return null;
      }
    }
    function bulk(ids: string[], fn: (s: ErpState, id: string, c: DomainContext) => DomainResult<unknown>): BulkResult {
      let current = stateRef.current;
      let ok = 0;
      const failed: string[] = [];
      for (const id of ids) {
        try {
          current = fn(current, id, ctx()).state;
          ok += 1;
        } catch (error) {
          if (!isDomainError(error)) throw error;
          failed.push(current.orders.find((o) => o.id === id)?.number ?? id);
        }
      }
      commit(current);
      return { ok, failed };
    }
    return {
      createOrder: (input: NewOrderInput) => run((s, c) => createOrder(s, input, c)),
      confirmOrder: (orderId: string) => run((s, c) => confirmOrder(s, orderId, c)),
      recordPayment: (input: PaymentInput) => run((s, c) => recordPayment(s, input, c)),
      fulfilOrder: (orderId: string) => run((s, c) => fulfilOrder(s, orderId, c)),
      cancelOrder: (orderId: string, reason: string) => run((s, c) => cancelOrder(s, { orderId, reason }, c)),
      refundOrder: (input: RefundInput) => run((s, c) => refundOrder(s, input, c)),
      addOrderNote: (orderId: string, body: string) => run((s, c) => addOrderNote(s, { orderId, body }, c)),
      assignOrder: (orderId: string, userId: string) => run((s, c) => assignOrder(s, { orderId, userId }, c)),
      duplicateOrder: (orderId: string) => run((s, c) => duplicateOrder(s, orderId, c)),
      bulkFulfil: (ids: string[]) => bulk(ids, (s, id, c) => fulfilOrder(s, id, c)),
      bulkAssign: (ids: string[], userId: string) => bulk(ids, (s, id, c) => assignOrder(s, { orderId: id, userId }, c)),
      bulkCancel: (ids: string[], reason: string) => bulk(ids, (s, id, c) => cancelOrder(s, { orderId: id, reason }, c)),
      createCustomer: (input: CustomerInput) => run((s, c) => createCustomer(s, input, c)),
      updateCustomer: (id: string, input: CustomerInput) => run((s, c) => updateCustomer(s, id, input, c)),
      addCustomerNote: (id: string, body: string) => run((s, c) => addCustomerNote(s, id, body, c)),
      createProduct: (input: ProductInput) => run((s, c) => createProduct(s, input, c)),
      adjustStock: (input: AdjustmentInput) => run((s, c) => adjustStock(s, input, c)) !== null,
      createTransfer: (input: TransferInput) => run((s, c) => createTransfer(s, input, c)) !== null,
      advanceTransfer: (id: string) => run((s, c) => advanceTransfer(s, id, c)) !== null,
      cancelTransfer: (id: string) => run((s, c) => cancelTransfer(s, id, c)) !== null,
      toggleModule: (key: ModuleKey) => {
        run((s, c) => {
          if (!c.role.permissions.includes('settings.manage')) throw new DomainError('FORBIDDEN', 'Only owners can change modules.');
          const definition = moduleDefinitions.find((m) => m.key === key);
          if (definition?.required) throw new DomainError('INVALID_STATE', `${definition.name} is required and can't be turned off.`);
          const enabled = !s.modules[key];
          const next = { ...s, modules: { ...s.modules, [key]: enabled } };
          return {
            state: withAudit(next, c, {
              action: 'module.toggled',
              resource: 'Module',
              resourceId: key,
              resourceLabel: definition?.name ?? key,
              changes: [{ field: 'enabled', from: String(!enabled), to: String(enabled) }]
            }),
            result: enabled
          };
        });
      },
      markNotificationRead: (id: string) => commit({ ...stateRef.current, notifications: stateRef.current.notifications.map((n) => n.id === id ? { ...n, read: true } : n) }),
      markAllNotificationsRead: () => commit({ ...stateRef.current, notifications: stateRef.current.notifications.map((n) => ({ ...n, read: true })) }),
      recordAudit: (entry: AuditInput) => commit(withAudit(stateRef.current, ctx(), entry)),
      updateCompany: (input: CompanyInput) => run((s, c) => updateCompany(s, input, c)),
      saveBranch: (input: BranchInput) => run((s, c) => saveBranch(s, input, c)),
      inviteMember: (input: MemberInput, invited: boolean) => run((s, c) => inviteMember(s, input, c, invited)),
      updateMember: (id: string, input: MemberInput) => run((s, c) => updateMember(s, id, input, c)),
      setMemberActive: (id: string, active: boolean) => run((s, c) => setMemberActive(s, id, active, c))
    };
  }, [user, role, commit]);

  const value = useMemo<ErpValue>(
    () => ({ state, user, role, can, branchSelection, setBranchSelection, branchId, lookups, scoped, isModuleOn, actions }),
    [state, user, role, can, branchSelection, branchId, lookups, scoped, isModuleOn, actions]
  );

  if (mode === 'server' && cloudUser?.active === false) {
    return <BootScreen label="Your access to this workspace is turned off" error="An owner deactivated your account. Ask them to reactivate it if you still need access." onSignOut={() => void signOut()} />;
  }

  return <ErpContext.Provider value={value}>{children}</ErpContext.Provider>;
}

export function useErp(): ErpValue {
  const ctx = useContext(ErpContext);
  if (!ctx) throw new Error('useErp must be used inside ErpProvider');
  return ctx;
}

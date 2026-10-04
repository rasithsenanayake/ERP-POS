import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AppShell } from './components/layout/AppShell';
import { ErrorBoundary } from './components/layout/ErrorBoundary';
import { LegacyModuleRedirect } from './components/layout/LegacyModuleRedirect';
import { ModuleGuard } from './components/layout/ModuleGuard';
import { SettingsLayout } from './components/layout/SettingsLayout';
import { BackendProvider } from './contexts/BackendContext';
import { ErpProvider } from './contexts/ErpContext';
import { PreferencesProvider } from './contexts/PreferencesContext';
import { UiProvider } from './contexts/UiContext';
import { Dashboard } from './pages/Dashboard';
import { NotFound } from './pages/NotFound';
import { lazyPage } from './utils/lazyPage';

// Every page except the dashboard loads on first visit, keeping the first open fast.
const Orders = lazyPage(() => import('./pages/Orders'), 'Orders');
const OrderDetail = lazyPage(() => import('./pages/OrderDetail'), 'OrderDetail');
const Customers = lazyPage(() => import('./pages/Customers'), 'Customers');
const CustomerDetail = lazyPage(() => import('./pages/CustomerDetail'), 'CustomerDetail');
const PointOfSale = lazyPage(() => import('./pages/PointOfSale'), 'PointOfSale');
const Products = lazyPage(() => import('./pages/Products'), 'Products');
const ProductDetail = lazyPage(() => import('./pages/ProductDetail'), 'ProductDetail');
const Inventory = lazyPage(() => import('./pages/Inventory'), 'Inventory');
const StockLedger = lazyPage(() => import('./pages/StockLedger'), 'StockLedger');
const Transfers = lazyPage(() => import('./pages/Transfers'), 'Transfers');
const Purchasing = lazyPage(() => import('./pages/Purchasing'), 'Purchasing');
const Finance = lazyPage(() => import('./pages/Finance'), 'Finance');
const Crm = lazyPage(() => import('./pages/Crm'), 'Crm');
const Marketing = lazyPage(() => import('./pages/Marketing'), 'Marketing');
const Support = lazyPage(() => import('./pages/Support'), 'Support');
const HumanResources = lazyPage(() => import('./pages/HumanResources'), 'HumanResources');
const Projects = lazyPage(() => import('./pages/Projects'), 'Projects');
const Reports = lazyPage(() => import('./pages/Reports'), 'Reports');
const Automation = lazyPage(() => import('./pages/Automation'), 'Automation');
const Integrations = lazyPage(() => import('./pages/Integrations'), 'Integrations');
const CompanySettings = lazyPage(() => import('./pages/settings/CompanySettings'), 'CompanySettings');
const TeamSettings = lazyPage(() => import('./pages/settings/TeamSettings'), 'TeamSettings');
const DataSettings = lazyPage(() => import('./pages/settings/DataSettings'), 'DataSettings');
const ModuleSettings = lazyPage(() => import('./pages/ModuleSettings'), 'ModuleSettings');
const AuditLog = lazyPage(() => import('./pages/AuditLog'), 'AuditLog');

interface AppProps {
  /** Preview the product as a different signed-in role. */
  previewRole?: 'owner' | 'branch_manager' | 'salesperson';
  /** Row density for every data table. */
  density?: 'comfortable' | 'compact';
}

export function App({ previewRole = 'owner', density = 'comfortable' }: AppProps) {
  return (
    <ErrorBoundary fullScreen>
      <BrowserRouter>
        <BackendProvider>
          <PreferencesProvider>
            <ErpProvider previewRole={previewRole}>
              <UiProvider density={density}>
                <Routes>
                  <Route element={<AppShell />}>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/orders" element={<ModuleGuard module="sales" permission="orders.view"><Orders /></ModuleGuard>} />
                    <Route path="/orders/:orderId" element={<ModuleGuard module="sales" permission="orders.view"><OrderDetail /></ModuleGuard>} />
                    <Route path="/customers" element={<ModuleGuard module="sales" permission="customers.view"><Customers /></ModuleGuard>} />
                    <Route path="/customers/:customerId" element={<ModuleGuard module="sales" permission="customers.view"><CustomerDetail /></ModuleGuard>} />
                    <Route path="/pos" element={<ModuleGuard module="pos" permission="orders.create"><PointOfSale /></ModuleGuard>} />
                    <Route path="/products" element={<ModuleGuard module="products" permission="products.view"><Products /></ModuleGuard>} />
                    <Route path="/products/:productId" element={<ModuleGuard module="products" permission="products.view"><ProductDetail /></ModuleGuard>} />
                    <Route path="/inventory" element={<ModuleGuard module="inventory" permission="inventory.view"><Inventory /></ModuleGuard>} />
                    <Route path="/inventory/ledger" element={<ModuleGuard module="inventory" permission="inventory.view"><StockLedger /></ModuleGuard>} />
                    <Route path="/inventory/transfers" element={<ModuleGuard module="inventory" permission="inventory.view"><Transfers /></ModuleGuard>} />
                    <Route path="/purchasing" element={<ModuleGuard module="purchasing" permission="inventory.view"><Purchasing /></ModuleGuard>} />
                    <Route path="/finance" element={<ModuleGuard module="finance" permission="finance.view"><Finance /></ModuleGuard>} />
                    <Route path="/crm" element={<ModuleGuard module="crm" permission="customers.view"><Crm /></ModuleGuard>} />
                    <Route path="/marketing" element={<ModuleGuard module="marketing" permission="customers.view"><Marketing /></ModuleGuard>} />
                    <Route path="/support" element={<ModuleGuard module="support" permission="customers.view"><Support /></ModuleGuard>} />
                    <Route path="/hr" element={<ModuleGuard module="hr" permission="hr.view"><HumanResources /></ModuleGuard>} />
                    <Route path="/projects" element={<ModuleGuard module="projects"><Projects /></ModuleGuard>} />
                    <Route path="/reports" element={<ModuleGuard module="reports" permission="orders.view"><Reports /></ModuleGuard>} />
                    <Route path="/automation" element={<ModuleGuard module="automation"><Automation /></ModuleGuard>} />
                    <Route path="/apps" element={<ModuleGuard module="integrations"><Integrations /></ModuleGuard>} />
                    <Route path="/settings" element={<SettingsLayout />}>
                      <Route index element={<Navigate to="/settings/company" replace />} />
                      <Route path="company" element={<CompanySettings />} />
                      <Route path="team" element={<TeamSettings />} />
                      <Route path="modules" element={<ModuleSettings />} />
                      <Route path="data" element={<DataSettings />} />
                      <Route path="audit" element={<AuditLog />} />
                    </Route>
                    <Route path="/m/:moduleKey" element={<LegacyModuleRedirect />} />
                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Routes>
                <Toaster position="bottom-right" toastOptions={{ style: { fontFamily: 'Inter, sans-serif', fontSize: '13px' } }} />
              </UiProvider>
            </ErpProvider>
          </PreferencesProvider>
        </BackendProvider>
      </BrowserRouter>
    </ErrorBoundary>);

}

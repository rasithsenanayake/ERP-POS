import React, { useMemo, useState } from 'react';
import { DownloadIcon, ShieldCheckIcon } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { downloadCsv } from '../utils/csv';
import { DAY } from '../utils/dates';
import { Column, DataTable } from '../components/ui/DataTable';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { FilterBar, FilterDef } from '../components/ui/FilterBar';
import { PageHeader } from '../components/ui/PageHeader';
import { useErp } from '../contexts/ErpContext';
import type { AuditEntry } from '../types/system';
import { formatShort } from '../utils/dates';

type Range = '7' | '30' | '90' | 'all';

export function AuditLog() {
  const { state, lookups, can } = useErp();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [range, setRange] = useState<Range>('30');

  const resources = Array.from(new Set(state.audit.map((a) => a.resource)));
  const filterDefs: FilterDef[] = [
  { id: 'resource', label: 'Resource', options: resources.map((r) => ({ value: r, label: r })) },
  { id: 'user', label: 'User', options: state.users.map((u) => ({ value: u.id, label: u.name })) }];


  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const from = range === 'all' ? '' : new Date(Date.now() - Number(range) * DAY).toISOString();
    return [...state.audit].
    filter((a) => {
      if (from && a.createdAt < from) return false;
      if (filters.resource?.length && !filters.resource.includes(a.resource)) return false;
      if (filters.user?.length && !filters.user.includes(a.userId)) return false;
      if (!q) return true;
      return a.action.toLowerCase().includes(q) || a.resourceLabel.toLowerCase().includes(q);
    }).
    sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [state.audit, filters, search, range]);

  const exportCsv = () => {
    downloadCsv(
      `audit-log-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Time', 'User', 'Action', 'Resource', 'Record', 'Changes', 'IP'],
      rows.map((a) => [a.createdAt, lookups.usersById.get(a.userId)?.name ?? a.userId, a.action, a.resource, a.resourceLabel, a.changes.map((c) => `${c.field}: ${c.from} → ${c.to}`).join('; '), a.ip])
    );
  };

  if (!can('audit.view')) {
    return <ErrorState title="You don't have access to the audit log" description="Ask an owner if you need to review system activity." />;
  }

  const columns: Column<AuditEntry>[] = [
  { id: 'time', header: 'Time', cell: (a) => <span className="text-muted">{formatShort(a.createdAt)}</span>, sortValue: (a) => a.createdAt },
  { id: 'user', header: 'User', cell: (a) => lookups.usersById.get(a.userId)?.name ?? a.userId },
  { id: 'action', header: 'Action', cell: (a) => <span className="font-mono text-xs">{a.action}</span>, sortValue: (a) => a.action },
  { id: 'resource', header: 'Resource', cell: (a) => <span>{a.resource} · <span className="font-medium">{a.resourceLabel}</span></span> },
  {
    id: 'changes',
    header: 'Changes',
    cell: (a) =>
    <span className="block max-w-[320px] truncate text-xs text-muted">
          {a.changes.map((c) => `${c.field}: ${c.from} → ${c.to}`).join(' · ') || '—'}
        </span>

  },
  { id: 'ip', header: 'IP', cell: (a) => <span className="font-mono text-xs text-muted">{a.ip}</span> }];


  return (
    <div>
      <PageHeader
        title="Audit log"
        meta="Read-only record of every create, change, approval and deletion. Entries can't be edited or deleted."
        actions={
        <>
            <SegmentedControl<Range>
            label="Date range"
            value={range}
            onChange={setRange}
            options={[
            { value: '7', label: '7 days' },
            { value: '30', label: '30 days' },
            { value: '90', label: '90 days' },
            { value: 'all', label: 'All time' }]
            } />
          
            <Button icon={DownloadIcon} onClick={exportCsv} disabled={rows.length === 0}>
              Export CSV
            </Button>
          </>
        } />
      
      <section className="rounded-lg border border-line bg-surface shadow-card">
        <FilterBar search={search} onSearchChange={setSearch} searchPlaceholder="Search action or record" filters={filterDefs} values={filters} onValuesChange={setFilters} />
        <DataTable
          label="Audit log"
          rows={rows}
          columns={columns}
          getRowId={(a) => a.id}
          pageSize={25}
          mobileRow={(a) =>
          <div>
              <div className="font-mono text-xs text-ink">{a.action}</div>
              <div className="mt-0.5 text-xs text-muted">
                {a.resourceLabel} · {lookups.usersById.get(a.userId)?.name} · {formatShort(a.createdAt)}
              </div>
            </div>
          }
          empty={<EmptyState icon={ShieldCheckIcon} title="No audit entries match" description="Try clearing filters." />} />
        
      </section>
    </div>);

}
import React, { useMemo, useState } from 'react';
import { CheckIcon, UsersIcon, XIcon } from 'lucide-react';
import { toast } from 'sonner';
import { PayrollRun } from '../components/hr/PayrollRun';
import { Avatar } from '../components/ui/Avatar';
import { Badge, Tone } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Column, DataTable } from '../components/ui/DataTable';
import { EmptyState } from '../components/ui/EmptyState';
import { FilterBar } from '../components/ui/FilterBar';
import { PageHeader } from '../components/ui/PageHeader';
import { Panel } from '../components/ui/Panel';
import { Tabs } from '../components/ui/Tabs';
import { useErp } from '../contexts/ErpContext';
import { attendanceToday, employees, leaveRequests as seedLeave } from '../data/hr';
import { usePersistentState } from '../hooks/usePersistentState';
import { useInitialLoading } from '../hooks/useInitialLoading';
import type { AttendanceStatus, Employee, LeaveRequest } from '../types/hr';
import { formatDate } from '../utils/dates';

const typeLabels = { full_time: 'Full-time', part_time: 'Part-time', contract: 'Contract' };
const attendanceMeta: Record<AttendanceStatus, {label: string;tone: Tone;}> = {
  present: { label: 'Present', tone: 'positive' },
  late: { label: 'Late', tone: 'warning' },
  absent: { label: 'Absent', tone: 'critical' },
  on_leave: { label: 'On leave', tone: 'info' },
  off: { label: 'Day off', tone: 'neutral' }
};
const leaveLabels = { annual: 'Annual', sick: 'Sick', casual: 'Casual' };

export function HumanResources() {
  const { lookups, branchId, can } = useErp();
  const loading = useInitialLoading();
  const [tab, setTab] = useState('people');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [leave, setLeave] = usePersistentState<LeaveRequest[]>('hr.leave', seedLeave);
  const canApprove = can('settings.manage');

  const staff = useMemo(() => employees.filter((e) => !branchId || e.branchId === branchId), [branchId]);
  const byId = useMemo(() => new Map(employees.map((e) => [e.id, e])), []);
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return staff.filter((e) => {
      if (filters.department?.length && !filters.department.includes(e.department)) return false;
      if (filters.type?.length && !filters.type.includes(e.type)) return false;
      return !q || e.name.toLowerCase().includes(q) || e.title.toLowerCase().includes(q);
    });
  }, [staff, search, filters]);

  const attendance = attendanceToday.filter((a) => staff.some((s) => s.id === a.employeeId));
  const counts = attendance.reduce<Record<string, number>>((acc, a) => ({ ...acc, [a.status]: (acc[a.status] ?? 0) + 1 }), {});
  const pending = leave.filter((l) => l.status === 'pending' && staff.some((s) => s.id === l.employeeId));
  const scheduled = attendance.filter((a) => a.status !== 'off').length;

  const columns: Column<Employee>[] = [
  {
    id: 'name',
    header: 'Employee',
    cell: (e) =>
    <div className="flex items-center gap-2.5">
          <Avatar initials={e.initials} size="sm" />
          <div>
            <div className="font-medium">{e.name}</div>
            <div className="text-xs text-muted">{e.title}</div>
          </div>
        </div>,

    sortValue: (e) => e.name
  },
  { id: 'dept', header: 'Department', cell: (e) => e.department, sortValue: (e) => e.department },
  { id: 'location', header: 'Location', cell: (e) => <span className="text-muted">{e.branchId ? lookups.branchesById.get(e.branchId)?.shortName : 'Head office / Kelaniya'}</span> },
  { id: 'type', header: 'Type', cell: (e) => <span className="text-muted">{typeLabels[e.type]}</span> },
  { id: 'joined', header: 'Joined', cell: (e) => <span className="text-muted">{formatDate(e.joinedAt)}</span>, sortValue: (e) => e.joinedAt },
  { id: 'leave', header: 'Leave left', align: 'right', cell: (e) => `${e.leaveBalance} days`, sortValue: (e) => e.leaveBalance },
  {
    id: 'today',
    header: 'Today',
    cell: (e) => {
      const a = attendanceToday.find((x) => x.employeeId === e.id);
      return a ? <Badge tone={attendanceMeta[a.status].tone} dot>{attendanceMeta[a.status].label}</Badge> : null;
    }
  }];


  const decide = (id: string, status: 'approved' | 'declined') => {
    const req = leave.find((l) => l.id === id);
    setLeave((list) => list.map((l) => l.id === id ? { ...l, status } : l));
    if (req) toast.success(`${status === 'approved' ? 'Approved' : 'Declined'} ${req.days}-day leave for ${byId.get(req.employeeId)?.name.split(' ')[0]}`);
  };

  return (
    <div>
      <PageHeader title="HR & Payroll" meta={`${staff.length} employees${branchId ? ` at ${lookups.branchesById.get(branchId)?.name}` : ' across all locations'}`} />
      <Tabs
        label="HR sections"
        value={tab}
        onChange={setTab}
        items={[
        { id: 'people', label: 'People', count: staff.length },
        { id: 'attendance', label: 'Attendance' },
        { id: 'leave', label: 'Leave', count: pending.length },
        { id: 'payroll', label: 'Payroll' }]
        } />
      
      <div className="mt-5">
        {tab === 'people' &&
        <section className="rounded-lg border border-line bg-surface shadow-card">
            <FilterBar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search name or role"
            filters={[
            { id: 'department', label: 'Department', options: ['Management', 'Sales', 'Warehouse', 'Finance', 'Support'].map((d) => ({ value: d, label: d })) },
            { id: 'type', label: 'Type', options: Object.entries(typeLabels).map(([value, label]) => ({ value, label })) }]
            }
            values={filters}
            onValuesChange={setFilters} />
          
            <DataTable label="Employees" rows={rows} columns={columns} getRowId={(e) => e.id} loading={loading} initialSort={{ id: 'name', dir: 'asc' }} empty={<EmptyState icon={UsersIcon} title="No employees match" />} />
          </section>
        }

        {tab === 'attendance' &&
        <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
            <Panel title="Today" description={new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}>
              <div className="tabular text-3xl font-semibold text-ink">
                {(counts.present ?? 0) + (counts.late ?? 0)}
                <span className="text-lg font-normal text-muted">/{scheduled}</span>
              </div>
              <div className="text-xs text-muted">clocked in of those scheduled</div>
              <dl className="mt-4 space-y-1.5 text-[13px]">
                {(['late', 'absent', 'on_leave', 'off'] as AttendanceStatus[]).map((s) =>
              <div key={s} className="flex justify-between">
                    <dt className="text-muted">{attendanceMeta[s].label}</dt>
                    <dd className="tabular font-medium text-ink">{counts[s] ?? 0}</dd>
                  </div>
              )}
              </dl>
            </Panel>
            <Panel flush>
              <ul className="divide-y divide-line">
                {attendance.map((a) => {
                const e = byId.get(a.employeeId)!;
                return (
                  <li key={a.employeeId} className="flex items-center gap-3 px-4 py-2.5">
                      <Avatar initials={e.initials} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-medium text-ink">{e.name}</div>
                        <div className="truncate text-xs text-muted">{e.title}</div>
                      </div>
                      <span className="tabular w-16 text-right text-[13px] text-muted">{a.clockIn ?? '—'}</span>
                      <span className="w-24 text-right">
                        <Badge tone={attendanceMeta[a.status].tone} dot>
                          {attendanceMeta[a.status].label}
                        </Badge>
                      </span>
                    </li>);

              })}
              </ul>
            </Panel>
          </div>
        }

        {tab === 'leave' &&
        <Panel flush>
            <ul className="divide-y divide-line">
              {leave.
            filter((l) => staff.some((s) => s.id === l.employeeId)).
            sort((a, b) => (a.status === 'pending' ? -1 : 1) - (b.status === 'pending' ? -1 : 1) || b.from.localeCompare(a.from)).
            map((l) => {
              const e = byId.get(l.employeeId)!;
              return (
                <li key={l.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
                      <Avatar initials={e.initials} size="sm" />
                      <div className="min-w-[200px] flex-1">
                        <div className="text-[13px] text-ink">
                          <span className="font-medium">{e.name}</span> · {leaveLabels[l.kind]} leave, {l.days} day{l.days > 1 ? 's' : ''}
                        </div>
                        <div className="text-xs text-muted">
                          {formatDate(l.from)}
                          {l.to !== l.from && ` – ${formatDate(l.to)}`} · {l.reason} · {e.leaveBalance} days left
                        </div>
                      </div>
                      {l.status === 'pending' ?
                  canApprove || e.branchId === branchId ?
                  <div className="flex gap-1.5">
                            <Button size="sm" icon={XIcon} onClick={() => decide(l.id, 'declined')}>
                              Decline
                            </Button>
                            <Button size="sm" variant="primary" icon={CheckIcon} onClick={() => decide(l.id, 'approved')}>
                              Approve
                            </Button>
                          </div> :

                  <Badge tone="warning">Awaiting approval</Badge> :


                  <Badge tone={l.status === 'approved' ? 'positive' : 'outline'}>{l.status === 'approved' ? 'Approved' : 'Declined'}</Badge>
                  }
                    </li>);

            })}
            </ul>
          </Panel>
        }

        {tab === 'payroll' && <PayrollRun employees={staff} canApprove={canApprove} />}
      </div>
    </div>);

}
import React, { useState } from 'react';
import { BanknoteIcon, CheckIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { Employee } from '../../types/hr';
import { formatMoney } from '../../utils/money';
import { payslip } from '../../utils/payroll';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ConfirmationDialog } from '../ui/ConfirmationDialog';

type RunStatus = 'draft' | 'approved' | 'paid';

export function PayrollRun({ employees, canApprove }: {employees: Employee[];canApprove: boolean;}) {
  const [status, setStatus] = useState<RunStatus>('draft');
  const [confirming, setConfirming] = useState(false);
  const lines = employees.map(payslip);
  const totals = lines.reduce(
    (t, l) => ({ gross: t.gross + l.gross, epfEmployee: t.epfEmployee + l.epfEmployee, net: t.net + l.net, epfEmployer: t.epfEmployer + l.epfEmployer, etf: t.etf + l.etf }),
    { gross: 0, epfEmployee: 0, net: 0, epfEmployer: 0, etf: 0 }
  );
  const employerCost = totals.gross + totals.epfEmployer + totals.etf;
  const month = new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
      <section className="overflow-hidden rounded-lg border border-line bg-surface shadow-card" aria-label="Payslips">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-line bg-surface-2/50 text-xs text-muted">
                <th className="h-9 px-3 text-left font-medium">Employee</th>
                <th className="h-9 px-3 text-right font-medium">Gross</th>
                <th className="h-9 px-3 text-right font-medium">EPF 8%</th>
                <th className="h-9 px-3 text-right font-medium">Net pay</th>
                <th className="hidden h-9 px-3 text-right font-medium md:table-cell">Employer EPF + ETF</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l) =>
              <tr key={l.employee.id} className="border-b border-line last:border-0">
                  <td className="px-3 py-2.5">
                    <div className="font-medium text-ink">{l.employee.name}</div>
                    <div className="text-xs text-muted">{l.employee.title}</div>
                  </td>
                  <td className="tabular px-3 py-2.5 text-right">{formatMoney(l.gross)}</td>
                  <td className="tabular px-3 py-2.5 text-right text-muted">{formatMoney(-l.epfEmployee)}</td>
                  <td className="tabular px-3 py-2.5 text-right font-medium">{formatMoney(l.net)}</td>
                  <td className="tabular hidden px-3 py-2.5 text-right text-muted md:table-cell">{formatMoney(l.epfEmployer + l.etf)}</td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t border-line-strong bg-surface-2/50 font-semibold">
                <td className="px-3 py-2.5">Total · {lines.length} employees</td>
                <td className="tabular px-3 py-2.5 text-right">{formatMoney(totals.gross)}</td>
                <td className="tabular px-3 py-2.5 text-right">{formatMoney(-totals.epfEmployee)}</td>
                <td className="tabular px-3 py-2.5 text-right">{formatMoney(totals.net)}</td>
                <td className="tabular hidden px-3 py-2.5 text-right md:table-cell">{formatMoney(totals.epfEmployer + totals.etf)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <aside className="h-fit rounded-lg border border-line bg-surface p-4 shadow-card" aria-label="Payroll summary">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">{month} payroll</h2>
          <Badge tone={status === 'paid' ? 'positive' : status === 'approved' ? 'info' : 'neutral'} dot>
            {status === 'paid' ? 'Paid' : status === 'approved' ? 'Approved' : 'Draft'}
          </Badge>
        </div>
        <div className="mt-3 text-[13px] text-muted">Net to employees</div>
        <div className="tabular text-2xl font-semibold tracking-[-0.01em] text-ink">{formatMoney(totals.net)}</div>
        <dl className="mt-4 space-y-1.5 border-t border-line pt-3 text-[13px]">
          <div className="flex justify-between">
            <dt className="text-muted">EPF (employee + employer)</dt>
            <dd className="tabular text-ink">{formatMoney(totals.epfEmployee + totals.epfEmployer)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">ETF 3%</dt>
            <dd className="tabular text-ink">{formatMoney(totals.etf)}</dd>
          </div>
          <div className="flex justify-between font-medium">
            <dt className="text-ink">Total employer cost</dt>
            <dd className="tabular text-ink">{formatMoney(employerCost)}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-muted">Pays from Payroll account ·· 0932 on the 28th.</p>
        {canApprove ?
        status === 'draft' ?
        <Button variant="primary" icon={CheckIcon} className="mt-4 w-full" onClick={() => {setStatus('approved');toast.success('Payroll approved');}}>
              Approve payroll
            </Button> :
        status === 'approved' ?
        <Button variant="primary" icon={BanknoteIcon} className="mt-4 w-full" onClick={() => setConfirming(true)}>
              Pay {formatMoney(totals.net, { compact: true })}
            </Button> :

        <p className="mt-4 rounded-md bg-positive-soft px-3 py-2 text-[13px] text-positive">Salaries transferred and payslips emailed.</p> :


        <p className="mt-4 text-xs text-muted">Only owners can approve payroll.</p>
        }
      </aside>

      <ConfirmationDialog
        open={confirming}
        danger={false}
        title={`Pay ${month} salaries?`}
        description={`${formatMoney(totals.net)} will be transferred to ${lines.length} employees and payslips will be emailed. This can't be undone.`}
        confirmLabel="Transfer salaries"
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          setStatus('paid');
          toast.success(`${lines.length} salaries paid`);
        }} />
      
    </div>);

}
import React, { ReactNode, useEffect, useMemo, useState } from 'react';
import { ArrowDownIcon, ArrowUpIcon, ChevronLeftIcon, ChevronRightIcon, ChevronsUpDownIcon } from 'lucide-react';
import { useUi } from '../../contexts/UiContext';
import { cn } from '../../utils/cn';
import { Skeleton } from './Skeleton';

export interface Column<T> {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  align?: 'left' | 'right';
  className?: string;
  hideable?: boolean;
}

interface DataTableProps<T> {
  label: string;
  rows: T[];
  columns: Column<T>[];
  getRowId: (row: T) => string;
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  selected?: Set<string>;
  onSelectedChange?: (selected: Set<string>) => void;
  bulkBar?: ReactNode;
  hiddenColumns?: string[];
  pageSize?: number;
  loading?: boolean;
  empty?: ReactNode;
  initialSort?: {id: string;dir: 'asc' | 'desc';};
  mobileRow?: (row: T) => ReactNode;
}

export function DataTable<T>({
  label,
  rows,
  columns,
  getRowId,
  onRowClick,
  selectable = false,
  selected,
  onSelectedChange,
  bulkBar,
  hiddenColumns = [],
  pageSize = 20,
  loading = false,
  empty,
  initialSort,
  mobileRow
}: DataTableProps<T>) {
  const { density } = useUi();
  const [sort, setSort] = useState(initialSort ?? null);
  const [page, setPage] = useState(0);
  const visible = columns.filter((c) => !hiddenColumns.includes(c.id));

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const column = columns.find((c) => c.id === sort.id);
    if (!column?.sortValue) return rows;
    const factor = sort.dir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = column.sortValue!(a);
      const bv = column.sortValue!(b);
      if (av < bv) return -1 * factor;
      if (av > bv) return 1 * factor;
      return 0;
    });
  }, [rows, sort, columns]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  useEffect(() => {
    setPage(0);
  }, [rows.length]);
  const current = sorted.slice(page * pageSize, page * pageSize + pageSize);

  const selection = selected ?? new Set<string>();
  const pageIds = current.map(getRowId);
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selection.has(id));
  const someOnPage = pageIds.some((id) => selection.has(id));

  const togglePage = () => {
    if (!onSelectedChange) return;
    const next = new Set(selection);
    if (allOnPage) pageIds.forEach((id) => next.delete(id));else
    pageIds.forEach((id) => next.add(id));
    onSelectedChange(next);
  };
  const toggleRow = (id: string) => {
    if (!onSelectedChange) return;
    const next = new Set(selection);
    if (next.has(id)) next.delete(id);else
    next.add(id);
    onSelectedChange(next);
  };
  const toggleSort = (column: Column<T>) => {
    if (!column.sortValue) return;
    setSort((prev) => prev?.id === column.id ? { id: column.id, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { id: column.id, dir: 'desc' });
  };

  const cellPad = density === 'compact' ? 'py-1.5' : 'py-2.5';

  if (loading) {
    return (
      <div aria-busy="true" aria-label={`Loading ${label}`}>
        {Array.from({ length: 8 }).map((_, i) =>
        <div key={i} className="flex items-center gap-4 border-b border-line px-4 py-3 last:border-0">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="hidden h-3.5 w-24 md:block" />
            <Skeleton className="ml-auto h-3.5 w-16" />
          </div>
        )}
      </div>);

  }

  if (rows.length === 0) return <>{empty}</>;

  return (
    <div>
      {selectable && selection.size > 0 &&
      <div className="flex min-h-[44px] flex-wrap items-center gap-2 border-b border-line bg-accent-soft/60 px-3 py-1.5">
          <input
          type="checkbox"
          className="h-4 w-4 cursor-pointer rounded accent-accent"
          checked={allOnPage}
          ref={(el) => {
            if (el) el.indeterminate = !allOnPage && someOnPage;
          }}
          onChange={togglePage}
          aria-label="Select all on this page" />
        
          <span className="text-[13px] font-medium text-ink">{selection.size} selected</span>
          <button type="button" onClick={() => onSelectedChange?.(new Set())} className="text-[13px] text-accent hover:underline">
            Clear
          </button>
          <div className="ml-auto flex flex-wrap items-center gap-1.5">{bulkBar}</div>
        </div>
      }

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-[13px]" aria-label={label}>
          <thead className={cn(selectable && selection.size > 0 && 'sr-only')}>
            <tr className="border-b border-line bg-surface-2/50">
              {selectable &&
              <th className="w-10 px-3">
                  <input
                  type="checkbox"
                  className="h-4 w-4 cursor-pointer rounded accent-accent"
                  checked={allOnPage}
                  onChange={togglePage}
                  aria-label="Select all on this page" />
                
                </th>
              }
              {visible.map((column) => {
                const active = sort?.id === column.id;
                return (
                  <th
                    key={column.id}
                    scope="col"
                    aria-sort={active ? sort!.dir === 'asc' ? 'ascending' : 'descending' : undefined}
                    className={cn('h-9 whitespace-nowrap px-3 text-xs font-medium text-muted', column.align === 'right' ? 'text-right' : 'text-left', column.className)}>
                    
                    {column.sortValue ?
                    <button
                      type="button"
                      onClick={() => toggleSort(column)}
                      className={cn('inline-flex items-center gap-1 rounded hover:text-ink', column.align === 'right' && 'flex-row-reverse', active && 'text-ink')}>
                      
                        {column.header}
                        {active ?
                      sort!.dir === 'asc' ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" /> :

                      <ChevronsUpDownIcon className="h-3 w-3 opacity-40" />
                      }
                      </button> :

                    column.header
                    }
                  </th>);

              })}
            </tr>
          </thead>
          <tbody>
            {current.map((row) => {
              const id = getRowId(row);
              const isSelected = selection.has(id);
              return (
                <tr
                  key={id}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  onKeyDown={onRowClick ? (e) => e.key === 'Enter' && onRowClick(row) : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  className={cn(
                    'border-b border-line last:border-0 transition-colors duration-100 focus-visible:bg-surface-2 focus-visible:outline-none',
                    onRowClick && 'cursor-pointer hover:bg-surface-2/60',
                    isSelected && 'bg-accent-soft/40'
                  )}>
                  
                  {selectable &&
                  <td className={cn('w-10 px-3', cellPad)} onClick={(e) => e.stopPropagation()}>
                      <input
                      type="checkbox"
                      className="h-4 w-4 cursor-pointer rounded accent-accent"
                      checked={isSelected}
                      onChange={() => toggleRow(id)}
                      aria-label="Select row" />
                    
                    </td>
                  }
                  {visible.map((column) =>
                  <td
                    key={column.id}
                    className={cn('whitespace-nowrap px-3 align-middle text-ink', cellPad, column.align === 'right' && 'text-right tabular', column.className)}>
                    
                      {column.cell(row)}
                    </td>
                  )}
                </tr>);

            })}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-line md:hidden" aria-label={label}>
        {current.map((row) => {
          const id = getRowId(row);
          return (
            <li key={id}>
              {onRowClick ?
              <button type="button" onClick={() => onRowClick(row)} className="block w-full px-4 py-3 text-left active:bg-surface-2">
                  {mobileRow ? mobileRow(row) : visible[0]?.cell(row)}
                </button> :

              <div className="px-4 py-3">{mobileRow ? mobileRow(row) : visible[0]?.cell(row)}</div>
              }
            </li>);

        })}
      </ul>

      {sorted.length > pageSize &&
      <div className="flex items-center justify-between border-t border-line px-4 py-2.5 text-[13px] text-muted">
          <span className="tabular">
            {page * pageSize + 1}–{Math.min(sorted.length, (page + 1) * pageSize)} of {sorted.length}
          </span>
          <div className="flex items-center gap-1">
            <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            aria-label="Previous page"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-line-strong bg-surface text-ink hover:bg-surface-2 disabled:opacity-40">
            
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <button
            type="button"
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={page >= pageCount - 1}
            aria-label="Next page"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-line-strong bg-surface text-ink hover:bg-surface-2 disabled:opacity-40">
            
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      }
    </div>);

}
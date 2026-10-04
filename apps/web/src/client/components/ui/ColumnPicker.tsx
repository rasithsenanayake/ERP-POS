import React from 'react';
import { Columns3Icon } from 'lucide-react';
import { Popover } from './Popover';
import { MenuLabel } from './Menu';

interface ColumnPickerProps {
  columns: {id: string;header: string;hideable?: boolean;}[];
  hidden: string[];
  onChange: (hidden: string[]) => void;
}

export function ColumnPicker({ columns, hidden, onChange }: ColumnPickerProps) {
  const hideable = columns.filter((c) => c.hideable);
  return (
    <Popover
      align="end"
      className="w-52"
      trigger={({ open, toggle }) =>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-label="Choose columns"
        title="Columns"
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-line-strong bg-surface text-muted hover:bg-surface-2 hover:text-ink">
        
          <Columns3Icon className="h-4 w-4" />
        </button>
      }>
      
      {() =>
      <div>
          <MenuLabel>Visible columns</MenuLabel>
          {hideable.map((column) =>
        <label key={column.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[13px] hover:bg-surface-2">
              <input
            type="checkbox"
            className="h-3.5 w-3.5 accent-accent"
            checked={!hidden.includes(column.id)}
            onChange={() => onChange(hidden.includes(column.id) ? hidden.filter((h) => h !== column.id) : [...hidden, column.id])} />
          
              {column.header}
            </label>
        )}
        </div>
      }
    </Popover>);

}
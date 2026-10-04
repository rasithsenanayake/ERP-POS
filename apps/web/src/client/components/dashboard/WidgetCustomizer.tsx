import React, { useEffect, useState } from 'react';
import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react';
import { toast } from 'sonner';
import { defaultWidgets, usePreferences, WidgetId, WidgetPref } from '../../contexts/PreferencesContext';
import { Button } from '../ui/Button';
import { Drawer } from '../ui/Drawer';

export const widgetNames: Record<WidgetId, {name: string;description: string;}> = {
  revenue: { name: 'Net sales trend', description: 'Primary sales chart with period comparison' },
  insights: { name: 'Insights', description: 'Calculated alerts and trends' },
  metrics: { name: 'Key metrics', description: 'Orders, AOV, profit, receivables, stock' },
  branches: { name: 'Branch comparison', description: 'Sales and margin by location' },
  topProducts: { name: 'Top products', description: 'Best sellers by net sales' },
  recentOrders: { name: 'Recent orders', description: 'Latest orders across channels' }
};

export function WidgetCustomizer({ open, onClose }: {open: boolean;onClose: () => void;}) {
  const { widgets, setWidgets } = usePreferences();
  const [draft, setDraft] = useState<WidgetPref[]>(widgets);

  useEffect(() => {
    if (open) setDraft(widgets);
  }, [open, widgets]);

  const move = (index: number, direction: -1 | 1) => {
    const next = [...draft];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setDraft(next);
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Customize home"
      description="Choose which widgets appear and in what order. Saved to your account on this device."
      dirty={JSON.stringify(draft) !== JSON.stringify(widgets)}
      footer={
      <>
          <Button onClick={() => setDraft(defaultWidgets)} className="mr-auto">
            Reset
          </Button>
          <Button onClick={onClose}>Cancel</Button>
          <Button
          variant="primary"
          onClick={() => {
            setWidgets(draft);
            toast.success('Home layout saved');
            onClose();
          }}>
          
            Save layout
          </Button>
        </>
      }>
      
      <ul className="divide-y divide-line rounded-md border border-line">
        {draft.map((widget, index) =>
        <li key={widget.id} className="flex items-center gap-3 px-3 py-2.5">
            <input
            id={`widget-${widget.id}`}
            type="checkbox"
            checked={widget.visible}
            onChange={() => setDraft(draft.map((w) => w.id === widget.id ? { ...w, visible: !w.visible } : w))}
            className="h-4 w-4 accent-accent" />
          
            <label htmlFor={`widget-${widget.id}`} className="min-w-0 flex-1 cursor-pointer">
              <span className="block text-[13px] font-medium text-ink">{widgetNames[widget.id].name}</span>
              <span className="block text-xs text-muted">{widgetNames[widget.id].description}</span>
            </label>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" icon={ArrowUpIcon} onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Move ${widgetNames[widget.id].name} up`} />
              <Button size="sm" variant="ghost" icon={ArrowDownIcon} onClick={() => move(index, 1)} disabled={index === draft.length - 1} aria-label={`Move ${widgetNames[widget.id].name} down`} />
            </div>
          </li>
        )}
      </ul>
    </Drawer>);

}
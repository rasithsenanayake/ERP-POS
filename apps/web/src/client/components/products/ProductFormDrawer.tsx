import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { toast } from 'sonner';
import { useErp } from '../../contexts/ErpContext';
import type { ProductStatus } from '../../types/catalog';
import { formatMoney, parseMoneyInput } from '../../utils/money';
import { inputClass, selectChevron, selectClass, textareaClass } from '../../utils/styles';
import { Button } from '../ui/Button';
import { Drawer } from '../ui/Drawer';
import { Field } from '../ui/Field';
import { SegmentedControl } from '../ui/SegmentedControl';

interface ProductFormDrawerProps {
  open: boolean;
  onClose: () => void;
}

const categories = ['Phones', 'Audio', 'Laptops', 'Smart Home', 'Accessories', 'Services'];

const empty = {
  name: '',
  type: 'physical' as 'physical' | 'service',
  status: 'active' as ProductStatus,
  category: 'Accessories',
  brand: '',
  supplier: '',
  description: '',
  price: '',
  compareAt: '',
  wholesale: '',
  cost: '',
  sku: '',
  barcode: '',
  reorderPoint: '5',
  reorderQty: '10'
};

type FormState = typeof empty;

const money = (required: boolean) =>
z.string().refine((v) => v.trim() === '' ? !required : parseMoneyInput(v) !== null, required ? 'Enter a price like 12500' : 'Enter a valid amount');

const schema = z.object({
  name: z.string().trim().min(2, 'Give the product a name'),
  price: money(true),
  compareAt: money(false),
  wholesale: money(false),
  cost: money(true),
  sku: z.string().trim().regex(/^[A-Za-z0-9-]{3,24}$/, '3–24 letters, numbers or dashes'),
  barcode: z.union([z.literal(''), z.string().regex(/^\d{8,14}$/, '8–14 digits')]),
  reorderPoint: z.string().regex(/^\d+$/, 'Whole number'),
  reorderQty: z.string().regex(/^\d+$/, 'Whole number')
});

function generateEan(): string {
  const digits = [4, 7, 9, ...Array.from({ length: 9 }, () => Math.floor(Math.random() * 10))];
  const sum = digits.reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 1 : 3), 0);
  return `${digits.join('')}${(10 - sum % 10) % 10}`;
}

export function ProductFormDrawer({ open, onClose }: ProductFormDrawerProps) {
  const { actions, can } = useErp();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(empty);
      setErrors({});
      setSubmitting(false);
    }
  }, [open]);

  const set = <K extends keyof FormState,>(key: K, value: FormState[K]) => setForm((prev) => ({ ...prev, [key]: value }));
  const dirty = JSON.stringify(form) !== JSON.stringify(empty);
  const price = parseMoneyInput(form.price);
  const cost = parseMoneyInput(form.cost);
  const margin = price && cost !== null && price > 0 ? (price - cost) / price * 100 : null;

  const submit = () => {
    if (submitting) return;
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    setSubmitting(true);
    const product = actions.createProduct({
      name: form.name,
      type: form.type,
      status: form.status,
      category: form.type === 'service' ? 'Services' : form.category,
      brand: form.brand,
      supplier: form.supplier,
      description: form.description,
      price: parseMoneyInput(form.price) ?? 0,
      compareAtPrice: form.compareAt.trim() ? parseMoneyInput(form.compareAt) : null,
      wholesalePrice: form.wholesale.trim() ? parseMoneyInput(form.wholesale) : null,
      cost: parseMoneyInput(form.cost) ?? 0,
      sku: form.sku,
      barcode: form.barcode,
      reorderPoint: parseInt(form.reorderPoint, 10),
      reorderQty: parseInt(form.reorderQty, 10)
    });
    setSubmitting(false);
    if (product) {
      toast.success(`${product.name} created`, { description: product.type === 'physical' ? 'Receive stock to make it available for sale.' : undefined });
      onClose();
      navigate(`/products/${product.id}`);
    }
  };

  const sectionTitle = 'mb-3 text-sm font-semibold text-ink';

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="New product"
      size="lg"
      dirty={dirty}
      footer={
      <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} loading={submitting}>
            Create product
          </Button>
        </>
      }>
      
      <form
        className="space-y-7"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}>
        
        <section>
          <h3 className={sectionTitle}>Basic information</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Product name" htmlFor="p-name" error={errors.name} className="sm:col-span-2">
              <input id="p-name" value={form.name} onChange={(e) => set('name', e.target.value)} className={inputClass} />
            </Field>
            <div>
              <span className="mb-1 block text-[13px] font-medium text-ink">Type</span>
              <SegmentedControl
                label="Product type"
                value={form.type}
                onChange={(v) => set('type', v)}
                className="w-full"
                options={[
                { value: 'physical', label: 'Physical' },
                { value: 'service', label: 'Service' }]
                } />
              
            </div>
            <Field label="Status" htmlFor="p-status">
              <select id="p-status" value={form.status} onChange={(e) => set('status', e.target.value as ProductStatus)} className={selectClass} style={selectChevron}>
                <option value="active">Active — available for sale</option>
                <option value="draft">Draft — hidden from sales</option>
              </select>
            </Field>
            {form.type === 'physical' &&
            <Field label="Category" htmlFor="p-category">
                <select id="p-category" value={form.category} onChange={(e) => set('category', e.target.value)} className={selectClass} style={selectChevron}>
                  {categories.filter((c) => c !== 'Services').map((c) =>
                <option key={c}>{c}</option>
                )}
                </select>
              </Field>
            }
            <Field label="Brand" htmlFor="p-brand" optional>
              <input id="p-brand" value={form.brand} onChange={(e) => set('brand', e.target.value)} className={inputClass} />
            </Field>
            <Field label="Preferred supplier" htmlFor="p-supplier" optional>
              <input id="p-supplier" value={form.supplier} onChange={(e) => set('supplier', e.target.value)} className={inputClass} />
            </Field>
            <Field label="Description" htmlFor="p-desc" optional className="sm:col-span-2">
              <textarea id="p-desc" rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} className={textareaClass} />
            </Field>
          </div>
        </section>

        <section>
          <h3 className={sectionTitle}>Pricing</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Selling price (Rs, incl. VAT)" htmlFor="p-price" error={errors.price}>
              <input id="p-price" value={form.price} onChange={(e) => set('price', e.target.value)} className={inputClass} inputMode="decimal" />
            </Field>
            <Field label="Compare-at price (Rs)" htmlFor="p-compare" optional error={errors.compareAt}>
              <input id="p-compare" value={form.compareAt} onChange={(e) => set('compareAt', e.target.value)} className={inputClass} inputMode="decimal" />
            </Field>
            <Field label="Wholesale price (Rs)" htmlFor="p-wholesale" optional error={errors.wholesale}>
              <input id="p-wholesale" value={form.wholesale} onChange={(e) => set('wholesale', e.target.value)} className={inputClass} inputMode="decimal" />
            </Field>
            {can('products.view_cost') ?
            <Field
              label="Cost per unit (Rs)"
              htmlFor="p-cost"
              error={errors.cost}
              hint={margin !== null && price ? `Margin ${margin.toFixed(1)}% · ${formatMoney(price - (cost ?? 0))} profit per unit` : 'Hidden from roles without cost access'}>
              
                <input id="p-cost" value={form.cost} onChange={(e) => set('cost', e.target.value)} className={inputClass} inputMode="decimal" />
              </Field> :
            null}
          </div>
        </section>

        <section>
          <h3 className={sectionTitle}>Identification{form.type === 'physical' ? ' & inventory' : ''}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="SKU" htmlFor="p-sku" error={errors.sku}>
              <input id="p-sku" value={form.sku} onChange={(e) => set('sku', e.target.value.toUpperCase())} className={`${inputClass} font-mono`} />
            </Field>
            <Field label="Barcode (EAN-13)" htmlFor="p-barcode" optional error={errors.barcode}>
              <div className="flex gap-1.5">
                <input id="p-barcode" value={form.barcode} onChange={(e) => set('barcode', e.target.value.replace(/\D/g, ''))} className={`${inputClass} font-mono`} inputMode="numeric" />
                <Button onClick={() => set('barcode', generateEan())}>Generate</Button>
              </div>
            </Field>
            {form.type === 'physical' &&
            <>
                <Field label="Reorder point" htmlFor="p-rop" error={errors.reorderPoint} hint="Alert when a store's available stock falls to this level">
                  <input id="p-rop" value={form.reorderPoint} onChange={(e) => set('reorderPoint', e.target.value)} className={inputClass} inputMode="numeric" />
                </Field>
                <Field label="Reorder quantity" htmlFor="p-roq" error={errors.reorderQty}>
                  <input id="p-roq" value={form.reorderQty} onChange={(e) => set('reorderQty', e.target.value)} className={inputClass} inputMode="numeric" />
                </Field>
              </>
            }
          </div>
        </section>
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Drawer>);

}
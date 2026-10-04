/**
 * Money is always stored as integer cents (LKR). Floating point is only used
 * at the very edge for display formatting, never for arithmetic on stored values.
 */

const whole = new Intl.NumberFormat('en-LK', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface FormatOptions {
  decimals?: boolean;
  compact?: boolean;
  signed?: boolean;
}

export function formatMoney(cents: number, options: FormatOptions = {}): string {
  const { decimals = false, compact = false, signed = false } = options;
  const negative = cents < 0;
  const abs = Math.abs(cents);
  let body: string;
  if (compact && abs >= 100_000_000) {
    body = `${(abs / 100_000_000).toFixed(abs >= 1_000_000_000 ? 1 : 2)}M`;
  } else if (compact && abs >= 100_000) {
    body = `${whole.format(Math.round(abs / 100_000))}K`;
  } else if (decimals) {
    body = `${decimal.format(Math.floor(abs / 100))}`.replace(/\.00$/, '') + `.${String(abs % 100).padStart(2, '0')}`;
  } else {
    body = whole.format(Math.round(abs / 100));
  }
  const sign = negative ? '−' : signed && cents > 0 ? '+' : '';
  return `${sign}Rs ${body}`;
}

/** Parses user input such as "12,500.50" into integer cents without float math. */
export function parseMoneyInput(value: string): number | null {
  const clean = value.replace(/[,\s]/g, '').replace(/^rs\.?/i, '');
  if (clean === '') return null;
  if (!/^\d+(\.\d{0,2})?$/.test(clean)) return null;
  const [rupees, cents = ''] = clean.split('.');
  return parseInt(rupees, 10) * 100 + parseInt(`${cents}00`.slice(0, 2), 10);
}

export function centsToInput(cents: number): string {
  const rupees = Math.floor(cents / 100);
  const rest = cents % 100;
  return rest === 0 ? String(rupees) : `${rupees}.${String(rest).padStart(2, '0')}`;
}

export function rupeesToCents(rupees: number): number {
  return Math.round(rupees * 100);
}

export function percentOf(cents: number, bps: number): number {
  return Math.round(cents * bps / 10000);
}

export function marginPct(revenue: number, cost: number): number | null {
  if (revenue <= 0) return null;
  return (revenue - cost) / revenue * 100;
}
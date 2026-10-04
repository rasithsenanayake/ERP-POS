let counter = 0;

export function createId(prefix: string): string {
  counter += 1;
  return `${prefix}_${counter.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function sequenceLabel(prefix: string, value: number, pad = 6): string {
  return `${prefix}-${String(value).padStart(pad, '0')}`;
}

export function referenceId(): string {
  return `REF-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}
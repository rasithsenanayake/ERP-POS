import { useCallback, useState } from 'react';

export interface CartLine {
  variantId: string;
  quantity: number;
}

export function usePosCart() {
  const [lines, setLines] = useState<CartLine[]>([]);

  const add = useCallback((variantId: string, max: number) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.variantId === variantId);
      if (existing) return prev.map((l) => l.variantId === variantId ? { ...l, quantity: Math.min(max, l.quantity + 1) } : l);
      return max > 0 ? [...prev, { variantId, quantity: 1 }] : prev;
    });
  }, []);

  const setQuantity = useCallback((variantId: string, quantity: number) => {
    setLines((prev) => quantity <= 0 ? prev.filter((l) => l.variantId !== variantId) : prev.map((l) => l.variantId === variantId ? { ...l, quantity } : l));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  return { lines, add, setQuantity, clear };
}
import { useCallback, useEffect, useRef, useState } from 'react';
import { useBackend } from '../contexts/BackendContext';
import { createId } from '../utils/ids';

type Updater<T> = T | ((prev: T) => T);

/**
 * State that survives navigation and refresh in the current browser session.
 */
export function usePersistentState<T>(key: string, seed: T | (() => T)): [T, (next: Updater<T>) => void] {
  const { store } = useBackend();
  const origin = useRef(createId('ps')).current;
  const [value, setValue] = useState<T>(() => {
    const stored = store.peek<T>(key);
    if (stored !== undefined) return stored;
    const initial = typeof seed === 'function' ? (seed as () => T)() : seed;
    store.set(key, initial, origin);
    return initial;
  });
  const ref = useRef(value);
  ref.current = value;

  useEffect(
    () =>
    store.subscribe((changedKey, next, from) => {
      if (changedKey !== key || from === origin) return;
      ref.current = next as T;
      setValue(next as T);
    }),
    [store, key, origin]
  );

  const update = useCallback(
    (next: Updater<T>) => {
      const resolved = typeof next === 'function' ? (next as (prev: T) => T)(ref.current) : next;
      if (Object.is(resolved, ref.current)) return;
      ref.current = resolved;
      setValue(resolved);
      store.set(key, resolved, origin);
    },
    [store, key, origin]
  );

  return [value, update];
}

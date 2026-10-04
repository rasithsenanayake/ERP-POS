import { ComponentType, lazy, LazyExoticComponent } from 'react';

/** Loads a page (named export) only when its route is first visited. */
export function lazyPage<M, K extends keyof M>(loader: () => Promise<M>, name: K): LazyExoticComponent<ComponentType> {
  return lazy(async () => {
    const module = await loader();
    return { default: module[name] as unknown as ComponentType };
  });
}
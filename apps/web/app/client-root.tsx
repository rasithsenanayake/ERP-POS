'use client';

import dynamic from 'next/dynamic';

const ErpApp = dynamic(() => import('../src/client/App').then((module) => module.App), {
  ssr: false,
  loading: () => (
    <main className="flex min-h-screen items-center justify-center bg-canvas text-sm text-muted">
      Loading ERP workspace…
    </main>
  )
});

export function ClientRoot() {
  return <ErpApp />;
}

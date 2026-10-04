import type { Metadata } from 'next';
import '../src/client/index.css';

export const metadata: Metadata = {
  title: 'Business OS | ERP & POS',
  description: 'Self-hosted ERP and point of sale workspace.',
  icons: { icon: '/favicon.svg' }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

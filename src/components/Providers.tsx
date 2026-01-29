'use client';

import { ClientProvider } from '@/lib/context/ClientContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClientProvider>
      {children}
    </ClientProvider>
  );
}

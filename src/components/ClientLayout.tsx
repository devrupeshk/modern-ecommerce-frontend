'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';
import CartDrawer from './CartDrawer';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const [cartOpen, setCartOpen] = useState(false);
  const pathname = usePathname();
  const isAdminPath = pathname.startsWith('/admin');
  const isDashboardPath = pathname.startsWith('/dashboard');

  if (isAdminPath || isDashboardPath) {
    return (
      <div className="flex min-h-screen bg-brand-bg text-brand-fg">
        <main className="flex-1 w-full flex flex-col">
          {children}
        </main>
        <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-brand-bg text-brand-fg">
      <Navbar onCartToggle={() => setCartOpen(true)} />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col">
        {children}
      </main>

      <Footer />

      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { apiRequest } from '../services/api';

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  // Prevent QueryClient state sharing across SSR requests
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  const initializeCart = useCartStore((state) => state.initializeCart);
  const { setUser, setLoading } = useAuthStore();

  // Initialize auth session and cart state on every page load
  useEffect(() => {
    initializeCart();

    // Verify session via HTTP-only cookie on every page mount.
    // This must live here (not just in Navbar) because dashboard/admin
    // pages bypass the Navbar in ClientLayout.
    const verifySession = async () => {
      try {
        const response = await apiRequest('/auth/me');
        if (response.success && response.user) {
          setUser(response.user);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, [initializeCart, setUser, setLoading]);

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'bg-neutral-900 text-white rounded-lg text-sm border border-neutral-800 shadow-xl',
          duration: 3000,
          style: {
            background: '#0F172A',
            color: '#F8FAFC',
            border: '1px solid #334155',
          },
        }}
      />
      {children}
    </QueryClientProvider>
  );
}

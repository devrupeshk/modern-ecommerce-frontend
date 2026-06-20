'use client';

import React, { useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../../services/api';
import { Check, CreditCard, ArrowRight } from 'lucide-react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') || 'unknown';

  // Fetch Order details
  const { data: orderData, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => apiRequest(`/orders/${orderId}`),
    enabled: orderId !== 'unknown',
  });

  const order = orderData?.order;

  // Format delivery date range based on order placement date
  const getDeliveryEstimate = (createdAtString?: string, method?: string) => {
    const createdDate = createdAtString ? new Date(createdAtString) : new Date();

    const formatEstimateDate = (date: Date) => {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      });
    };

    if (method === 'Express') {
      const d1 = new Date(createdDate);
      d1.setDate(createdDate.getDate() + 1);
      const d2 = new Date(createdDate);
      d2.setDate(createdDate.getDate() + 2);
      return `${formatEstimateDate(d1)} - ${formatEstimateDate(d2)}`;
    } else {
      const d1 = new Date(createdDate);
      d1.setDate(createdDate.getDate() + 3);
      const d2 = new Date(createdDate);
      d2.setDate(createdDate.getDate() + 5);
      return `${formatEstimateDate(d1)} - ${formatEstimateDate(d2)}`;
    }
  };

  const deliveryEstimate = getDeliveryEstimate(order?.createdAt, order?.deliveryMethod);
  const shippingCost = order?.deliveryMethod === 'Express' ? 15 : 0;
  const subtotal = order?.products?.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0) || 0;
  const tax = Math.max(0, (order?.totalAmount || 0) - subtotal - shippingCost);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="h-10 w-10 border-4 border-[#6366f1] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-[#c7c4d7]/60 font-light">Retrieving order details...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center text-center py-10 max-w-2xl mx-auto space-y-8">
      {/* Pulse circle checkmark */}
      <div className="h-16 w-16 bg-[#10b981]/15 rounded-full border border-[#10b981]/30 flex items-center justify-center relative">
        <div className="absolute inset-0 bg-[#10b981]/10 rounded-full animate-ping scale-110" />
        <div className="h-11 w-11 bg-[#10b981] rounded-full flex items-center justify-center shadow-lg shadow-[#10b981]/35">
          <Check size={20} className="text-white stroke-[3px]" />
        </div>
      </div>

      {/* Heading details */}
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold uppercase tracking-tight text-white leading-tight">Thank you for your order</h1>
        <p className="text-xs text-[#c7c4d7]/60 font-medium uppercase tracking-widest">
          Order confirmation #AUR-{orderId ? orderId.substring(orderId.length - 5).toUpperCase() : '83921'}
        </p>
      </div>

      {/* Details Box Card */}
      <div className="w-full bg-[#1b1b23]/40 border border-[#2e2e3a] rounded-2xl p-6 sm:p-8 space-y-6 text-left shadow-2xl shadow-black/40">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
          {/* Delivery estimate */}
          <div className="space-y-1.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-[#c7c4d7]/50">Delivery Estimate</span>
            <p className="text-xs font-bold text-white">{deliveryEstimate}</p>
          </div>

          {/* Shipping address */}
          <div className="space-y-1.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-[#c7c4d7]/50">Shipping Address</span>
            <p className="text-xs font-light text-white leading-relaxed">
              {order?.shippingAddress?.street}
              <br />
              {order?.shippingAddress?.city}, {order?.shippingAddress?.state} {order?.shippingAddress?.postalCode}
            </p>
          </div>

          {/* Payment Method */}
          <div className="space-y-1.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-[#c7c4d7]/50">Payment Method</span>
            <div className="flex items-center gap-2 text-xs text-white">
              <CreditCard size={14} className="text-[#c7c4d7]/70" />
              <span className="font-light">Visa ending in 4242</span>
            </div>
          </div>

          {/* Total amount */}
          <div className="space-y-1.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-[#c7c4d7]/50">Total</span>
            <p className="text-xl font-black text-white">${(order?.totalAmount || 0).toFixed(2)}</p>
          </div>

        </div>

        {/* Pricing breakdown list */}
        <div className="border-t border-[#2e2e3a]/40 pt-6 space-y-3.5 text-xs">
          <div className="flex justify-between text-[#c7c4d7]/70">
            <span className="font-light">Subtotal</span>
            <span className="font-semibold text-white">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[#c7c4d7]/70">
            <span className="font-light">Shipping</span>
            <span className="font-semibold text-white">{shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`}</span>
          </div>
          <div className="flex justify-between text-[#c7c4d7]/70">
            <span className="font-light">Estimated Tax</span>
            <span className="font-semiboldtext-white">${tax.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Interactive buttons */}
      <div className="flex flex-col gap-3.5 w-full max-w-sm pt-2">
        <Link
          href="/dashboard"
          className="w-full py-4 text-center text-xs font-black uppercase tracking-widest bg-[#6366f1] hover:bg-[#818cf8] text-white rounded-xl shadow-lg shadow-[#6366f1]/25 hover:shadow-[#6366f1]/40 transition-all flex items-center justify-center gap-2"
        >
          Track Order
        </Link>
        <Link
          href="/catalog"
          className="w-full py-3.5 text-center text-xs font-black uppercase tracking-widest border border-[#2e2e3a] hover:border-white/30 text-white rounded-xl hover:bg-white/5 transition-all"
        >
          Continue Shopping
        </Link>
      </div>

      {/* Support link */}
      <p className="text-[11px] text-[#c7c4d7]/50 font-medium">
        Need help? <Link href="#" className="text-[#a5b4fc] hover:underline font-bold transition">Contact our support team</Link>
      </p>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-20">
        <div className="h-10 w-10 border-4 border-[#6366f1] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}

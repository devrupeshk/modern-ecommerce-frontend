'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { apiRequest } from '../../services/api';
import {
  MapPin,
  Truck,
  CreditCard,
  ShoppingBag,
  Lock,
  Leaf,
  Check
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getCartTotal, clearCart } = useCartStore();
  const orderPlaced = React.useRef(false);
  const { user, isAuthenticated } = useAuthStore();

  // Form states
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [phone, setPhone] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'Standard' | 'Express'>('Standard');

  // Payment state
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCVC, setCardCVC] = useState('123');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load user saved default address if available
  useEffect(() => {
    if (items.length === 0) {
      if (!orderPlaced.current) {
        toast.error('Your cart is empty');
        router.push('/catalog');
      }
      return;
    }

    if (isAuthenticated && user) {
      setEmail(user.email || '');
      if (user.name) {
        const parts = user.name.split(' ');
        setFirstName(parts[0] || '');
        setLastName(parts.slice(1).join(' ') || '');
      }

      if (user.addresses && user.addresses.length > 0) {
        const defaultAddr = user.addresses.find(a => a.isDefault) || user.addresses[0];
        setAddressLine1(defaultAddr.street || '');
        setCity(defaultAddr.city || '');
        setState(defaultAddr.state || '');
        setZipCode(defaultAddr.postalCode || '');
      }
    }
  }, [isAuthenticated, user, items, router]);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !firstName || !lastName || !addressLine1 || !city || !state || !zipCode) {
      toast.error('Please complete all shipping address and contact fields');
      return;
    }

    if (!cardNumber || !cardExpiry || !cardCVC) {
      toast.error('Please fill in card details');
      return;
    }

    setIsSubmitting(true);
    try {
      if (!isAuthenticated) {
        toast.error('Please login to place your order');
        router.push('/login?redirect=/checkout');
        return;
      }

      const street = addressLine2 ? `${addressLine1}, ${addressLine2}` : addressLine1;

      const checkoutData = {
        items: items.map(item => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          selectedSize: item.selectedSize,
          selectedColor: item.selectedColor,
        })),
        shippingAddress: {
          street,
          city,
          state,
          postalCode: zipCode,
          country: 'United States',
        },
        deliveryMethod,
      };

      const res = await apiRequest('/orders/checkout', {
        method: 'POST',
        data: checkoutData,
      });

      if (res.success) {
        toast.success('Order placed successfully!');
        orderPlaced.current = true;
        clearCart();
        router.push(`/checkout/success?orderId=${res.orderId}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to place order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const subtotal = getCartTotal();
  const shippingCost = deliveryMethod === 'Express' ? 15 : 0;
  const estimatedTax = subtotal * 0.08;
  const total = subtotal + shippingCost + estimatedTax;

  return (
    <div className="min-h-screen bg-[#0d0e14] text-[#e3e1ec] py-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Sections */}
        <form onSubmit={handlePlaceOrder} className="lg:col-span-7 space-y-6">
          {/* Contact Section */}
          <div className="bg-[#1b1b23]/40 border border-[#2e2e3a] rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-baseline">
              <h2 className="text-sm font-extrabold uppercase tracking-widest text-white">Contact</h2>
              {!isAuthenticated && (
                <Link href="/login?redirect=/checkout" className="text-[11px] text-[#a5b4fc] hover:underline font-bold transition">
                  Already have an account? Log in
                </Link>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-[#c7c4d7]/70">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 text-xs bg-[#08080c] border border-[#2e2e3a]/80 rounded-xl focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1]/30 placeholder:text-[#c7c4d7]/30 text-white transition-all font-light"
                placeholder="email@example.com"
              />
            </div>
          </div>

          {/* Shipping Address Section */}
          <div className="bg-[#1b1b23]/40 border border-[#2e2e3a] rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-extrabold uppercase tracking-widest text-white flex items-center gap-2">
              <MapPin size={14} className="text-[#a5b4fc]" /> Shipping Address
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-[#c7c4d7]/70">First Name</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-3 text-xs bg-[#08080c] border border-[#2e2e3a]/80 rounded-xl focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1]/30 placeholder:text-[#c7c4d7]/30 text-white transition-all font-light"
                  placeholder="First Name"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-[#c7c4d7]/70">Last Name</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-3 text-xs bg-[#08080c] border border-[#2e2e3a]/80 rounded-xl focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1]/30 placeholder:text-[#c7c4d7]/30 text-white transition-all font-light"
                  placeholder="Last Name"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-[#c7c4d7]/70">Address Line 1</label>
              <input
                type="text"
                required
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                className="w-full px-4 py-3 text-xs bg-[#08080c] border border-[#2e2e3a]/80 rounded-xl focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1]/30 placeholder:text-[#c7c4d7]/30 text-white transition-all font-light"
                placeholder="Street address or P.O. Box"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-[#c7c4d7]/70">Address Line 2 (Optional)</label>
              <input
                type="text"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                className="w-full px-4 py-3 text-xs bg-[#08080c] border border-[#2e2e3a]/80 rounded-xl focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1]/30 placeholder:text-[#c7c4d7]/30 text-white transition-all font-light"
                placeholder="Apartment, suite, unit, building, floor, etc."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-[#c7c4d7]/70">City</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-3 text-xs bg-[#08080c] border border-[#2e2e3a]/80 rounded-xl focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1]/30 placeholder:text-[#c7c4d7]/30 text-white transition-all font-light"
                  placeholder="City"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-[#c7c4d7]/70">State</label>
                <input
                  type="text"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-4 py-3 text-xs bg-[#08080c] border border-[#2e2e3a]/80 rounded-xl focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1]/30 placeholder:text-[#c7c4d7]/30 text-white transition-all font-light"
                  placeholder="State"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-[#c7c4d7]/70">ZIP Code</label>
                <input
                  type="text"
                  required
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  className="w-full px-4 py-3 text-xs bg-[#08080c] border border-[#2e2e3a]/80 rounded-xl focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1]/30 placeholder:text-[#c7c4d7]/30 text-white transition-all font-light"
                  placeholder="ZIP Code"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-[#c7c4d7]/70">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 text-xs bg-[#08080c] border border-[#2e2e3a]/80 rounded-xl focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1]/30 placeholder:text-[#c7c4d7]/30 text-white transition-all font-light"
                placeholder="Phone number"
              />
            </div>
          </div>

          {/* Delivery Method Section */}
          <div className="bg-[#1b1b23]/40 border border-[#2e2e3a] rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-extrabold uppercase tracking-widest text-white flex items-center gap-2">
              <Truck size={14} className="text-[#a5b4fc]" /> Delivery Method
            </h2>

            <div className="space-y-3">
              {/* Standard option */}
              <button
                type="button"
                onClick={() => setDeliveryMethod('Standard')}
                className={`w-full p-4 rounded-xl border text-left flex justify-between items-center transition cursor-pointer ${deliveryMethod === 'Standard'
                  ? 'border-[#6366f1] bg-[#6366f1]/5 shadow-lg shadow-[#6366f1]/5'
                  : 'border-[#2e2e3a] bg-[#1b1b23]/20 hover:border-[#464554]'
                  }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`h-4.5 w-4.5 rounded-full border flex items-center justify-center transition-all ${deliveryMethod === 'Standard' ? 'border-[#6366f1] bg-[#6366f1]' : 'border-[#464554]'
                    }`}>
                    {deliveryMethod === 'Standard' && <Check size={10} className="text-white font-bold" />}
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-white uppercase tracking-wider">Standard Shipping</p>
                    <p className="text-[10px] text-[#c7c4d7]/60">3-5 Business Days</p>
                  </div>
                </div>
                <span className="text-xs font-extrabold text-white uppercase">Free</span>
              </button>

              {/* Express option */}
              <button
                type="button"
                onClick={() => setDeliveryMethod('Express')}
                className={`w-full p-4 rounded-xl border text-left flex justify-between items-center transition cursor-pointer ${deliveryMethod === 'Express'
                  ? 'border-[#6366f1] bg-[#6366f1]/5 shadow-lg shadow-[#6366f1]/5'
                  : 'border-[#2e2e3a] bg-[#1b1b23]/20 hover:border-[#464554]'
                  }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`h-4.5 w-4.5 rounded-full border flex items-center justify-center transition-all ${deliveryMethod === 'Express' ? 'border-[#6366f1] bg-[#6366f1]' : 'border-[#464554]'
                    }`}>
                    {deliveryMethod === 'Express' && <Check size={10} className="text-white font-bold" />}
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-white uppercase tracking-wider">Express Shipping</p>
                    <p className="text-[10px] text-[#c7c4d7]/60">Next Day Delivery</p>
                  </div>
                </div>
                <span className="text-xs font-extrabold text-white uppercase">$15.00</span>
              </button>
            </div>
          </div>

          {/* Payment Section */}
          <div className="bg-[#1b1b23]/40 border border-[#2e2e3a] rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-extrabold uppercase tracking-widest text-white flex items-center gap-2">
                <CreditCard size={14} className="text-[#a5b4fc]" /> Payment
              </h2>
              {/* Payment brand logos */}
              <div className="flex gap-2">
                <span className="text-[10px] font-black text-[#c7c4d7]/40 border border-[#2e2e3a] px-2 py-1 rounded bg-[#13121a]">VISA</span>
                <span className="text-[10px] font-black text-[#c7c4d7]/40 border border-[#2e2e3a] px-2 py-1 rounded bg-[#13121a]">MC</span>
                <span className="text-[10px] font-black text-[#c7c4d7]/40 border border-[#2e2e3a] px-2 py-1 rounded bg-[#13121a]">AMEX</span>
                <span className="text-[10px] font-black text-[#c7c4d7]/40 border border-[#2e2e3a] px-2 py-1 rounded bg-[#13121a]">STRIPE</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-[#c7c4d7]/70">Card Number</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full pl-4 pr-11 py-3 text-xs bg-[#08080c] border border-[#2e2e3a]/80 rounded-xl focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1]/30 placeholder:text-[#c7c4d7]/30 text-white transition-all font-light"
                    placeholder="0000 0000 0000 0000"
                  />
                  <Lock size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#c7c4d7]/40" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-[#c7c4d7]/70">Expiry Date</label>
                  <input
                    type="text"
                    required
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="w-full px-4 py-3 text-xs bg-[#08080c] border border-[#2e2e3a]/80 rounded-xl focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1]/30 placeholder:text-[#c7c4d7]/30 text-white transition-all font-light"
                    placeholder="MM / YY"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-[#c7c4d7]/70">CVC</label>
                  <input
                    type="text"
                    required
                    value={cardCVC}
                    onChange={(e) => setCardCVC(e.target.value)}
                    className="w-full px-4 py-3 text-xs bg-[#08080c] border border-[#2e2e3a]/80 rounded-xl focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1]/30 placeholder:text-[#c7c4d7]/30 text-white transition-all font-light"
                    placeholder="123"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* CTA & security details at the bottom of the left column */}
          <div className="space-y-4 pt-4">
            <button
              type="submit"
              disabled={isSubmitting || items.length === 0}
              className="w-full py-4 bg-[#6366f1] hover:bg-[#818cf8] text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-[#6366f1]/20 hover:shadow-[#6366f1]/35 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSubmitting ? 'Processing...' : 'Complete Order'}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#c7c4d7]/40 uppercase tracking-widest font-bold">
              <Lock size={12} className="text-[#c7c4d7]/40" />
              <span>Secure 256-bit SSL encrypted payment</span>
            </div>
          </div>
        </form>

        {/* Right Column: Order Summary & Sustainability */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          <div className="bg-[#1b1b23]/40 border border-[#2e2e3a] rounded-2xl p-6 space-y-5">
            <h2 className="text-sm font-extrabold uppercase tracking-widest text-white border-b border-[#2e2e3a]/40 pb-3">
              Order Summary
            </h2>

            {/* Product items */}
            <div className="divide-y divide-[#2e2e3a]/30 max-h-[280px] overflow-y-auto pr-1 scrollbar-none">
              {items.map((item) => (
                <div key={`${item.productId}-${item.selectedSize}-${item.selectedColor}`} className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0">
                  <div className="relative h-16 w-16 rounded-xl overflow-hidden border border-[#2e2e3a]/80 bg-[#1b1b23]/40 shrink-0">
                    <img src={item.image} alt="" className="h-full w-full object-cover" />
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#6366f1] text-[10px] font-black text-white flex items-center justify-center border border-[#0d0e14]">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-white truncate uppercase tracking-wider">{item.name}</h4>
                    <p className="text-[10px] text-[#c7c4d7]/60 mt-1">
                      {item.selectedColor ? `Color: ${item.selectedColor}` : ''}
                      {item.selectedSize ? ` | Size: ${item.selectedSize}` : ''}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-white">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Discount Code Input */}
            <div className="flex gap-2 pt-4 border-t border-[#2e2e3a]/40">
              <input
                type="text"
                placeholder="Discount code"
                className="flex-1 px-4 py-3 text-xs bg-[#08080c] border border-[#2e2e3a]/80 rounded-xl focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1]/30 placeholder:text-[#c7c4d7]/30 text-white transition-all font-light"
              />
              <button
                type="button"
                className="px-5 py-3 text-xs font-bold bg-[#1b1b23] border border-[#2e2e3a] hover:bg-[#292932] text-white rounded-xl transition cursor-pointer"
              >
                Apply
              </button>
            </div>

            {/* Pricing details */}
            <div className="space-y-3.5 pt-4 border-t border-[#2e2e3a]/40 text-xs">
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
                <span className="font-semibold text-white">${estimatedTax.toFixed(2)}</span>
              </div>

              <div className="border-t border-[#2e2e3a]/60 pt-4 flex justify-between items-baseline">
                <span className="text-xs font-extrabold uppercase tracking-widest text-white">Total</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-[9px] text-[#c7c4d7]/40 font-bold uppercase">USD</span>
                  <span className="text-2xl font-black text-white">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sustainability Card */}
          <div className="bg-[#1b1b23]/40 border border-[#2e2e3a] rounded-2xl p-5 space-y-2.5">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#a5b4fc]">
              <Leaf size={13} className="text-[#a5b4fc] shrink-0" />
              <span>Sustainability</span>
            </div>
            <p className="text-[11px] text-[#c7c4d7]/70 leading-relaxed font-light">
              Your {items[0]?.name || 'order'} is shipped in 100% recycled carbon-neutral packaging. Every purchase plants a tree in our protected forest.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import { useCartStore } from '../store/cartStore';
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, updateQuantity, removeItem, getCartTotal } = useCartStore();

  const handleQtyChange = (
    productId: string,
    currentQty: number,
    delta: number,
    size?: string,
    color?: string
  ) => {
    updateQuantity(productId, currentQty + delta, size, color);
  };

  const handleRemove = (productId: string, size?: string, color?: string) => {
    removeItem(productId, size, color);
  };

  const subtotal = getCartTotal();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Cart Panel Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 240 }}
            className="fixed bottom-0 right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-[#0d0e14]/95 backdrop-blur-xl shadow-2xl shadow-black/80 border-l border-[#2e2e3a]/80"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#2e2e3a]/60 px-6 py-4.5">
              <div className="flex items-center space-x-2.5">
                <ShoppingBag size={16} className="text-[#6366f1]" />
                <h2 className="text-xs font-black uppercase tracking-[0.15em] text-white">
                  Your Cart
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-white/8 text-[#c7c4d7] hover:text-white transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 scrollbar-none">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 rounded-2xl bg-[#6366f1]/10 border border-[#6366f1]/20 text-[#6366f1] flex items-center justify-center mb-4">
                    <ShoppingBag size={24} />
                  </div>
                  <p className="text-sm font-bold text-white">Your cart is empty</p>
                  <p className="text-xs text-[#c7c4d7]/70 mt-1 max-w-[200px]">Add items from the store to get started.</p>
                  <button
                    onClick={onClose}
                    className="mt-6 px-5 py-2.5 text-xs font-bold bg-[#6366f1] hover:bg-[#818cf8] text-white rounded-xl shadow-lg shadow-[#6366f1]/25 transition cursor-pointer"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={`${item.productId}-${item.selectedSize}-${item.selectedColor}`}
                    className="flex items-start gap-4 border-b border-[#2e2e3a]/40 pb-4"
                  >
                    <img
                      src={item.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e'}
                      alt={item.name}
                      className="h-20 w-20 rounded-xl object-cover bg-[#13121a] border border-[#2e2e3a]/80"
                    />
                    <div className="flex-1 space-y-1.5 min-w-0">
                      <div className="flex justify-between gap-3">
                        <Link
                          href={`/catalog/${item.slug}`}
                          onClick={onClose}
                          className="text-xs font-bold text-white hover:text-[#a5b4fc] transition truncate"
                        >
                          {item.name}
                        </Link>
                        <span className="text-xs font-black text-white shrink-0">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                      
                      {/* Size & Color Tags */}
                      <div className="flex flex-wrap gap-1.5 text-[9px] font-semibold text-[#c7c4d7]">
                        {item.selectedSize && (
                          <span className="bg-[#1b1b23] px-2 py-0.5 rounded-lg border border-[#2e2e3a]">
                            Size: {item.selectedSize}
                          </span>
                        )}
                        {item.selectedColor && (
                          <span className="bg-[#1b1b23] px-2 py-0.5 rounded-lg border border-[#2e2e3a]">
                            Color: {item.selectedColor}
                          </span>
                        )}
                      </div>
                      
                      {/* Quantity Modifier and Trash Button */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center border border-[#2e2e3a] rounded-xl bg-[#1b1b23]/50 overflow-hidden">
                          <button
                            onClick={() => handleQtyChange(item.productId, item.quantity, -1, item.selectedSize, item.selectedColor)}
                            className="p-1.5 hover:bg-white/5 text-[#c7c4d7] hover:text-white transition cursor-pointer"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="px-3 text-xs font-bold text-white select-none">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleQtyChange(item.productId, item.quantity, 1, item.selectedSize, item.selectedColor)}
                            className="p-1.5 hover:bg-white/5 text-[#c7c4d7] hover:text-white transition cursor-pointer"
                            disabled={item.quantity >= item.stock}
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        <button
                          onClick={() => handleRemove(item.productId, item.selectedSize, item.selectedColor)}
                          className="p-1.5 text-[#ffb4ab]/80 hover:text-white hover:bg-[#ffb4ab]/10 rounded-lg transition cursor-pointer"
                          aria-label="Remove item"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Summary / Checkout */}
            {items.length > 0 && (
              <div className="border-t border-[#2e2e3a] bg-[#1b1b23]/40 backdrop-blur-md px-6 py-6 space-y-4 relative z-10">
                <div className="flex justify-between items-center text-xs font-medium">
                  <span className="text-[#c7c4d7]">Subtotal</span>
                  <span className="text-white font-black text-base">${subtotal.toFixed(2)}</span>
                </div>
                <p className="text-[10px] text-[#c7c4d7]/60 leading-relaxed">
                  Shipping, taxes, and discounts calculated at checkout.
                </p>
                <div className="grid grid-cols-1 gap-2 pt-2">
                  <Link
                    href="/checkout"
                    onClick={onClose}
                    className="w-full py-3.5 text-center text-xs font-bold bg-[#6366f1] hover:bg-[#818cf8] text-white rounded-xl shadow-lg shadow-[#6366f1]/25 hover:shadow-[0_0_20px_rgba(99,102,241,0.35)] transition cursor-pointer"
                  >
                    Proceed to Checkout
                  </Link>
                  <button
                    onClick={onClose}
                    className="w-full py-3 text-center text-xs font-bold border border-[#2e2e3a] text-[#c7c4d7] hover:text-white hover:bg-white/5 rounded-xl transition cursor-pointer"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

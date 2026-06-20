'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../services/api';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { Product, Category } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ShoppingBag,
  Heart,
  Star,
  ChevronDown,
  Zap,
  BatteryCharging,
  Wifi,
  Volume2,
  Shield,
  RotateCcw,
  TrendingUp,
  Sparkles,
  Play,
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ─── Helpers ─── */
function renderStars(rating: number) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={10}
          className={n <= Math.round(rating) ? 'fill-[#f59e0b] text-[#f59e0b]' : 'text-[#464554] fill-[#464554]'}
        />
      ))}
    </span>
  );
}

function Badge({ children, variant = 'purple' }: { children: React.ReactNode; variant?: 'purple' | 'green' | 'orange' }) {
  const styles = {
    purple: 'bg-[#6366f1]/15 text-[#a5b4fc] border-[#6366f1]/20',
    green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${styles[variant]}`}>
      {children}
    </span>
  );
}

/* ─── Category metadata ─── */
const CATEGORY_META: Record<string, { label: string; icon: string; desc: string; bg: string }> = {
  audio: { label: 'Audio', icon: '🎧', desc: 'Headphones & Speakers', bg: 'from-violet-600/20 to-purple-600/10' },
  devices: { label: 'Devices', icon: '📱', desc: 'Smart Devices', bg: 'from-blue-600/20 to-cyan-600/10' },
  accessories: { label: 'Accessories', icon: '🔌', desc: 'Cables & Docks', bg: 'from-amber-600/20 to-orange-600/10' },
  all: { label: 'All', icon: '✦', desc: 'Everything', bg: 'from-[#6366f1]/20 to-purple-600/10' },
};

/* ─── Static fallback products ─── */
const FALLBACK_PRODUCTS = [
  { _id: 'p1', name: 'Aura One Headphones', slug: 'aura-one-headphones', price: 349, rating: 4.8, numReviews: 130, stock: 12, images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop'], category: { _id: 'c1', name: 'Audio', slug: 'audio' }, sizes: [], colors: [] },
  { _id: 'p2', name: 'Aura Buds Pro', slug: 'aura-buds-pro', price: 199, rating: 4.6, numReviews: 88, stock: 8, images: ['https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=600&auto=format&fit=crop'], category: { _id: 'c1', name: 'Audio', slug: 'audio' }, sizes: [], colors: [] },
  { _id: 'p3', name: 'Aura Power Dock', slug: 'aura-power-dock', price: 89, rating: 4.3, numReviews: 45, stock: 20, images: ['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&auto=format&fit=crop'], category: { _id: 'c2', name: 'Accessories', slug: 'accessories' }, sizes: [], colors: [] },
  { _id: 'p4', name: 'Aura Studio Mixer', slug: 'aura-studio-mixer', price: 279, rating: 4.7, numReviews: 62, stock: 5, images: ['https://images.unsplash.com/photo-1598653222000-6b7b7a552625?w=600&auto=format&fit=crop'], category: { _id: 'c1', name: 'Audio', slug: 'audio' }, sizes: [], colors: [] },
  { _id: 'p5', name: 'Aura Smart Speaker', slug: 'aura-smart-speaker', price: 159, rating: 4.4, numReviews: 94, stock: 15, images: ['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&auto=format&fit=crop'], category: { _id: 'c1', name: 'Audio', slug: 'audio' }, sizes: [], colors: [] },
  { _id: 'p6', name: 'Aura USB-C Hub', slug: 'aura-usb-hub', price: 59, rating: 4.2, numReviews: 37, stock: 30, images: ['https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop'], category: { _id: 'c2', name: 'Accessories', slug: 'accessories' }, sizes: [], colors: [] },
];

export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const addItem = useCartStore((state) => state.addItem);
  const { user, setUser } = useAuthStore();

  /* ─── Data Fetching ─── */
  const { data: featuredData, isLoading: featuredLoading } = useQuery({
    queryKey: ['featuredProducts'],
    queryFn: () => apiRequest('/products/featured'),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiRequest('/categories'),
  });

  const { data: allProductsData, isLoading: productsLoading } = useQuery({
    queryKey: ['allProducts', activeCategory],
    queryFn: () => {
      const params = activeCategory !== 'all' ? `?category=${activeCategory}&limit=8` : `?limit=8`;
      return apiRequest(`/products${params}`);
    },
  });

  const { data: audioData } = useQuery({
    queryKey: ['productsAudio'],
    queryFn: () => apiRequest('/products?category=audio&limit=4'),
  });

  const { data: devicesData } = useQuery({
    queryKey: ['productsDevices'],
    queryFn: () => apiRequest('/products?category=devices&limit=4'),
  });

  const { data: accessoriesData } = useQuery({
    queryKey: ['productsAccessories'],
    queryFn: () => apiRequest('/products?category=accessories&limit=4'),
  });

  /* ─── Derived Data ─── */
  const heroProducts: Product[] = featuredData?.featured?.slice(0, 1) || [];
  const categories: Category[] = categoriesData?.categories || [];
  const allProducts: Product[] = allProductsData?.products || (activeCategory === 'all' ? FALLBACK_PRODUCTS : FALLBACK_PRODUCTS.filter(p => p.category.slug === activeCategory)) || [];

  /* ─── Actions ─── */
  const handleQuickAdd = (product: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      productId: product._id,
      name: product.name,
      slug: product.slug,
      price: product.discountPrice || product.price,
      image: product.images?.[0] || '',
      quantity: 1,
      stock: product.stock,
      selectedSize: product.sizes?.[0],
      selectedColor: product.colors?.[0]?.name,
    });
    toast.success(`${product.name} added to cart`);
  };

  const handleToggleWishlist = async (productId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { toast.error('Please sign in to save to wishlist'); return; }
    try {
      const res = await apiRequest(`/users/wishlist/${productId}`, { method: 'POST' });
      if (res.success) {
        toast.success(res.message);
        const me = await apiRequest('/auth/me');
        setUser(me.user);
      }
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    }
  };

  const scrollToProducts = () => {
    document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#0d0e14] text-[#e3e1ec] overflow-x-hidden">

      {/* ══════════════════════════════════════════════════
          HERO — Fullscreen cinematic dark headphone shot
      ══════════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative w-full min-h-[100svh] flex items-center justify-center overflow-hidden">

        {/* BG image layer */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=2070&auto=format&fit=crop"
            alt="AURA Hero"
            className="w-full h-full object-cover object-center"
            style={{ filter: 'brightness(0.25) saturate(0.7)' }}
          />
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0e14] via-[#0d0e14]/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0d0e14]/60 via-transparent to-[#0d0e14]/40" />
          {/* Ambient glow */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-[#6366f1]/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[300px] bg-violet-500/8 rounded-full blur-[100px]" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-8 flex flex-col lg:flex-row items-center justify-between gap-12 py-20">

          {/* Left text block */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl"
          >
            <div className="mb-6">
              <Badge variant="purple"><Sparkles size={10} /> New Collection 2026</Badge>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.0] tracking-tighter text-white mb-6">
              Sound,<br />
              <span className="bg-gradient-to-r from-[#a5b4fc] via-[#c4b5fd] to-[#a5b4fc] bg-clip-text text-transparent">
                redefined.
              </span><br />
              <span className="text-[#e3e1ec]/90">Pure audio,</span><br />
              <span className="text-[#e3e1ec]/60 text-4xl sm:text-5xl lg:text-6xl font-bold">zero noise.</span>
            </h1>

            <p className="text-[#c7c4d7] text-base sm:text-lg font-light leading-relaxed max-w-lg mb-10">
              Experience the pinnacle of acoustic engineering with the new AURA collection.
              Crafted for those who demand precision and silence in every note.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/catalog?category=audio"
                className="group inline-flex items-center gap-2.5 px-7 py-3.5 bg-white text-[#12131a] font-bold text-sm rounded-xl hover:bg-[#e8e8ff] transition-all shadow-2xl shadow-white/10 hover:shadow-white/20"
              >
                Shop Aura ANC
                <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <button
                onClick={scrollToProducts}
                className="inline-flex items-center gap-2.5 px-7 py-3.5 border border-white/20 text-white font-bold text-sm rounded-xl hover:bg-white/8 transition-all backdrop-blur-sm cursor-pointer"
              >
                <Play size={14} className="fill-white" /> Explore
              </button>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-8 mt-12 pt-8 border-t border-white/10">
              {[
                { value: '99.8%', label: 'Noise Cancelled' },
                { value: '60h', label: 'Battery Life' },
                { value: '50K+', label: 'Happy Customers' },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-black text-white">{stat.value}</p>
                  <p className="text-xs text-[#c7c4d7] mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right: floating product card */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="hidden lg:block relative"
          >
            <div className="relative w-[340px]">
              {/* Glow behind card */}
              <div className="absolute -inset-4 bg-[#6366f1]/20 rounded-3xl blur-2xl" />
              <div className="relative bg-[#1b1b23]/80 border border-[#2e2e3a] rounded-3xl p-5 backdrop-blur-xl shadow-2xl">
                <div className="aspect-square rounded-2xl overflow-hidden bg-[#0d0e14] mb-4">
                  <img
                    src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop"
                    alt="Featured Product"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[10px] text-[#a5b4fc] font-semibold uppercase tracking-wider mb-0.5">Best Seller</p>
                      <h3 className="text-white font-bold text-base leading-snug">Aura One Headphones</h3>
                    </div>
                    <span className="text-white font-black text-xl shrink-0">$349</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {renderStars(4.8)}
                    <span className="text-[#c7c4d7] text-[11px]">4.8 (130 reviews)</span>
                  </div>
                  <button
                    onClick={() => toast.success('Added to cart!')}
                    className="w-full mt-2 py-2.5 bg-[#6366f1] hover:bg-[#818cf8] text-white font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShoppingBag size={14} /> Add to Cart
                  </button>
                </div>
              </div>
              {/* Floating badges */}
              <div className="absolute -top-3 -right-3 bg-[#34d399] text-[#0d0e14] text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg">
                IN STOCK
              </div>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <button
          onClick={scrollToProducts}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-[#c7c4d7]/50 hover:text-white transition-colors cursor-pointer group"
        >
          <span className="text-[10px] font-semibold tracking-widest uppercase">Scroll</span>
          <ChevronDown size={18} className="animate-bounce" />
        </button>
      </section>

      {/* ══════════════════════════════════════════════════
          QUICK CATEGORY NAV LIST
      ══════════════════════════════════════════════════ */}
      <section className="w-full max-w-7xl mx-auto px-5 sm:px-8 pt-20 pb-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {Object.entries(CATEGORY_META).filter(([key]) => key !== 'all').map(([slug, meta]) => (
            <Link
              key={slug}
              href={`/catalog?category=${slug}`}
              className="group relative flex items-center justify-between p-5 bg-[#1b1b23]/40 hover:bg-[#1b1b23]/70 border border-[#2e2e3a] hover:border-[#6366f1]/40 rounded-2xl transition-all duration-300 shadow-md hover:shadow-xl hover:shadow-black/20"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#6366f1]/10 border border-[#6366f1]/20 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                  {meta.icon}
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm group-hover:text-[#a5b4fc] transition-colors">{meta.label}</h3>
                  <p className="text-[#c7c4d7]/70 text-[11px] mt-0.5">{meta.desc}</p>
                </div>
              </div>
              <ArrowRight size={15} className="text-[#c7c4d7]/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </Link>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          CATEGORY FILTER + PRODUCTS
      ══════════════════════════════════════════════════ */}
      <section id="products-section" className="w-full max-w-7xl mx-auto px-5 sm:px-8 py-20">

        {/* Section header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-[#a5b4fc] text-xs font-semibold uppercase tracking-widest mb-2">Premium Collection</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Shop by Category</h2>
          </div>
          <Link
            href="/catalog"
            className="group flex items-center gap-1.5 text-sm font-semibold text-[#c7c4d7] hover:text-white transition-colors"
          >
            View All Products
            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Category Pill Tabs */}
        <div className="flex items-center gap-2 mb-10 overflow-x-auto pb-2 scrollbar-none">
          {/* "All" tab */}
          <button
            onClick={() => setActiveCategory('all')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold border transition-all duration-200 whitespace-nowrap cursor-pointer shrink-0 ${
              activeCategory === 'all'
                ? 'bg-[#6366f1] border-[#6366f1] text-white shadow-lg shadow-[#6366f1]/25'
                : 'bg-[#1b1b23] border-[#2e2e3a] text-[#c7c4d7] hover:text-white hover:border-[#464554]'
            }`}
          >
            <span>✦</span> All Products
          </button>

          {/* Dynamic categories from API, fallback to static */}
          {(categories.length > 0 ? categories : [
            { _id: 'c1', name: 'Audio', slug: 'audio' },
            { _id: 'c2', name: 'Accessories', slug: 'accessories' },
            { _id: 'c3', name: 'Devices', slug: 'devices' },
          ] as Category[]).map((cat) => {
            const meta = CATEGORY_META[cat.slug] || { label: cat.name, icon: '◆', desc: '', bg: '' };
            return (
              <button
                key={cat._id}
                onClick={() => setActiveCategory(cat.slug)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold border transition-all duration-200 whitespace-nowrap cursor-pointer shrink-0 ${
                  activeCategory === cat.slug
                    ? 'bg-[#6366f1] border-[#6366f1] text-white shadow-lg shadow-[#6366f1]/25'
                    : 'bg-[#1b1b23] border-[#2e2e3a] text-[#c7c4d7] hover:text-white hover:border-[#464554]'
                }`}
              >
                <span>{meta.icon}</span> {meta.label}
              </button>
            );
          })}
        </div>

        {/* Product Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
          >
            {productsLoading || featuredLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-[#1b1b23] rounded-2xl overflow-hidden animate-pulse">
                    <div className="aspect-square bg-[#292932]" />
                    <div className="p-4 space-y-2.5">
                      <div className="h-3.5 bg-[#292932] rounded-full w-3/4" />
                      <div className="h-3 bg-[#292932] rounded-full w-1/2" />
                      <div className="h-8 bg-[#292932] rounded-xl mt-2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : allProducts.length === 0 ? (
              <div className="text-center py-20 text-[#c7c4d7]">
                <p className="text-4xl mb-3">🎧</p>
                <p className="font-semibold text-white">No products found</p>
                <p className="text-sm mt-1">Try a different category</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {allProducts.map((product: any, idx: number) => {
                  const isWishlisted = user?.wishlist?.includes(product._id);
                  const img = product.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop';
                  const price = product.discountPrice || product.price;

                  return (
                    <motion.article
                      key={product._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group bg-[#1b1b23] rounded-2xl overflow-hidden border border-[#2e2e3a] hover:border-[#464554] transition-all duration-300 hover:shadow-xl hover:shadow-black/40 flex flex-col"
                    >
                      {/* Image */}
                      <div className="relative aspect-square overflow-hidden bg-[#13121a]">
                        <img
                          src={img}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700"
                          style={{ '--tw-scale-x': 'var(--scale)', '--tw-scale-y': 'var(--scale)' } as any}
                        />
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#13121a]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        {/* Action buttons */}
                        <div className="absolute bottom-3 left-3 right-3 flex gap-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                          <button
                            onClick={(e) => handleQuickAdd(product, e)}
                            className="flex-1 py-2 bg-white text-[#12131a] text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 hover:bg-[#e8e8ff] transition cursor-pointer shadow-lg"
                          >
                            <ShoppingBag size={12} /> Add to Cart
                          </button>
                          <button
                            onClick={(e) => handleToggleWishlist(product._id, e)}
                            className={`p-2 rounded-lg border transition cursor-pointer ${isWishlisted ? 'bg-[#6366f1] border-[#6366f1] text-white' : 'bg-[#1b1b23]/80 border-[#464554] text-white hover:bg-[#6366f1] hover:border-[#6366f1]'}`}
                          >
                            <Heart size={14} className={isWishlisted ? 'fill-white' : ''} />
                          </button>
                        </div>

                        {/* Badges */}
                        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                          {product.discountPrice && (
                            <span className="px-2 py-0.5 bg-[#6366f1] text-white text-[10px] font-bold rounded-full">
                              SALE
                            </span>
                          )}
                          {product.stock <= 5 && product.stock > 0 && (
                            <span className="px-2 py-0.5 bg-orange-500/90 text-white text-[10px] font-bold rounded-full">
                              LOW STOCK
                            </span>
                          )}
                        </div>

                        {/* Category chip */}
                        <div className="absolute top-3 right-3">
                          <span className="px-2 py-0.5 bg-black/50 backdrop-blur-sm text-[#c7c4d7] text-[9px] font-semibold rounded-full border border-white/10">
                            {product.category?.name || 'Audio'}
                          </span>
                        </div>
                      </div>

                      {/* Details */}
                      <Link
                        href={product.slug ? `/catalog/${product.slug}` : '#'}
                        className="flex-1 flex flex-col p-4"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-bold text-white text-sm leading-snug group-hover:text-[#a5b4fc] transition-colors line-clamp-2 flex-1">
                            {product.name}
                          </h3>
                          <div className="text-right shrink-0">
                            {product.discountPrice ? (
                              <>
                                <p className="font-black text-white text-base">${product.discountPrice}</p>
                                <p className="text-[10px] text-[#c7c4d7] line-through">${product.price}</p>
                              </>
                            ) : (
                              <p className="font-black text-white text-base">${price}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 mt-auto">
                          {renderStars(product.rating || 4.5)}
                          <span className="text-[#c7c4d7] text-[10px]">{(product.rating || 4.5).toFixed(1)} ({product.numReviews || 0})</span>
                        </div>
                      </Link>
                    </motion.article>
                  );
                })}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* "Load more" / View all CTA */}
        <div className="mt-10 text-center">
          <Link
            href={activeCategory !== 'all' ? `/catalog?category=${activeCategory}` : '/catalog'}
            className="inline-flex items-center gap-2 px-8 py-3.5 border border-[#2e2e3a] text-[#c7c4d7] hover:text-white hover:border-[#464554] hover:bg-white/4 rounded-xl text-sm font-semibold transition-all"
          >
            Browse Full Catalog <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          CATEGORY-WISE PRODUCT HIGHLIGHTS
      ══════════════════════════════════════════════════ */}
      <section className="w-full max-w-7xl mx-auto px-5 sm:px-8 py-10 space-y-24">
        {[
          { key: 'audio', title: 'Premium Audio', subtitle: 'Acoustic Sound', desc: 'Over-ear headphones and smart speakers with industry-leading active noise cancellation.', queryData: audioData?.products, fallback: FALLBACK_PRODUCTS.filter(p => p.category.slug === 'audio'), labelColor: 'text-[#6366f1]' },
          { key: 'devices', title: 'Smart Devices', subtitle: 'Next-Gen Ecosystem', desc: 'Intelligent devices engineered to streamline your daily workflow and connection.', queryData: devicesData?.products, fallback: FALLBACK_PRODUCTS.filter(p => p.category.slug === 'devices'), labelColor: 'text-[#a5b4fc]' },
          { key: 'accessories', title: 'Power & Accessories', subtitle: 'Daily Essentials', desc: 'Charging docks, USB hubs, and desk mats designed with minimalist aesthetics.', queryData: accessoriesData?.products, fallback: FALLBACK_PRODUCTS.filter(p => p.category.slug === 'accessories'), labelColor: 'text-amber-400' }
        ].map((sec) => {
          const items = sec.queryData?.length > 0 ? sec.queryData : sec.fallback;
          if (items.length === 0) return null; // hide if empty

          return (
            <div key={sec.key} className="space-y-8">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-[#2e2e3a] pb-6 gap-4">
                <div>
                  <span className={`text-xs font-black uppercase tracking-widest ${sec.labelColor}`}>
                    {sec.subtitle}
                  </span>
                  <h2 className="text-3xl font-black text-white mt-1.5">{sec.title}</h2>
                  <p className="text-[#c7c4d7]/70 text-sm mt-2 max-w-xl">{sec.desc}</p>
                </div>
                <Link
                  href={`/catalog?category=${sec.key}`}
                  className="group inline-flex items-center gap-2 px-5 py-2.5 bg-[#1b1b23] border border-[#2e2e3a] hover:border-[#6366f1]/40 rounded-xl text-xs font-bold text-white transition-all shrink-0 cursor-pointer"
                >
                  View All {sec.title}
                  <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>

              {/* Grid of 4 products */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {items.slice(0, 4).map((product: any, idx: number) => {
                  const img = product.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop';
                  const isWishlisted = user?.wishlist?.includes(product._id);
                  const price = product.discountPrice || product.price;

                  return (
                    <motion.article
                      key={product._id}
                      initial={{ opacity: 0, y: 15 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.05 }}
                      className="group bg-[#1b1b23]/40 border border-[#2e2e3a] hover:border-[#6366f1]/30 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-black/50 flex flex-col"
                    >
                      {/* Image */}
                      <div className="relative aspect-square overflow-hidden bg-[#13121a] border-b border-[#2e2e3a]/40">
                        <img
                          src={img}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        
                        {/* Actions */}
                        <div className="absolute bottom-3 inset-x-3 flex gap-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                          <button
                            onClick={(e) => handleQuickAdd(product, e)}
                            className="flex-1 py-2 bg-white text-[#12131a] text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 hover:bg-[#e8e8ff] transition cursor-pointer shadow-lg"
                          >
                            <ShoppingBag size={12} /> Add to Cart
                          </button>
                          <button
                            onClick={(e) => handleToggleWishlist(product._id, e)}
                            className={`p-2 rounded-lg border transition cursor-pointer ${isWishlisted ? 'bg-[#6366f1] border-[#6366f1] text-white' : 'bg-[#1b1b23]/80 border-[#464554] text-white hover:bg-[#6366f1] hover:border-[#6366f1]'}`}
                          >
                            <Heart size={13} className={isWishlisted ? 'fill-white' : ''} />
                          </button>
                        </div>
                      </div>

                      {/* Info */}
                      <Link href={`/catalog/${product.slug}`} className="p-4 flex-1 flex flex-col justify-between hover:no-underline">
                        <div>
                          <h3 className="font-bold text-white text-sm line-clamp-2 group-hover:text-[#a5b4fc] transition-colors">
                            {product.name}
                          </h3>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-1">
                            {renderStars(product.rating || 4.5)}
                            <span className="text-[#c7c4d7] text-[10px]">({product.numReviews || 0})</span>
                          </div>
                          <span className="font-black text-white text-sm">${price}</span>
                        </div>
                      </Link>
                    </motion.article>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>

      {/* ══════════════════════════════════════════════════
          FEATURE SPLIT — "Crafted for Silence"
      ══════════════════════════════════════════════════ */}
      <section className="w-full bg-[#0d0e14] py-24 border-t border-[#2e2e3a]/60">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <Badge variant="purple"><Sparkles size={10} /> Technology</Badge>
              <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight mt-4 mb-5">
                Crafted for<br /><span className="text-[#a5b4fc]">Silence.</span>
              </h2>
              <p className="text-[#c7c4d7] text-base leading-relaxed mb-10 max-w-md">
                Our proprietary ANC technology cancels up to 99.8% of ambient noise,
                allowing you to immerse yourself in pure, undistorted sound wherever you are.
              </p>

              <div className="grid grid-cols-2 gap-6">
                {[
                  { icon: Zap, label: 'Adaptive ANC', desc: 'Real-time scanning adjusts noise cancellation on the fly.' },
                  { icon: BatteryCharging, label: '60h Battery', desc: 'Over two days of lossless audio playback per charge.' },
                  { icon: Wifi, label: 'Bluetooth 5.4', desc: 'Ultra-low latency with multipoint pairing.' },
                  { icon: Volume2, label: 'Hi-Res Audio', desc: '96kHz/32-bit certified studio-grade fidelity.' },
                ].map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="group cursor-default">
                    <div className="w-10 h-10 rounded-xl bg-[#1b1b23] border border-[#2e2e3a] group-hover:border-[#6366f1]/40 group-hover:bg-[#6366f1]/10 flex items-center justify-center mb-3 transition-all">
                      <Icon size={16} className="text-[#a5b4fc]" />
                    </div>
                    <p className="text-sm font-bold text-white mb-1">{label}</p>
                    <p className="text-[11px] text-[#c7c4d7] leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>

              <div className="mt-10">
                <Link href="/catalog?category=audio" className="group inline-flex items-center gap-2 text-sm font-semibold text-[#a5b4fc] hover:text-white transition-colors">
                  Explore Audio Collection <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </motion.div>

            {/* Right — circular image + floating cards */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.15 }}
              className="relative flex items-center justify-center"
            >
              <div className="absolute w-[420px] h-[420px] rounded-full bg-[#6366f1]/10 blur-3xl" />
              <div className="relative w-[320px] h-[320px] sm:w-[420px] sm:h-[420px] rounded-full overflow-hidden border-2 border-[#2e2e3a] shadow-2xl shadow-black/60">
                <img
                  src="https://images.unsplash.com/photo-1583394838336-acd977736f90?q=80&w=800&auto=format&fit=crop"
                  alt="ANC Technology"
                  className="w-full h-full object-cover"
                  style={{ filter: 'brightness(0.7) saturate(0.9)' }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-[#6366f1]/10 to-transparent" />
              </div>

              {/* Floating stat cards */}
              <div className="absolute top-6 -left-8 bg-[#1b1b23] border border-[#2e2e3a] rounded-2xl p-3 shadow-xl backdrop-blur-sm">
                <p className="text-[10px] text-[#c7c4d7] mb-0.5">Noise Reduction</p>
                <p className="text-xl font-black text-white">99.8%</p>
                <div className="h-1 rounded-full bg-[#6366f1]/20 mt-2">
                  <div className="h-1 rounded-full bg-[#6366f1] w-[99%]" />
                </div>
              </div>
              <div className="absolute bottom-8 -right-6 bg-[#1b1b23] border border-[#2e2e3a] rounded-2xl p-3 shadow-xl backdrop-blur-sm">
                <p className="text-[10px] text-[#c7c4d7] mb-0.5">Battery Life</p>
                <p className="text-xl font-black text-white">60 hrs</p>
                <div className="flex gap-0.5 mt-2">
                  {[...Array(5)].map((_, i) => <div key={i} className={`h-1.5 w-5 rounded-full ${i < 4 ? 'bg-[#34d399]' : 'bg-[#2e2e3a]'}`} />)}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          CATEGORY SHOWCASE TILES
      ══════════════════════════════════════════════════ */}
      <section className="w-full max-w-7xl mx-auto px-5 sm:px-8 py-20">
        <div className="text-center mb-12">
          <Badge variant="purple">Categories</Badge>
          <h2 className="text-3xl sm:text-4xl font-black text-white mt-3">Browse By Category</h2>
          <p className="text-[#c7c4d7] text-sm mt-2">Discover the full AURA ecosystem</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            {
              name: 'Premium Headphones',
              slug: 'audio',
              desc: 'ANC over-ear & on-ear models',
              img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=700&auto=format&fit=crop',
              count: '12 Products',
              accent: '#6366f1',
            },
            {
              name: 'True Wireless Earbuds',
              slug: 'audio',
              desc: 'Sport & lifestyle in-ear',
              img: 'https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?q=80&w=700&auto=format&fit=crop',
              count: '8 Products',
              accent: '#8b5cf6',
            },
            {
              name: 'Accessories & Docks',
              slug: 'accessories',
              desc: 'Charging docks, cables & stands',
              img: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?q=80&w=700&auto=format&fit=crop',
              count: '15 Products',
              accent: '#f59e0b',
            },
          ].map((cat) => (
            <Link
              key={cat.name}
              href={`/catalog?category=${cat.slug}`}
              className="group relative rounded-3xl overflow-hidden aspect-[3/4] border border-[#2e2e3a] hover:border-[#464554] transition-all duration-500 shadow-lg hover:shadow-2xl hover:shadow-black/50"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80 z-10" />
              <img
                src={cat.img}
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />

              {/* Content */}
              <div className="absolute inset-0 z-20 flex flex-col justify-between p-6">
                <div>
                  <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold text-white border border-white/20 bg-black/30 backdrop-blur-sm">
                    {cat.count}
                  </span>
                </div>
                <div>
                  <p className="text-white/60 text-xs font-medium mb-1">{cat.desc}</p>
                  <h3 className="text-white font-black text-xl leading-tight mb-3">{cat.name}</h3>
                  <div className="flex items-center gap-2 text-white/80 text-xs font-semibold group-hover:text-white transition-colors">
                    Shop now <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          TRUST / WHY AURA STRIP
      ══════════════════════════════════════════════════ */}
      <section className="w-full border-t border-b border-[#2e2e3a]/60 bg-[#1b1b23]/40 py-14">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: TrendingUp, title: 'Same-Day Dispatch', desc: 'Orders before 2 PM ship the same day' },
              { icon: Shield, title: 'Secure Checkout', desc: 'Stripe-encrypted with HTTP-only cookies' },
              { icon: RotateCcw, title: '30-Day Returns', desc: 'No-questions return with full refund' },
              { icon: Sparkles, title: '2-Year Warranty', desc: 'Aerospace-grade materials, guaranteed' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex flex-col items-center text-center sm:items-start sm:text-left gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#6366f1]/15 border border-[#6366f1]/20 flex items-center justify-center shrink-0">
                  <Icon size={16} className="text-[#a5b4fc]" />
                </div>
                <div>
                  <p className="text-white text-sm font-bold">{title}</p>
                  <p className="text-[#c7c4d7] text-xs mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          TESTIMONIAL
      ══════════════════════════════════════════════════ */}
      <section className="w-full max-w-4xl mx-auto px-5 sm:px-8 py-24 text-center">
        <div className="flex justify-center mb-4">
          {[...Array(5)].map((_, i) => <Star key={i} size={18} className="fill-[#f59e0b] text-[#f59e0b]" />)}
        </div>
        <blockquote className="text-xl sm:text-2xl font-light text-white italic leading-relaxed mb-8">
          "AURA headphones changed everything for me. The noise cancellation is unreal — I forget I'm
          even wearing them. Worth every cent."
        </blockquote>
        <div className="flex items-center justify-center gap-3">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop"
            alt="Clara Vance"
            className="h-10 w-10 rounded-full object-cover border-2 border-[#6366f1]/40"
          />
          <div className="text-left">
            <p className="text-white font-semibold text-sm">Clara Vance</p>
            <p className="text-[#c7c4d7] text-xs">Senior UI Designer, Spotify</p>
          </div>
        </div>
      </section>

    </div>
  );
}

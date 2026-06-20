'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../services/api';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { Product } from '../../types';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  SlidersHorizontal,
  Star,
  ShoppingBag,
  Heart,
  ChevronLeft,
  ChevronRight,
  FilterX,
  X,
  LayoutGrid,
  LayoutList,
  Sparkles,
  TrendingUp,
  ArrowUpDown,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ─── Star renderer ─────────────────────────────── */
function Stars({ rating }: { rating: number }) {
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

/* ─── Category metadata ─────────────────────────── */
const CATEGORIES = [
  { value: '', label: 'All Products', icon: '✦' },
  { value: 'audio', label: 'Audio', icon: '🎧' },
  { value: 'devices', label: 'Devices', icon: '📱' },
  { value: 'accessories', label: 'Accessories', icon: '🔌' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price-low-to-high', label: 'Price: Low → High' },
  { value: 'price-high-to-low', label: 'Price: High → Low' },
  { value: 'popularity', label: 'Most Popular' },
  { value: 'best-rated', label: 'Highest Rated' },
];

const PRICE_PRESETS = [
  { label: 'Under $50', min: '', max: '50' },
  { label: '$50–$150', min: '50', max: '150' },
  { label: '$150–$300', min: '150', max: '300' },
  { label: '$300+', min: '300', max: '' },
];

/* ─── Active Filter Pill ─────────────────────────── */
function FilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#6366f1]/15 border border-[#6366f1]/30 text-[#a5b4fc] text-[11px] font-semibold">
      {label}
      <button onClick={onRemove} className="hover:text-white transition cursor-pointer"><X size={10} /></button>
    </span>
  );
}

/* ─── Skeleton card ─────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="bg-[#1b1b23] rounded-2xl overflow-hidden border border-[#2e2e3a] animate-pulse">
      <div className="aspect-square bg-[#292932]" />
      <div className="p-4 space-y-2.5">
        <div className="h-3 bg-[#292932] rounded-full w-1/3" />
        <div className="h-4 bg-[#292932] rounded-full w-3/4" />
        <div className="h-3 bg-[#292932] rounded-full w-1/2" />
        <div className="h-9 bg-[#292932] rounded-xl mt-3" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
function CatalogContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const { user, setUser } = useAuthStore();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState('');
  const [inStock, setInStock] = useState(false);
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sortDropOpen, setSortDropOpen] = useState(false);

  useEffect(() => {
    setCategory(searchParams.get('category') || '');
    setSearch(searchParams.get('search') || '');
    setSearchInput(searchParams.get('search') || '');
  }, [searchParams]);

  const { data, isLoading } = useQuery({
    queryKey: ['products', search, category, minPrice, maxPrice, minRating, inStock, sort, page],
    queryFn: () => {
      const p = new URLSearchParams();
      if (search) p.append('search', search);
      if (category) p.append('category', category);
      if (minPrice) p.append('minPrice', minPrice);
      if (maxPrice) p.append('maxPrice', maxPrice);
      if (minRating) p.append('minRating', minRating);
      if (inStock) p.append('inStock', 'true');
      if (sort) p.append('sort', sort);
      p.append('page', page.toString());
      p.append('limit', '12');
      return apiRequest(`/products?${p}`);
    },
  });

  const resetFilters = () => {
    setSearch(''); setSearchInput(''); setCategory('');
    setMinPrice(''); setMaxPrice(''); setMinRating('');
    setInStock(false); setSort('newest'); setPage(1);
    router.push('/catalog');
  };

  const handleQuickAdd = (product: Product, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    addItem({
      productId: product._id, name: product.name, slug: product.slug,
      price: product.discountPrice || product.price,
      image: product.images[0] || '',
      quantity: 1, stock: product.stock,
      selectedSize: product.sizes[0],
      selectedColor: product.colors[0]?.name,
    });
    toast.success(`${product.name} added to cart`);
  };

  const handleToggleWishlist = async (productId: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) { toast.error('Sign in to save to wishlist'); return; }
    try {
      const res = await apiRequest(`/users/wishlist/${productId}`, { method: 'POST' });
      if (res.success) { toast.success(res.message); const me = await apiRequest('/auth/me'); setUser(me.user); }
    } catch (err: any) { toast.error(err.message || 'Action failed'); }
  };

  const productsList: Product[] = data?.products || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, totalProducts: 0 };

  /* ─── Active filter pills ─────────────────────── */
  const activeFilters: { label: string; clear: () => void }[] = [];
  if (category) activeFilters.push({ label: CATEGORIES.find(c => c.value === category)?.label || category, clear: () => { setCategory(''); setPage(1); } });
  if (search) activeFilters.push({ label: `"${search}"`, clear: () => { setSearch(''); setSearchInput(''); setPage(1); } });
  if (minPrice || maxPrice) activeFilters.push({ label: `$${minPrice || '0'} – $${maxPrice || '∞'}`, clear: () => { setMinPrice(''); setMaxPrice(''); setPage(1); } });
  if (minRating) activeFilters.push({ label: `${minRating}★+`, clear: () => { setMinRating(''); setPage(1); } });
  if (inStock) activeFilters.push({ label: 'In Stock', clear: () => { setInStock(false); setPage(1); } });

  const currentSortLabel = SORT_OPTIONS.find(o => o.value === sort)?.label || 'Sort';

  /* ─── Sidebar panel (shared desktop + mobile) ─── */
  const SidebarPanel = () => (
    <div className="h-full flex flex-col gap-6 overflow-y-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <SlidersHorizontal size={14} className="text-[#a5b4fc]" /> Filters
        </h2>
        {activeFilters.length > 0 && (
          <button onClick={resetFilters} className="flex items-center gap-1 text-[10px] font-semibold text-[#ffb4ab] hover:text-white transition cursor-pointer">
            <FilterX size={11} /> Clear all
          </button>
        )}
      </div>

      {/* Search */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-widest text-[#c7c4d7]">Search</label>
        <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }} className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#c7c4d7]/40" />
          <input
            type="text"
            placeholder="Keywords…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-8 pr-3 py-2.5 text-xs bg-[#0d0e14] border border-[#2e2e3a] text-white rounded-xl focus:outline-none focus:border-[#6366f1] placeholder:text-[#c7c4d7]/30 transition-all"
          />
        </form>
      </div>

      {/* Category */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-widest text-[#c7c4d7]">Category</label>
        <div className="space-y-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => { setCategory(cat.value); setPage(1); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${category === cat.value
                ? 'bg-[#6366f1]/20 text-white border border-[#6366f1]/30'
                : 'text-[#c7c4d7] hover:bg-[#1b1b23] hover:text-white border border-transparent'
                }`}
            >
              <span className="flex items-center gap-2.5"><span className="text-base">{cat.icon}</span>{cat.label}</span>
              {category === cat.value && <Check size={12} className="text-[#a5b4fc]" />}
            </button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div className="space-y-3">
        <label className="text-[10px] font-bold uppercase tracking-widest text-[#c7c4d7]">Price Range</label>
        <div className="grid grid-cols-2 gap-2">
          {PRICE_PRESETS.map((preset) => {
            const active = minPrice === preset.min && maxPrice === preset.max;
            return (
              <button
                key={preset.label}
                onClick={() => { setMinPrice(preset.min); setMaxPrice(preset.max); setPage(1); }}
                className={`px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${active ? 'bg-[#6366f1] text-white' : 'bg-[#0d0e14] border border-[#2e2e3a] text-[#c7c4d7] hover:border-[#464554] hover:text-white'
                  }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <input
            type="number" placeholder="Min $"
            value={minPrice}
            onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 text-xs bg-[#0d0e14] border border-[#2e2e3a] text-white rounded-xl focus:outline-none focus:border-[#6366f1] placeholder:text-[#c7c4d7]/30 transition-all"
          />
          <span className="text-[#464554]">—</span>
          <input
            type="number" placeholder="Max $"
            value={maxPrice}
            onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 text-xs bg-[#0d0e14] border border-[#2e2e3a] text-white rounded-xl focus:outline-none focus:border-[#6366f1] placeholder:text-[#c7c4d7]/30 transition-all"
          />
        </div>
      </div>

      {/* Rating */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-widest text-[#c7c4d7]">Min. Rating</label>
        <div className="space-y-1">
          {[{ v: '', l: 'Any Rating' }, { v: '4.5', l: '4.5★ & above' }, { v: '4.0', l: '4.0★ & above' }, { v: '3.5', l: '3.5★ & above' }].map(({ v, l }) => (
            <button
              key={v}
              onClick={() => { setMinRating(v); setPage(1); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${minRating === v
                ? 'bg-[#6366f1]/20 text-white border border-[#6366f1]/30'
                : 'text-[#c7c4d7] hover:bg-[#1b1b23] hover:text-white border border-transparent'
                }`}
            >
              {l}
              {minRating === v && <Check size={12} className="text-[#a5b4fc]" />}
            </button>
          ))}
        </div>
      </div>

      {/* In Stock toggle */}
      <label className="flex items-center gap-3 cursor-pointer group">
        <div
          onClick={() => { setInStock(!inStock); setPage(1); }}
          className={`relative w-10 h-5.5 rounded-full transition-colors cursor-pointer ${inStock ? 'bg-[#6366f1]' : 'bg-[#2e2e3a]'}`}
          style={{ height: '22px' }}
        >
          <div className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-all ${inStock ? 'left-5' : 'left-0.5'}`} style={{ width: '18px', height: '18px' }} />
        </div>
        <span className="text-sm text-[#c7c4d7] group-hover:text-white transition-colors font-medium select-none">In Stock Only</span>
      </label>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0d0e14] text-[#e3e1ec]">

      {/* ─── Page header ─────────────────────── */}
      <div className="border-b border-[#2e2e3a] bg-[#0d0e14]">
        <div className="max-w-screen-2xl mx-auto px-5 sm:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Mobile filter toggle */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden flex items-center gap-2 px-4 py-2 bg-[#1b1b23] border border-[#2e2e3a] rounded-xl text-sm font-semibold text-[#c7c4d7] hover:text-white hover:border-[#464554] transition cursor-pointer"
            >
              <SlidersHorizontal size={14} /> Filters
              {activeFilters.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#6366f1] text-white text-[9px] font-bold flex items-center justify-center">
                  {activeFilters.length}
                </span>
              )}
            </button>

            {/* Result count */}
            <div>
              <h1 className="text-white font-bold text-base leading-none">
                {category ? CATEGORIES.find(c => c.value === category)?.label || 'Products' : 'All Products'}
              </h1>
              <p className="text-[#c7c4d7] text-xs mt-0.5">
                {isLoading ? 'Loading…' : `${pagination.totalProducts} products found`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Active filter pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {activeFilters.map((f) => (
                <FilterPill key={f.label} label={f.label} onRemove={f.clear} />
              ))}
            </div>

            {/* Sort dropdown */}
            <div className="relative ml-auto">
              <button
                onClick={() => setSortDropOpen(!sortDropOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-[#1b1b23] border border-[#2e2e3a] rounded-xl text-sm text-[#c7c4d7] hover:text-white hover:border-[#464554] transition cursor-pointer whitespace-nowrap font-medium"
              >
                <ArrowUpDown size={13} />
                <span className="hidden sm:inline">{currentSortLabel}</span>
                <span className="sm:hidden">Sort</span>
              </button>
              <AnimatePresence>
                {sortDropOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-52 bg-[#1b1b23] border border-[#2e2e3a] rounded-2xl shadow-2xl shadow-black/50 p-1.5 z-50"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => { setSort(opt.value); setPage(1); setSortDropOpen(false); }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${sort === opt.value ? 'bg-[#6366f1]/20 text-white' : 'text-[#c7c4d7] hover:bg-[#292932] hover:text-white'
                          }`}
                      >
                        {opt.label}
                        {sort === opt.value && <Check size={12} className="text-[#a5b4fc]" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
              {sortDropOpen && <div className="fixed inset-0 z-40" onClick={() => setSortDropOpen(false)} />}
            </div>

            {/* View mode toggle */}
            <div className="flex items-center border border-[#2e2e3a] rounded-xl overflow-hidden">
              {(['grid', 'list'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`p-2.5 transition-all cursor-pointer ${viewMode === mode ? 'bg-[#6366f1] text-white' : 'text-[#c7c4d7] hover:text-white hover:bg-[#1b1b23]'}`}
                >
                  {mode === 'grid' ? <LayoutGrid size={15} /> : <LayoutList size={15} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Body ─────────────────────────────── */}
      <div className="max-w-screen-2xl mx-auto px-5 sm:px-8 py-8 flex gap-7 items-start">

        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-72 shrink-0 bg-[#1b1b23] border border-[#2e2e3a] rounded-2xl p-5 sticky top-[88px] self-start">
          <SidebarPanel />
        </aside>

        {/* Product area */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${category}-${sort}-${page}-${search}-${isLoading}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28 }}
            >
              {isLoading ? (
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5' : 'space-y-4'}>
                  {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
              ) : productsList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-28 text-center">
                  <div className="text-5xl mb-4">🎧</div>
                  <h3 className="text-white font-bold text-lg mb-2">No products found</h3>
                  <p className="text-[#c7c4d7] text-sm max-w-xs mb-6">Try adjusting your filters or search terms to discover more products.</p>
                  <button
                    onClick={resetFilters}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#6366f1] hover:bg-[#818cf8] text-white font-semibold text-sm rounded-xl transition cursor-pointer"
                  >
                    <FilterX size={14} /> Clear All Filters
                  </button>
                </div>
              ) : viewMode === 'grid' ? (
                /* ── GRID VIEW ── */
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {productsList.map((product, idx) => {
                    const img = product.images[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop';
                    const isWishlisted = user?.wishlist?.includes(product._id);
                    const isSoldOut = product.stock === 0;
                    const isLowStock = product.stock > 0 && product.stock <= 5;

                    return (
                      <motion.article
                        key={product._id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.04, duration: 0.3 }}
                        className="group bg-[#1b1b23]/40 border border-[#2e2e3a] hover:border-[#6366f1]/30 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-black/50 flex flex-col"
                      >
                        {/* Image */}
                        <div className="relative aspect-square overflow-hidden bg-[#13121a] border-b border-[#2e2e3a]/40">
                          <img
                            src={img}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700"
                          />
                          {/* Dark gradient on hover */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                          {/* Quick-action bar */}
                          <div className="absolute bottom-3 inset-x-3 flex gap-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                            {!isSoldOut && (
                              <button
                                onClick={(e) => handleQuickAdd(product, e)}
                                className="flex-1 py-2 bg-white text-[#12131a] text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 hover:bg-[#e8e8ff] transition cursor-pointer shadow-lg"
                              >
                                <ShoppingBag size={12} /> Add to Cart
                              </button>
                            )}
                            <button
                              onClick={(e) => handleToggleWishlist(product._id, e)}
                              className={`p-2 rounded-lg border transition cursor-pointer ${isWishlisted ? 'bg-[#6366f1] border-[#6366f1] text-white' : 'bg-[#1b1b23]/80 border-[#464554] text-white hover:bg-[#6366f1] hover:border-[#6366f1]'}`}
                            >
                              <Heart size={13} className={isWishlisted ? 'fill-white' : ''} />
                            </button>
                          </div>

                          {/* Badges */}
                          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                            {isSoldOut && <span className="px-2 py-0.5 bg-[#ffb4ab]/90 text-[#12131a] text-[10px] font-bold rounded-full">SOLD OUT</span>}
                            {!isSoldOut && product.discountPrice && <span className="px-2 py-0.5 bg-[#6366f1] text-white text-[10px] font-bold rounded-full">SALE</span>}
                            {!isSoldOut && isLowStock && <span className="px-2 py-0.5 bg-[#f59e0b]/90 text-[#12131a] text-[10px] font-bold rounded-full">LOW STOCK</span>}
                          </div>

                          {/* Category chip */}
                          <div className="absolute top-3 right-3">
                            <span className="px-2 py-0.5 bg-black/50 backdrop-blur-sm text-[#c7c4d7] text-[9px] font-semibold rounded-full border border-white/10">
                              {product.category?.name}
                            </span>
                          </div>
                        </div>

                        {/* Details */}
                        <Link href={`/catalog/${product.slug}`} className="flex-1 flex flex-col p-4 hover:no-underline">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-bold text-white text-sm leading-snug group-hover:text-[#a5b4fc] transition-colors line-clamp-2">
                              {product.name}
                            </h3>
                            <div className="shrink-0 text-right">
                              {product.discountPrice ? (
                                <>
                                  <p className="font-black text-white text-base">${product.discountPrice}</p>
                                  <p className="text-[10px] text-[#c7c4d7] line-through">${product.price}</p>
                                </>
                              ) : (
                                <p className="font-black text-white text-base">${product.price}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 mt-auto">
                            <Stars rating={product.rating} />
                            <span className="text-[#c7c4d7] text-[10px]">{product.rating?.toFixed(1)} ({product.numReviews})</span>
                          </div>
                        </Link>
                      </motion.article>
                    );
                  })}
                </div>
              ) : (
                /* ── LIST VIEW ── */
                <div className="space-y-3">
                  {productsList.map((product, idx) => {
                    const img = product.images[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&auto=format&fit=crop';
                    const isWishlisted = user?.wishlist?.includes(product._id);
                    const isSoldOut = product.stock === 0;

                    return (
                      <motion.article
                        key={product._id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="group bg-[#1b1b23]/40 border border-[#2e2e3a] hover:border-[#6366f1]/30 transition-all hover:shadow-2xl hover:shadow-black/50 overflow-hidden rounded-2xl"
                      >
                        <Link href={`/catalog/${product.slug}`} className="flex items-center gap-5 p-4 hover:no-underline">
                          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-[#13121a] shrink-0 border border-[#2e2e3a]/40">
                            <img src={img} alt={product.name} className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <span className="text-[10px] text-[#a5b4fc] font-semibold uppercase tracking-wider">{product.category?.name}</span>
                                <h3 className="font-bold text-white text-base leading-snug mt-0.5 group-hover:text-[#a5b4fc] transition-colors line-clamp-1">{product.name}</h3>
                                <div className="flex items-center gap-1.5 mt-1.5">
                                  <Stars rating={product.rating} />
                                  <span className="text-[#c7c4d7] text-[11px]">{product.rating?.toFixed(1)} ({product.numReviews} reviews)</span>
                                </div>
                                <p className="text-[#c7c4d7] text-xs mt-2 line-clamp-2 max-w-md">{product.description}</p>
                              </div>
                              <div className="shrink-0 text-right">
                                {product.discountPrice ? (
                                  <>
                                    <p className="font-black text-white text-xl">${product.discountPrice}</p>
                                    <p className="text-xs text-[#c7c4d7] line-through">${product.price}</p>
                                  </>
                                ) : (
                                  <p className="font-black text-white text-xl">${product.price}</p>
                                )}
                                <div className="flex gap-2 mt-3">
                                  {!isSoldOut && (
                                    <button
                                      onClick={(e) => handleQuickAdd(product, e)}
                                      className="px-3 py-1.5 bg-[#6366f1] hover:bg-[#818cf8] text-white text-xs font-bold rounded-lg flex items-center gap-1 transition cursor-pointer"
                                    >
                                      <ShoppingBag size={11} /> Add
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => handleToggleWishlist(product._id, e)}
                                    className={`p-1.5 rounded-lg border text-xs transition cursor-pointer ${isWishlisted ? 'bg-[#6366f1] border-[#6366f1] text-white' : 'border-[#2e2e3a] text-[#c7c4d7] hover:border-[#6366f1]'}`}
                                  >
                                    <Heart size={12} className={isWishlisted ? 'fill-white' : ''} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </motion.article>
                    );
                  })}
                </div>
              )}

              {/* ── Pagination ── */}
              {!isLoading && pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10 pt-8 border-t border-[#2e2e3a]">
                  <button
                    onClick={() => setPage(p => Math.max(p - 1, 1))}
                    disabled={page === 1}
                    className="flex items-center gap-1.5 px-4 py-2.5 border border-[#2e2e3a] rounded-xl text-sm font-semibold text-[#c7c4d7] hover:text-white hover:border-[#464554] disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                  >
                    <ChevronLeft size={15} /> Prev
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(pagination.totalPages, 7) }, (_, i) => {
                      const p = i + 1;
                      return (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`w-9 h-9 rounded-xl text-sm font-bold transition cursor-pointer ${page === p ? 'bg-[#6366f1] text-white shadow-lg shadow-[#6366f1]/25' : 'text-[#c7c4d7] hover:bg-[#1b1b23] hover:text-white'
                            }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setPage(p => Math.min(p + 1, pagination.totalPages))}
                    disabled={page === pagination.totalPages}
                    className="flex items-center gap-1.5 px-4 py-2.5 border border-[#2e2e3a] rounded-xl text-sm font-semibold text-[#c7c4d7] hover:text-white hover:border-[#464554] disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                  >
                    Next <ChevronRight size={15} />
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ─── Mobile sidebar drawer ─────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-80 bg-[#1b1b23] border-r border-[#2e2e3a] z-50 p-5 overflow-y-auto [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-white font-bold text-base">Filters</h2>
                <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-xl hover:bg-[#292932] text-[#c7c4d7] hover:text-white transition cursor-pointer">
                  <X size={18} />
                </button>
              </div>
              <SidebarPanel />
              <button
                onClick={() => setSidebarOpen(false)}
                className="w-full mt-6 py-3 bg-[#6366f1] hover:bg-[#818cf8] text-white font-bold rounded-xl transition cursor-pointer"
              >
                Apply Filters
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Page wrapper with Suspense ─────────────────── */
export default function CatalogPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0d0e14] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 rounded-full border-2 border-[#6366f1] border-t-transparent animate-spin" />
            <p className="text-[#c7c4d7] text-sm">Loading catalog…</p>
          </div>
        </div>
      }
    >
      <CatalogContent />
    </Suspense>
  );
}

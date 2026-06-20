'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../../services/api';
import { useCartStore } from '../../../store/cartStore';
import { useAuthStore } from '../../../store/authStore';
import { Product, Review } from '../../../types';
import {
  Star,
  Plus,
  Minus,
  ShoppingBag,
  Heart,
  ChevronRight,
  Maximize2,
  Sparkles,
  Check,
  ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ─── Benefit SVG Icons ─── */
function TruckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ShieldCheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function LeafIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707m1.414 8.486A4.5 4.5 0 1118.003 12c0 2.485-2.015 4.5-4.5 4.5z" />
    </svg>
  );
}

export default function ProductDetailsPage() {
  const { slug } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, setUser, isAuthenticated } = useAuthStore();
  const addItem = useCartStore((state) => state.addItem);

  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState<{ name: string; hex: string } | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | null>('specs');

  // Review Form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  // Fetch product data
  const { data: productData, isLoading, error } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => apiRequest(`/products/${slug}`),
  });

  const product: Product = productData?.product;

  // Set default size/color when product details load
  useEffect(() => {
    if (product) {
      if (product.sizes?.length > 0) setSelectedSize(product.sizes[0]);
      if (product.colors?.length > 0) setSelectedColor(product.colors[0]);
      setActiveImage(0);
    }
  }, [product]);

  // Fetch Reviews
  const { data: reviewsData } = useQuery({
    queryKey: ['reviews', product?._id],
    queryFn: () => apiRequest(`/reviews/${product?._id}`),
    enabled: !!product?._id,
  });

  const reviews: Review[] = reviewsData?.reviews || [];

  // Fetch Recommendations
  const { data: recommendationsData } = useQuery({
    queryKey: ['recommendations', product?._id],
    queryFn: () => apiRequest(`/products/recommendations/${product?._id}`),
    enabled: !!product?._id,
  });

  const recommendations: Product[] = recommendationsData?.recommendations || [];

  // Add review mutation
  const addReviewMutation = useMutation({
    mutationFn: (newReview: { rating: number; comment: string }) =>
      apiRequest(`/reviews/${product?._id}`, {
        method: 'POST',
        data: newReview,
      }),
    onSuccess: (res) => {
      toast.success(res.message || 'Review added successfully!');
      setComment('');
      setRating(5);
      // Invalidate queries to refresh rating and review list
      queryClient.invalidateQueries({ queryKey: ['product', slug] });
      queryClient.invalidateQueries({ queryKey: ['reviews', product?._id] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to submit review');
    },
  });

  const handleAddToCart = (buyNow = false) => {
    if (!product) return;

    if (product.stock === 0) {
      toast.error('This product is sold out');
      return;
    }

    addItem({
      productId: product._id,
      name: product.name,
      slug: product.slug,
      price: product.discountPrice || product.price,
      image: product.images[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e',
      quantity,
      stock: product.stock,
      selectedSize,
      selectedColor: selectedColor?.name,
    });

    toast.success(`${product.name} added to cart`);

    if (buyNow) {
      router.push('/checkout');
    }
  };

  const handleToggleWishlist = async () => {
    if (!product) return;
    if (!user) {
      toast.error('Please login to manage your wishlist');
      return;
    }
    try {
      const res = await apiRequest(`/users/wishlist/${product._id}`, { method: 'POST' });
      if (res.success) {
        toast.success(res.message);
        // Refresh User profile
        const me = await apiRequest('/auth/me');
        setUser(me.user);
      }
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    }
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error('Review comment cannot be empty');
      return;
    }
    addReviewMutation.mutate({ rating, comment });
  };

  const toggleAccordion = (tab: string) => {
    setOpenAccordion(openAccordion === tab ? null : tab);
  };

  if (isLoading) {
    return (
      <div className="space-y-12 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="aspect-square w-full rounded-xl pulse-skeleton" />
          <div className="space-y-4">
            <div className="h-6 w-1/3 rounded pulse-skeleton" />
            <div className="h-10 w-2/3 rounded pulse-skeleton" />
            <div className="h-20 w-full rounded pulse-skeleton" />
            <div className="h-12 w-1/2 rounded pulse-skeleton" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="text-center py-20 text-xs text-brand-muted border border-brand-border/60 rounded-xl">
        Product not found or database offline.
      </div>
    );
  }

  const getProductSpecs = (slug: string, categoryName: string): [string, string][] => {
    switch (slug) {
      case 'nothing-phone-3':
        return [
          ['Processor', 'Snapdragon 8 Gen 3'],
          ['Display', '6.7" LTPO OLED, 120Hz'],
          ['Camera', '50 MP Dual Main + 32 MP Front'],
          ['Battery', '5000 mAh (45W Fast Charging)'],
          ['OS', 'Nothing OS 3.0 (Android 15)']
        ];
      case 'acoustic-anc-headphones':
        return [
          ['Driver Size', '40mm Dynamic'],
          ['Battery Life', '40 Hours (ANC On)'],
          ['Bluetooth', '5.3 (LE Audio Ready)'],
          ['Charging', 'USB-C Fast Charge']
        ];
      case 'carbon-mechanical-keyboard':
        return [
          ['Switch Type', 'Hot-swappable Tactile Brown'],
          ['Layout', 'Tenkeyless (TKL) / Full Size'],
          ['Keycaps', 'Double-shot PBT'],
          ['Backlight', 'Per-key Custom RGB'],
          ['Connectivity', 'USB-C Detachable / Bluetooth']
        ];
      case 'premium-leather-edc-wallet':
        return [
          ['Material', 'Full-Grain Vegetable-Tanned Italian Leather'],
          ['Capacity', 'Up to 10 cards + Cash'],
          ['RFID Protection', 'Yes'],
          ['Dimensions', '10.2 x 6.5 x 0.8 cm'],
          ['Warranty', 'Lifetime Warranty']
        ];
      case 'duo-charging-desk-mat':
        return [
          ['Material', 'Vegan Leather + Merino Wool Felt'],
          ['Wireless Charging', 'Dual 15W Qi Chargers'],
          ['Input', 'USB-C (PD 30W required)'],
          ['Dimensions', '30x60cm / 40x90cm'],
          ['Water Resistance', 'Yes (Splash Resistant)']
        ];
      default:
        return [
          ['Category', categoryName || 'Premium Gear'],
          ['Brand', 'AURA Premium'],
          ['Warranty', '2-Year International'],
          ['Availability', 'In Stock']
        ];
    }
  };

  const mainImage = product.images[activeImage] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e';
  const secSpecs = getProductSpecs(product.slug, product.category?.name);

  return (
    <div className="min-h-screen bg-[#0d0e14] text-[#e3e1ec] py-10 px-5 sm:px-8 max-w-7xl mx-auto space-y-16">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2.5 text-[10px] text-[#c7c4d7]/50 font-bold uppercase tracking-[0.2em]">
        <Link href="/" className="hover:text-white transition">Home</Link>
        <ChevronRight size={10} className="text-[#c7c4d7]/40" />
        <Link href="/catalog" className="hover:text-white transition">Shop</Link>
        <ChevronRight size={10} className="text-[#c7c4d7]/40" />
        <span className="text-[#a5b4fc] truncate">{product.name}</span>
      </div>

      {/* Main product display details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left: Product Gallery */}
        <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-4">
          {/* Vertical Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex flex-row sm:flex-col gap-3 shrink-0 overflow-x-auto sm:overflow-x-visible pb-2 sm:pb-0 scrollbar-none">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`relative h-16 w-16 rounded-xl overflow-hidden border bg-[#1b1b23]/40 transition cursor-pointer shrink-0 ${activeImage === idx ? 'border-white ring-1 ring-white/30' : 'border-[#2e2e3a] hover:border-[#464554]'
                    }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Main Image Box */}
          <div className="relative flex-1 aspect-square rounded-3xl bg-[#1b1b23]/60 backdrop-blur-md overflow-hidden border border-[#2e2e3a] group">
            <img
              src={mainImage}
              alt={product.name}
              className="h-full w-full object-cover object-center cursor-zoom-in group-hover:scale-103 transition-transform duration-[750ms]"
              onClick={() => setLightboxOpen(true)}
            />

            {/* Best Seller Badge */}
            <span className="absolute top-4 left-4 bg-[#6366f1] text-white text-[9px] font-black tracking-widest px-3 py-1.5 rounded-lg uppercase">
              Best Seller
            </span>

            <button
              onClick={() => setLightboxOpen(true)}
              className="absolute right-4 bottom-4 p-3 bg-[#1b1b23]/80 backdrop-blur-md hover:bg-white/10 text-white rounded-xl border border-[#2e2e3a] shadow-lg transition opacity-0 group-hover:opacity-100 duration-300 cursor-pointer"
              aria-label="Zoom Image"
            >
              <Maximize2 size={15} />
            </button>
          </div>
        </div>

        {/* Right: Specifications & Options */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-1">
            <span className="text-[10px] text-[#c7c4d7]/50 font-bold uppercase tracking-[0.2em]">
              SHOP &gt; {product.category?.name?.toUpperCase() || 'HEADPHONES'} &gt; {product.name?.toUpperCase().replace('AURA ', '')}
            </span>
            <h1 className="text-4xl font-extrabold uppercase tracking-tight text-white leading-none pt-2">
              {product.name}
            </h1>

            {/* Rating summary */}
            <div className="flex items-center gap-2 text-xs pt-3">
              <span className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    size={12}
                    className={n <= Math.round(product.rating || 4.5) ? 'fill-[#f59e0b] text-[#f59e0b]' : 'text-[#464554] fill-[#464554]'}
                  />
                ))}
              </span>
              <span className="font-bold text-white">{(product.rating || 4.5).toFixed(1)}</span>
              <span className="text-[#c7c4d7]/50">({product.numReviews || 0} reviews)</span>
            </div>
          </div>

          {/* Pricing */}
          <div className="flex items-baseline gap-3.5 mt-4">
            {product.discountPrice ? (
              <>
                <span className="text-3xl font-black text-white">${product.discountPrice}</span>
                <span className="text-base text-[#c7c4d7] line-through font-medium">${product.price}</span>
                <span className="bg-[#f59e0b]/10 text-amber-500 border border-[#f59e0b]/20 px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider">
                  Save ${product.price - product.discountPrice}
                </span>
              </>
            ) : (
              <span className="text-3xl font-black text-white">${product.price}</span>
            )}
          </div>

          {/* Colors Selection */}
          {product.colors?.length > 0 && (
            <div className="space-y-2.5 pt-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#c7c4d7]">Color: {selectedColor?.name?.toUpperCase()}</span>
              <div className="flex gap-3">
                {product.colors.map((col) => (
                  <button
                    key={col.name}
                    onClick={() => setSelectedColor(col)}
                    style={{ backgroundColor: col.hex }}
                    className={`h-8 w-8 rounded-full border border-[#2e2e3a] relative flex items-center justify-center transition-transform hover:scale-110 cursor-pointer ${selectedColor?.name === col.name ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0d0e14]' : ''
                      }`}
                    title={col.name}
                  >
                    {selectedColor?.name === col.name && (
                      <Check size={12} className="text-white drop-shadow-md" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sizes Selection */}
          {product.sizes?.length > 0 && (
            <div className="space-y-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#c7c4d7]">Select Size</span>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setSelectedSize(sz)}
                    className={`px-4 py-2 text-xs rounded-xl border font-bold transition-all cursor-pointer ${selectedSize === sz
                        ? 'border-white bg-white text-black shadow-lg shadow-white/10'
                        : 'border-[#2e2e3a] bg-[#1b1b23]/40 hover:border-[#464554] text-[#c7c4d7] hover:text-white'
                      }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions Block */}
          <div className="space-y-4 pt-5">
            {/* Quantity selection & Wishlist */}
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-[#2e2e3a] bg-[#1b1b23]/40 rounded-xl overflow-hidden h-[46px]">
                <button
                  onClick={() => setQuantity(q => Math.max(q - 1, 1))}
                  className="px-3 h-full hover:bg-white/5 text-[#c7c4d7] hover:text-white transition cursor-pointer"
                >
                  <Minus size={14} />
                </button>
                <span className="px-4 text-xs font-bold text-white select-none">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => Math.min(q + 1, product.stock))}
                  className="px-3 h-full hover:bg-white/5 text-[#c7c4d7] hover:text-white transition cursor-pointer"
                  disabled={quantity >= product.stock}
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Add to Wishlist */}
              <button
                onClick={handleToggleWishlist}
                className={`p-3 border rounded-xl transition shadow-md cursor-pointer h-[46px] w-[46px] flex items-center justify-center ${user?.wishlist?.includes(product._id)
                    ? 'bg-[#6366f1] border-[#6366f1] text-white shadow-[#6366f1]/20'
                    : 'bg-[#1b1b23]/40 border-[#2e2e3a] text-[#c7c4d7] hover:text-white hover:border-[#6366f1]/40'
                  }`}
                title="Add to Wishlist"
              >
                <Heart size={16} className={user?.wishlist?.includes(product._id) ? 'fill-current' : ''} />
              </button>
            </div>

            {/* Actions CTAs */}
            <div className="space-y-2.5 pt-1">
              <button
                onClick={() => handleAddToCart(false)}
                disabled={product.stock === 0}
                className="w-full py-4 bg-[#6366f1] hover:bg-[#818cf8] text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-[#6366f1]/20 hover:shadow-[#6366f1]/35 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              >
                <ShoppingBag size={14} /> Add to Cart
              </button>
              <button
                onClick={() => handleAddToCart(true)}
                disabled={product.stock === 0}
                className="w-full py-4 bg-transparent border border-white/20 hover:border-white/40 text-white text-xs font-black uppercase tracking-wider rounded-xl transition cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              >
                {product.stock === 0 ? 'Sold Out' : 'Buy It Now'}
              </button>
            </div>

            {product.stock > 0 && product.stock <= 5 && (
              <p className="text-[10px] text-orange-400 font-semibold">
                Only {product.stock} left in stock - order soon!
              </p>
            )}
          </div>

          {/* Accordion Blocks */}
          <div className="space-y-1 pt-6 border-t border-[#2e2e3a]">
            {/* Tech Specs */}
            <div className="border-b border-[#2e2e3a]/60">
              <button
                onClick={() => toggleAccordion('specs')}
                className="w-full flex items-center justify-between py-4 text-[10px] font-black uppercase tracking-widest text-white cursor-pointer select-none"
              >
                <span>Technical Specifications</span>
                <ChevronDown size={14} className={`text-[#c7c4d7] transition-transform duration-300 ${openAccordion === 'specs' ? 'rotate-180' : ''}`} />
              </button>

              {openAccordion === 'specs' && (
                <div className="pb-5 space-y-3.5 text-xs text-[#c7c4d7] leading-relaxed">
                  {secSpecs.map(([key, val]) => (
                    <div key={key} className="flex justify-between border-b border-[#2e2e3a]/25 pb-2">
                      <span className="text-[#c7c4d7]/70 font-light">{key}</span>
                      <span className="text-white font-semibold">{val}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Shipping & Returns */}
            <div className="border-b border-[#2e2e3a]/60">
              <button
                onClick={() => toggleAccordion('shipping')}
                className="w-full flex items-center justify-between py-4 text-[10px] font-black uppercase tracking-widest text-white cursor-pointer select-none"
              >
                <span>Shipping & Returns</span>
                <ChevronDown size={14} className={`text-[#c7c4d7] transition-transform duration-300 ${openAccordion === 'shipping' ? 'rotate-180' : ''}`} />
              </button>

              {openAccordion === 'shipping' && (
                <div className="pb-5 text-xs text-[#c7c4d7]/80 leading-relaxed font-light space-y-2">
                  <p>
                    Enjoy complimentary express shipping on all orders over $150. Orders are dispatched within 24 hours of placement.
                  </p>
                  <p>
                    We offer a 30-day return policy for unused items in original packaging. Return shipping label is provided upon request.
                  </p>
                </div>
              )}
            </div>

            {/* Reviews */}
            <div className="border-b border-[#2e2e3a]/60">
              <button
                onClick={() => toggleAccordion('reviews')}
                className="w-full flex items-center justify-between py-4 text-[10px] font-black uppercase tracking-widest text-white cursor-pointer select-none"
              >
                <span>Reviews ({reviews.length})</span>
                <ChevronDown size={14} className={`text-[#c7c4d7] transition-transform duration-300 ${openAccordion === 'reviews' ? 'rotate-180' : ''}`} />
              </button>

              {openAccordion === 'reviews' && (
                <div className="pb-5 space-y-5">
                  {/* Add Review Panel */}
                  {isAuthenticated ? (
                    <form onSubmit={handleReviewSubmit} className="bg-[#1b1b23]/50 border border-[#2e2e3a] p-4 rounded-2xl space-y-4">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Write a Customer Review</h4>

                      {/* Star rating selector */}
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-[#c7c4d7]">Rating:</span>
                        <div className="flex gap-1.5">
                          {[1, 2, 3, 4, 5].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setRating(num)}
                              className="text-[#f59e0b] hover:scale-110 transition cursor-pointer"
                            >
                              <Star size={14} className={num <= rating ? 'fill-current' : 'text-[#464554] fill-[#464554]'} />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Comment text */}
                      <div className="space-y-1">
                        <textarea
                          placeholder="Share your thoughts on design, materials, and sound experience..."
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          className="w-full p-3 text-xs bg-[#0d0e14] border border-[#2e2e3a] text-white rounded-xl focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1]/30 placeholder:text-[#c7c4d7]/40 min-h-[80px] transition-all"
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={addReviewMutation.isPending}
                        className="px-5 py-2 text-xs font-bold bg-[#6366f1] hover:bg-[#818cf8] text-white rounded-xl shadow-lg shadow-[#6366f1]/20 transition-all cursor-pointer"
                      >
                        {addReviewMutation.isPending ? 'Submitting…' : 'Submit Review'}
                      </button>
                    </form>
                  ) : (
                    <p className="text-xs text-[#c7c4d7] bg-[#1b1b23]/30 border border-[#2e2e3a]/60 p-4 rounded-xl text-center leading-relaxed">
                      Please <Link href="/login" className="text-[#a5b4fc] hover:underline font-bold">login</Link> to share your review on this product.
                    </p>
                  )}

                  {/* Reviews list */}
                  <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-none">
                    {reviews.length === 0 ? (
                      <p className="text-xs text-[#c7c4d7]/50 font-light text-center py-6">
                        Be the first to review this product!
                      </p>
                    ) : (
                      reviews.map((rev) => (
                        <div key={rev._id} className="bg-[#1b1b23]/20 border border-[#2e2e3a]/40 p-4 rounded-xl space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <img
                                src={rev.user?.avatar || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'}
                                alt=""
                                className="h-6 w-6 rounded-lg object-cover border border-[#2e2e3a] bg-[#1b1b23]"
                              />
                              <span className="text-xs font-bold text-white">{rev.user?.name}</span>
                            </div>
                            <div className="flex gap-0.5 text-[#f59e0b]">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} size={11} className={i < rev.rating ? 'fill-current' : 'text-[#464554] fill-[#464554]'} />
                              ))}
                            </div>
                          </div>
                          <p className="text-xs text-[#c7c4d7] font-light pl-8 leading-relaxed">{rev.comment}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Three Benefit Icons */}
          <div className="grid grid-cols-3 gap-2 py-6 border-t border-b border-[#2e2e3a] mt-8 text-[9px] font-black uppercase tracking-widest text-[#c7c4d7]/70 text-center">
            <div className="flex flex-col items-center gap-2">
              <TruckIcon className="text-[#a5b4fc]" />
              <span>Free Shipping</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <ShieldCheckIcon className="text-[#a5b4fc]" />
              <span>2 Year Warranty</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <LeafIcon className="text-[#a5b4fc]" />
              <span>Eco-Packaging</span>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products Recommendations */}
      {recommendations.length > 0 && (
        <section className="space-y-6 border-t border-[#2e2e3a] pt-12">
          <div className="space-y-1">
            <span className="text-xs font-black uppercase tracking-widest text-[#a5b4fc]">Suggestions</span>
            <h3 className="text-2xl font-black text-white">Related Products</h3>
            <p className="text-xs text-[#c7c4d7]/70">You might also appreciate these premium items.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recommendations.map((prod) => {
              const img = prod.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e';
              return (
                <Link
                  href={`/catalog/${prod.slug}`}
                  key={prod._id}
                  className="group relative flex flex-col bg-[#1b1b23]/40 border border-[#2e2e3a] hover:border-[#6366f1]/30 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-black/50 transition-all duration-300"
                >
                  <div className="relative aspect-square overflow-hidden bg-[#13121a] border-b border-[#2e2e3a]/40">
                    <img
                      src={img}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700"
                    />
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                    <h4 className="text-sm font-bold text-white group-hover:text-[#a5b4fc] transition line-clamp-2 leading-snug">
                      {prod.name}
                    </h4>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-xs text-[#c7c4d7]">
                        ★ {(prod.rating || 4.5).toFixed(1)}
                      </span>
                      <span className="text-sm font-black text-white">${prod.price}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Photo Lightbox Dialog */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setLightboxOpen(false)}
        >
          <div className="relative max-w-4xl max-h-[85vh]">
            <img src={mainImage} alt={product.name} className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl" />
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute -top-12 right-0 p-2.5 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

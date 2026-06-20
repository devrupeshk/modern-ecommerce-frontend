'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { apiRequest } from '../services/api';
import { motion } from 'framer-motion';
import {
  ShoppingBag,
  Heart,
  User as UserIcon,
  Search,
  Menu,
  X,
  LogOut,
  Sliders,
  ChevronDown,
  LayoutDashboard,
  Headphones,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface NavbarProps {
  onCartToggle?: () => void;
}

const NAV_LINKS = [
  { name: 'Shop', path: '/catalog' },
  { name: 'Collection', path: '/catalog?sort=newest' },
  { name: 'Story', path: '#' },
  { name: 'Support', path: '#' },
];

export default function Navbar({ onCartToggle }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, setUser, logout } = useAuthStore();
  const { getCartCount, initializeCart } = useCartStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Always enforce dark theme
    document.documentElement.classList.add('dark-theme');
    localStorage.setItem('theme', 'dark');

    // Hydrate cart
    initializeCart();

    // Scroll listener
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [initializeCart]);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 80);
  }, [searchOpen]);

  const handleLogout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
      logout();
      toast.success('Logged out successfully');
      router.push('/');
    } catch {
      toast.error('Logout failed');
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const cartCount = getCartCount();

  return (
    <>
      {/* ─── Main Header ─── */}
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-500 ${scrolled
            ? 'bg-[#0d0e14]/90 backdrop-blur-xl border-b border-[#2e2e3a] shadow-2xl shadow-black/30'
            : 'bg-[#0d0e14]/70 backdrop-blur-md border-b border-white/5'
          }`}
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex h-[68px] items-center justify-between gap-6">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center shadow-lg shadow-[#6366f1]/30 group-hover:shadow-[#6366f1]/50 transition-shadow">
                <Headphones size={15} className="text-white" />
              </div>
              <span className="text-[18px] font-black tracking-[0.15em] text-white">AURA</span>
            </Link>

            {/* Desktop Nav Links */}
            <nav className="hidden lg:flex items-center gap-1.5" onMouseLeave={() => setHoveredLink(null)}>
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.path || (link.path !== '#' && pathname.startsWith(link.path.split('?')[0]) && link.path !== '/');
                return (
                  <Link
                    key={link.path + link.name}
                    href={link.path}
                    onMouseEnter={() => setHoveredLink(link.path)}
                    className={`relative px-4 py-2 text-sm font-semibold rounded-xl transition-colors duration-300 ${isActive ? 'text-white' : 'text-[#c7c4d7] hover:text-white'
                      }`}
                  >
                    {hoveredLink === link.path && (
                      <motion.span
                        layoutId="navHover"
                        className="absolute inset-0 bg-white/5 rounded-xl -z-10"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    {isActive && (
                      <motion.span
                        layoutId="navActive"
                        className="absolute inset-0 bg-white/8 rounded-xl -z-10"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    {link.name}
                    {isActive && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#6366f1]" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-1">

              {/* Search */}
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2.5 rounded-xl text-[#c7c4d7] hover:text-white hover:bg-white/8 transition-all cursor-pointer"
                aria-label="Search"
              >
                <Search size={18} />
              </button>

              {/* Wishlist */}
              <Link
                href="/dashboard"
                className="relative p-2.5 rounded-xl text-[#c7c4d7] hover:text-white hover:bg-white/8 transition-all"
                aria-label="Wishlist"
              >
                <Heart size={18} />
                {user?.wishlist && user.wishlist.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#6366f1] text-[9px] font-bold text-white flex items-center justify-center ring-2 ring-[#0d0e14]">
                    {user.wishlist.length}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <button
                onClick={onCartToggle}
                className="relative p-2.5 rounded-xl text-[#c7c4d7] hover:text-white hover:bg-white/8 transition-all cursor-pointer"
                aria-label="Cart"
              >
                <ShoppingBag size={18} />
                {cartCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#6366f1] text-[9px] font-bold text-white flex items-center justify-center ring-2 ring-[#0d0e14]">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* User / Auth */}
              <div className="relative group hidden sm:block ml-1">
                {isAuthenticated && user ? (
                  <>
                    <button className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-xl hover:bg-white/8 group-hover:bg-white/8 transition-all cursor-pointer">
                      <img
                        src={user.avatar || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'}
                        alt={user.name}
                        className="h-7 w-7 rounded-lg object-cover border border-[#464554]"
                      />
                      <ChevronDown size={13} className="text-[#c7c4d7] group-hover:text-white transition-colors" />
                    </button>

                    {/* Dropdown */}
                    <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-[#2e2e3a] bg-[#1b1b23] p-1.5 shadow-2xl shadow-black/50 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto translate-y-1 group-hover:translate-y-0 transition-all duration-200 before:content-[''] before:absolute before:-top-2 before:left-0 before:right-0 before:h-2">
                      <div className="px-3 py-2.5 border-b border-[#2e2e3a] mb-1">
                        <p className="font-semibold text-white text-xs truncate">{user.name}</p>
                        <p className="text-[#c7c4d7] text-[11px] truncate mt-0.5">{user.email}</p>
                      </div>
                      <Link href="/dashboard" className="flex items-center gap-2.5 px-3 py-2 text-xs text-[#c7c4d7] hover:text-white hover:bg-white/6 rounded-xl transition-all">
                        <LayoutDashboard size={13} /> My Dashboard
                      </Link>
                      {user.role === 'admin' && (
                        <Link href="/admin" className="flex items-center gap-2.5 px-3 py-2 text-xs text-[#a5b4fc] hover:text-white hover:bg-[#6366f1]/15 rounded-xl transition-all">
                          <Sliders size={13} /> Admin Panel
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-[#ffb4ab] hover:text-white hover:bg-[#ffb4ab]/10 rounded-xl transition-all cursor-pointer mt-1 border-t border-[#2e2e3a] pt-2"
                      >
                        <LogOut size={13} /> Sign Out
                      </button>
                    </div>
                  </>
                ) : (
                  <Link
                    href="/login"
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#6366f1] hover:bg-[#818cf8] rounded-xl transition-colors shadow-lg shadow-[#6366f1]/25"
                  >
                    <UserIcon size={14} /> Sign In
                  </Link>
                )}
              </div>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2.5 rounded-xl text-[#c7c4d7] hover:text-white hover:bg-white/8 transition-all cursor-pointer ml-1"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#2e2e3a] bg-[#0d0e14] px-5 py-4 space-y-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.name}
                href={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2.5 rounded-xl text-sm font-medium text-[#c7c4d7] hover:text-white hover:bg-white/6 transition-all"
              >
                {link.name}
              </Link>
            ))}
            <div className="border-t border-[#2e2e3a] pt-3 mt-3 space-y-1">
              {isAuthenticated ? (
                <>
                  <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2.5 rounded-xl text-sm font-medium text-[#c7c4d7] hover:text-white hover:bg-white/6 transition-all">Dashboard</Link>
                  {user?.role === 'admin' && (
                    <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-[#a5b4fc] hover:bg-[#6366f1]/15 transition-all">Admin Panel</Link>
                  )}
                  <button onClick={() => { setMobileMenuOpen(false); handleLogout(); }} className="block w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium text-[#ffb4ab] hover:bg-[#ffb4ab]/10 transition-all cursor-pointer">
                    Sign Out
                  </button>
                </>
              ) : (
                <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#6366f1] hover:bg-[#818cf8] text-center transition-colors">
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ─── Search Overlay ─── */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-24 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setSearchOpen(false); }}
        >
          <div className="w-full max-w-2xl bg-[#1b1b23] rounded-2xl border border-[#2e2e3a] shadow-2xl shadow-black/60 overflow-hidden">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-3 px-5 py-4">
              <Search size={18} className="text-[#c7c4d7] shrink-0" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search headphones, earbuds, accessories…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-white text-base placeholder:text-[#c7c4d7]/50 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-[#c7c4d7] hover:text-white transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </form>
            <div className="border-t border-[#2e2e3a] px-5 py-3 flex items-center gap-2 text-[11px] text-[#c7c4d7]/60">
              <span>Popular:</span>
              {['ANC Headphones', 'Wireless Earbuds', 'Charging Dock'].map((q) => (
                <button
                  key={q}
                  onClick={() => { setSearchQuery(q); router.push(`/catalog?search=${encodeURIComponent(q)}`); setSearchOpen(false); }}
                  className="px-2.5 py-1 rounded-full bg-[#292932] hover:bg-[#464554] text-[#c7c4d7] hover:text-white transition cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

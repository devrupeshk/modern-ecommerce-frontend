'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Headphones, Mail, MapPin, Phone } from 'lucide-react';

/* ─── Social media SVG icons ─── */
function TwitterX({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.261 5.636 5.902-5.636Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function Instagram({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function YouTube({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}
import toast from 'react-hot-toast';

/* ─── Payment card SVG icons ─── */
function VisaIcon() {
  return (
    <svg viewBox="0 0 48 32" width="40" height="26" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="32" rx="4" fill="#1A1F71" />
      <path d="M19.5 22H17l-1.6-8.1a.9.9 0 00-.5-.7A9 9 0 0012 12.4v-.3h4a1 1 0 011 .9l.9 5 2.6-5.9H23l-3.5 9.9zm5.5 0h-2.8l1.8-9.9h2.8L25 22zm6.4-7.1c.1-.6.7-1 1.4-1 1.1 0 1.9.2 2.4.5l.4-2.4a6.2 6.2 0 00-2.3-.4c-2.4 0-4.1 1.4-4.1 3.3 0 1.5 1.2 2.3 2 2.8.9.5 1.2.8 1.2 1.3 0 .7-.7 1-1.4 1-1.2 0-1.9-.2-2.7-.6l-.4 2.4c.8.3 1.8.5 2.8.5 2.6.1 4.2-1.3 4.2-3.3 0-2.5-3.5-2.7-3.5-4.1zm10.3 7.1h2.4L42 12.1h-2.3a1 1 0 00-.9.7l-3.3 9.2h2.8l.6-1.6h3.4l.4 1.6zm-3-3.7l1.4-3.9.8 3.9h-2.2z" fill="white" />
    </svg>
  );
}

function MastercardIcon() {
  return (
    <svg viewBox="0 0 48 32" width="40" height="26" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="32" rx="4" fill="#252525" />
      <circle cx="18" cy="16" r="8" fill="#EB001B" />
      <circle cx="30" cy="16" r="8" fill="#F79E1B" />
      <path d="M24 9.6a8 8 0 010 12.8A8 8 0 0124 9.6z" fill="#FF5F00" />
    </svg>
  );
}

function AmexIcon() {
  return (
    <svg viewBox="0 0 48 32" width="40" height="26" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="32" rx="4" fill="#2E77BC" />
      <path d="M8 18.5l1-2.5 1 2.5H8zm28-2.5v1h2.5v1H36v1.1h2.7l1.3-1.6-1.2-1.5H36zm-7.2 0L28 19l-1.8-3H24v4l-1.8-4H20l-2 4.5h1.4l.4-1h2l.4 1H27v-3.3l1.9 3.3h1.3l1.9-3.3V23H33v-4.5h-2.2v-2.5zm-9 3l.6-1.5.6 1.5h-1.2z" fill="white" />
    </svg>
  );
}

function StripeIcon() {
  return (
    <svg viewBox="0 0 48 32" width="40" height="26" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="32" rx="4" fill="#635BFF" />
      <path d="M22.5 13c0-.8.7-1.2 1.7-1.2 1.5 0 3.1.5 4.1 1.1V10c-1.1-.4-2.2-.6-4.1-.6-3.4 0-5.7 1.8-5.7 4.8 0 4.7 6.4 3.9 6.4 5.9 0 1-.8 1.3-1.9 1.3-1.6 0-3.6-.7-5.2-1.6v2.9c1.6.7 3.4 1.1 5.2 1.1 3.5 0 5.9-1.7 5.9-4.8C29 14.3 22.5 15.2 22.5 13z" fill="white" />
    </svg>
  );
}

const FOOTER_LINKS = {
  Shop: [
    { label: 'Headphones', href: '/catalog?category=audio' },
    { label: 'Earbuds', href: '/catalog?category=audio' },
    { label: 'Accessories', href: '/catalog?category=accessories' },
    { label: 'New Arrivals', href: '/catalog?sort=newest' },
    { label: 'Best Sellers', href: '/catalog?sort=popular' },
  ],
  Company: [
    { label: 'About AURA', href: '#' },
    { label: 'Our Story', href: '#' },
    { label: 'Careers', href: '#' },
    { label: 'Press', href: '#' },
  ],
  Support: [
    { label: 'Help Center', href: '#' },
    { label: 'Shipping & Delivery', href: '#' },
    { label: 'Returns & Refunds', href: '#' },
    { label: 'Warranty', href: '#' },
    { label: 'Contact Us', href: '#' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Cookie Policy', href: '#' },
    { label: 'Sitemap', href: '/catalog' },
  ],
};

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState('');

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid email');
      return;
    }
    toast.success('You\'re on the list! Welcome to AURA.');
    setEmail('');
  };

  return (
    <footer className="relative w-full bg-[#0d0e14] border-t border-[#2e2e3a] overflow-hidden">
      {/* Ambient bottom glow */}
      <div className="absolute -bottom-28 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#6366f1]/5 rounded-full blur-[120px] pointer-events-none" />

      {/* ─── Newsletter CTA strip ─── */}
      <div className="border-b border-[#2e2e3a] relative z-10">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-[#a5b4fc] text-xs font-semibold uppercase tracking-widest mb-1.5">Stay in the loop</p>
              <h3 className="text-white text-xl font-bold">Get exclusive drops & early access.</h3>
            </div>
            <form onSubmit={handleNewsletterSubmit} className="flex w-full sm:w-auto gap-2">
              <div className="relative flex-1 sm:w-72">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#c7c4d7]/50" />
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 bg-[#1b1b23] border border-[#2e2e3a] text-white text-sm rounded-xl focus:outline-none focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/25 focus:shadow-[0_0_15px_rgba(99,102,241,0.12)] placeholder:text-[#c7c4d7]/40 transition-all"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-3 bg-[#6366f1] hover:bg-[#818cf8] text-white text-sm font-bold rounded-xl transition-all flex items-center gap-2 shrink-0 shadow-lg shadow-[#6366f1]/20 hover:shadow-[0_0_20px_rgba(99,102,241,0.35)] cursor-pointer"
              >
                Subscribe <ArrowRight size={14} />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ─── Main footer grid ─── */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-14">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-10">

          {/* Brand column — spans 2 */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-5 w-fit">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center shadow-lg shadow-[#6366f1]/30">
                <Headphones size={16} className="text-white" />
              </div>
              <span className="text-xl font-black tracking-[0.15em] text-white">AURA</span>
            </Link>

            <p className="text-[#c7c4d7] text-sm leading-relaxed max-w-xs mb-6">
              A pure expression of premium audio technology and minimalist design philosophy.
              Crafted for those who hear the difference.
            </p>

            {/* Contact info */}
            <div className="space-y-2.5 text-xs text-[#c7c4d7]">
              <a href="mailto:hello@aura.audio" className="flex items-center gap-2.5 hover:text-white transition-colors">
                <Mail size={13} className="text-[#a5b4fc]" /> hello@aura.audio
              </a>
              <a href="tel:+18005551234" className="flex items-center gap-2.5 hover:text-white transition-colors">
                <Phone size={13} className="text-[#a5b4fc]" /> +1 (800) 555-1234
              </a>
              <div className="flex items-start gap-2.5">
                <MapPin size={13} className="text-[#a5b4fc] mt-0.5 shrink-0" />
                <span>100 Acoustic Ave, San Francisco, CA 94102</span>
              </div>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([group, links]) => (
            <div key={group} className="relative z-10">
              <h4 className="text-white text-xs font-bold uppercase tracking-widest mb-4">{group}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[#c7c4d7] text-sm hover:text-[#a5b4fc] transition-all hover:translate-x-1 inline-block transform duration-300"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Bottom bar ─── */}
      <div className="border-t border-[#2e2e3a]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">

          <p className="text-[#c7c4d7]/50 text-xs">
            © {currentYear} AURA Inc. All rights reserved.
          </p>

          {/* Payment icons */}
          <div className="flex items-center gap-2">
            <div className="opacity-90 hover:opacity-100 transition-opacity"><VisaIcon /></div>
            <div className="opacity-90 hover:opacity-100 transition-opacity"><MastercardIcon /></div>
            <div className="opacity-90 hover:opacity-100 transition-opacity"><AmexIcon /></div>
            <div className="opacity-90 hover:opacity-100 transition-opacity"><StripeIcon /></div>
          </div>

          {/* Social icons */}
          <div className="flex items-center gap-1">
            <a href="#" aria-label="Twitter / X" className="p-2 rounded-lg text-[#c7c4d7] hover:text-white hover:bg-[#1b1b23] transition-all">
              <TwitterX size={15} />
            </a>
            <a href="#" aria-label="Instagram" className="p-2 rounded-lg text-[#c7c4d7] hover:text-[#e1306c] hover:bg-[#1b1b23] transition-all">
              <Instagram size={15} />
            </a>
            <a href="#" aria-label="YouTube" className="p-2 rounded-lg text-[#c7c4d7] hover:text-[#ff0000] hover:bg-[#1b1b23] transition-all">
              <YouTube size={15} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

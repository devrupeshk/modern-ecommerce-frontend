'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { apiRequest } from '../../services/api';
import { Mail, Eye, EyeOff, Network, Key } from 'lucide-react';
import toast from 'react-hot-toast';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser, isAuthenticated } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectPath = searchParams.get('redirect') || '/';

  useEffect(() => {
    if (isAuthenticated) {
      router.push(redirectPath);
    }
  }, [isAuthenticated, router, redirectPath]);

  const handleQuickLogin = (role: 'customer' | 'admin') => {
    if (role === 'customer') {
      setEmail('customer@brand.com');
      setPassword('customerpassword');
      toast.success('Customer credentials auto-filled!');
    } else {
      setEmail('admin@brand.com');
      setPassword('adminpassword');
      toast.success('Admin credentials auto-filled!');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiRequest('/auth/login', {
        method: 'POST',
        data: { email, password },
      });

      if (response.success && response.user) {
        setUser(response.user);
        toast.success(`Welcome back!`);
        router.push(redirectPath);
      }
    } catch (err: any) {
      toast.error(err.message || 'Login failed. Please check credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center py-10 w-full">
      <div className="w-full max-w-md bg-[#1c1b22] border border-[#22212a] p-8 sm:p-10 rounded-2xl shadow-lg space-y-6">
        <div className="text-center space-y-1.5">
          <h1 className="text-3xl font-extrabold tracking-wider text-white uppercase">AURA</h1>
          <p className="text-xs text-gray-400 font-medium">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#13121a] border border-[#22212a] rounded-xl pl-4 pr-10 py-3 text-xs focus:ring-1 focus:ring-[#818cf8] focus:border-[#818cf8] text-white placeholder-gray-500 outline-none transition"
                placeholder="name@company.com"
              />
              <Mail size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">Password</label>
              <Link href="/forgot-password" className="text-[10px] text-gray-400 hover:text-white transition font-medium hover:underline">Forgot password?</Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#13121a] border border-[#22212a] rounded-xl pl-4 pr-10 py-3 text-xs focus:ring-1 focus:ring-[#818cf8] focus:border-[#818cf8] text-white placeholder-gray-500 outline-none transition"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition cursor-pointer"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Stay signed in */}
          <div className="flex items-center gap-2 py-1">
            <input
              type="checkbox"
              id="stay-signed-in"
              className="rounded border-[#22212a] bg-[#13121a] text-indigo-600 focus:ring-indigo-500 focus:ring-offset-[#1c1b22] h-4 w-4 transition cursor-pointer"
            />
            <label htmlFor="stay-signed-in" className="text-xs text-gray-400 font-medium select-none cursor-pointer">
              Stay signed in
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-[#6366f1] hover:bg-[#4f46e5] text-white font-bold text-xs rounded-xl shadow-[0_4px_12px_rgba(99,102,241,0.2)] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? 'Signing In...' : 'Sign In'}
          </button>

          {/* Register link */}
          <div className="text-xs text-gray-400 text-center pt-2">
            Don't have an account?
            <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline ml-1">
              Sign up
            </Link>
          </div>

          {/* Divider */}
          <div className="border-t border-[#22212a] my-6"></div>

          {/* Alternate auth buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => toast.success('SSO Gateway initialized')}
              className="flex items-center justify-center gap-2 py-2.5 px-4 bg-transparent border border-[#22212a] rounded-xl hover:bg-white/5 transition text-xs text-gray-300 font-bold cursor-pointer"
            >
              <Network size={14} className="text-gray-400" />
              <span>SSO</span>
            </button>
            <button
              type="button"
              onClick={() => toast.success('Passkey reader initialized')}
              className="flex items-center justify-center gap-2 py-2.5 px-4 bg-transparent border border-[#22212a] rounded-xl hover:bg-white/5 transition text-xs text-gray-300 font-bold cursor-pointer"
            >
              <Key size={14} className="text-gray-400" />
              <span>Passkey</span>
            </button>
          </div>

          {/* Development fast login tips */}
          <div className="border-t border-[#22212a]/60 pt-4 text-[10px] text-gray-500 space-y-1.5 leading-relaxed bg-[#13121a]/40 p-2.5 rounded">
            <p className="font-semibold text-white uppercase text-[8px] tracking-wider mb-1">Development quick logins (click to autofill):</p>
            <div 
              onClick={() => handleQuickLogin('customer')}
              className="cursor-pointer hover:bg-white/5 p-1 rounded transition-colors group text-gray-400 hover:text-white"
            >
              Customer: <code className="bg-[#22212a] px-1 rounded text-white font-bold group-hover:bg-[#312e81]/60 transition-colors">customer@brand.com</code> / password: <code className="bg-[#22212a] px-1 rounded text-white font-bold group-hover:bg-[#312e81]/60 transition-colors">customerpassword</code>
            </div>
            <div 
              onClick={() => handleQuickLogin('admin')}
              className="cursor-pointer hover:bg-white/5 p-1 rounded transition-colors group text-gray-400 hover:text-white"
            >
              Admin: <code className="bg-[#22212a] px-1 rounded text-white font-bold group-hover:bg-[#312e81]/60 transition-colors">admin@brand.com</code> / password: <code className="bg-[#22212a] px-1 rounded text-white font-bold group-hover:bg-[#312e81]/60 transition-colors">adminpassword</code>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-20">
        <div className="h-10 w-10 border-4 border-brand-accent border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}

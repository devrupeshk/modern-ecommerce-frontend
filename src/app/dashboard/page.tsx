'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { apiRequest } from '../../services/api';
import Link from 'next/link';
import { Order, UserAddress, Product } from '../../types';
import {
  User as UserIcon,
  ShoppingBag,
  MapPin,
  Heart,
  Settings,
  Plus,
  Trash2,
  CheckCircle,
  Truck,
  Package,
  Calendar,
  Lock,
  Sliders,
  LogOut,
  Bell,
  X,
  Star,
  Edit,
  Menu,
  Phone,
  Home,
  Building,
  CreditCard,
  Check,
  Eye,
  EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, setUser, isAuthenticated, isLoading, logout } = useAuthStore();
  const { addItem } = useCartStore();

  // Tab navigation state: 'profile' (Overview dashboard), 'orders', 'addresses', 'wishlist', 'settings'
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'addresses' | 'wishlist' | 'settings'>('profile');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Address edit state
  const [addressFormOpen, setAddressFormOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressData, setAddressData] = useState({
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
    isDefault: false
  });

  // Profile forms state
  const [profileName, setProfileName] = useState('');
  const [profileAvatar, setProfileAvatar] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Selected order details for timeline modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    // Wait until the session check is complete before deciding to redirect
    if (isLoading) return;
    if (!isAuthenticated) {
      toast.error('Please login to access your dashboard');
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Sync profile forms when user loads
  useEffect(() => {
    if (user) {
      setProfileName(user.name);
      setProfileAvatar(user.avatar || '');
    }
  }, [user]);

  // Fetch orders
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['myOrders'],
    queryFn: () => apiRequest('/orders/my-orders'),
    enabled: isAuthenticated,
  });
  const orders: Order[] = ordersData?.orders || [];

  // Fetch wishlist products
  const { data: wishlistData, isLoading: wishlistLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => apiRequest('/users/wishlist'),
    enabled: isAuthenticated && activeTab === 'wishlist',
  });
  const wishlistProducts: Product[] = wishlistData?.wishlist || [];

  // Mutations
  const addressMutation = useMutation({
    mutationFn: (data: typeof addressData) => {
      if (editingAddressId) {
        return apiRequest(`/users/addresses/${editingAddressId}`, {
          method: 'PUT',
          data,
        });
      }
      return apiRequest('/users/addresses', {
        method: 'POST',
        data,
      });
    },
    onSuccess: () => {
      toast.success(editingAddressId ? 'Address updated' : 'Address added');
      setAddressFormOpen(false);
      setEditingAddressId(null);
      syncMe();
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/users/addresses/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Address removed');
      syncMe();
    },
  });

  const profileMutation = useMutation({
    mutationFn: (data: { name: string; avatar?: string }) =>
      apiRequest('/users/profile', { method: 'PUT', data }),
    onSuccess: () => {
      toast.success('Profile updated');
      syncMe();
    },
  });

  const passwordMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/users/password', { method: 'PUT', data }),
    onSuccess: () => {
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Password update failed');
    },
  });

  const syncMe = async () => {
    try {
      const me = await apiRequest('/auth/me');
      setUser(me.user);
    } catch (e) {
      // not logged in
    }
  };

  const handleEditAddress = (addr: UserAddress) => {
    setEditingAddressId(addr._id || null);
    setAddressData({
      street: addr.street,
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
      country: addr.country,
      isDefault: addr.isDefault,
    });
    setAddressFormOpen(true);
  };

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addressMutation.mutate(addressData);
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    profileMutation.mutate({ name: profileName, avatar: profileAvatar });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    passwordMutation.mutate({ currentPassword, newPassword });
  };

  // Helper to format dates for timeline
  const formatTrackerDate = (baseDateStr: string, hoursToAdd: number) => {
    const date = new Date(baseDateStr);
    date.setHours(date.getHours() + hoursToAdd);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // Rating stars renderer
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<Star key={i} size={13} className="fill-[#ffb783] text-[#ffb783]" />);
      } else {
        stars.push(<Star key={i} size={13} className="text-[#908fa0]" />);
      }
    }
    return <div className="flex gap-0.5">{stars}</div>;
  };

  // Logout trigger
  const handleLogout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
      logout();
      toast.success('Logged out successfully');
      router.push('/');
    } catch (e) {
      logout();
      router.push('/');
    }
  };

  if (isLoading || !user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-32 bg-[#12131a] min-h-screen text-[#e3e1ec]">
        <div className="h-10 w-10 border-4 border-[#c0c1ff] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-[#c7c4d7] mt-4">Verifying premium session...</p>
      </div>
    );
  }

  // Calculate dynamic stats
  const totalSpent = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalOrdersCount = orders.length > 0 ? orders.length : 24;
  const loyaltyPoints = Math.max(2450, Math.round(totalSpent * 10));
  const tierName = user.role === 'admin' ? 'Administrator' : (totalSpent > 500 ? 'Tier: Platinum' : 'Tier: Gold');

  // Resolve Latest Order for overview tracker
  const latestOrder = orders.length > 0 ? orders[0] : {
    _id: 'AUR-83921',
    orderStatus: 'out-for-delivery' as const,
    createdAt: '2026-10-24T10:20:00.000Z',
    totalAmount: 323.00,
    products: [
      { product: { name: 'Aura ANC One' }, quantity: 1, price: 323.00 }
    ]
  };

  // Address lookup for profile overview grid
  const addressesToShow = user.addresses && user.addresses.length > 0 ? user.addresses : [
    {
      _id: 'mock-addr-1',
      street: '1248 Oakwood Avenue',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94110',
      country: 'United States',
      isDefault: true
    },
    {
      _id: 'mock-addr-2',
      street: '250 King Street, Suite 400',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94107',
      country: 'United States',
      isDefault: false
    }
  ];

  // Sidebar styling helper
  const getTabClassName = (tab: typeof activeTab) => {
    const base = "flex items-center gap-3 py-3 px-4 rounded-lg transition-all active:scale-[0.97] transition-transform text-xs font-semibold cursor-pointer w-full text-left";
    if (activeTab === tab) {
      return `${base} text-[#c0c1ff] font-bold border-r-2 border-[#c0c1ff] bg-[#34343d]/30`;
    }
    return `${base} text-[#c7c4d7] hover:bg-[#34343d]/20 hover:text-white`;
  };

  return (
    <div className="dark-theme bg-[#12131a] text-[#e3e1ec] min-h-screen flex flex-col md:flex-row selection:bg-[#c0c1ff]/30 font-sans">

      {/* 1. Left Sidebar - Desktop View */}
      <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-[#1b1b23] border-r border-[#464554]/10 py-8 px-4 z-40">
        <div className="mb-10 px-2 flex flex-col gap-3">
          <div>
            <h1 
              onClick={() => router.push('/')}
              className="text-2xl font-black text-[#c0c1ff] tracking-widest cursor-pointer hover:text-[#aeb0ee] transition-colors"
              title="Go to Home Page"
            >
              AURA
            </h1>
            <p className="text-[#c7c4d7] text-[10px] uppercase tracking-wider font-semibold mt-1">Premium Member</p>
          </div>
          <div className="flex flex-col gap-1.5 mt-1">
            <button
              onClick={() => router.push('/')}
              className="w-full text-center py-1.5 text-[9px] font-bold uppercase tracking-wider text-gray-400 hover:text-white bg-[#12131a] hover:bg-white/5 rounded-md border border-[#22212a]/30 transition-all cursor-pointer"
            >
              Home Page
            </button>
            {user.role === 'admin' && (
              <button
                onClick={() => router.push('/admin')}
                className="w-full text-center py-1.5 text-[9px] font-bold uppercase tracking-wider text-[#c0c1ff] hover:text-[#aeb0ee] bg-[#c0c1ff]/10 hover:bg-[#c0c1ff]/20 rounded-md border border-[#c0c1ff]/10 transition-all cursor-pointer"
              >
                Admin Console
              </button>
            )}
          </div>
        </div>

        <nav className="flex-1 space-y-1.5">
          <button onClick={() => { setActiveTab('profile'); setAddressFormOpen(false); }} className={getTabClassName('profile')}>
            <UserIcon size={16} />
            <span>Profile</span>
          </button>
          <button onClick={() => { setActiveTab('orders'); }} className={getTabClassName('orders')}>
            <ShoppingBag size={16} />
            <span>Orders</span>
          </button>
          <button onClick={() => { setActiveTab('addresses'); }} className={getTabClassName('addresses')}>
            <MapPin size={16} />
            <span>Addresses</span>
          </button>
          <button onClick={() => { setActiveTab('wishlist'); }} className={getTabClassName('wishlist')}>
            <Heart size={16} />
            <span>Wishlist</span>
          </button>
        </nav>

        <div className="pt-4 border-t border-[#464554]/20 mt-auto">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 py-3 px-4 rounded-lg text-[#ffb4ab] hover:bg-[#ffb4ab]/10 active:scale-[0.97] transition-all text-xs font-semibold cursor-pointer w-full text-left"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* 2. Floating Header - Mobile View */}
      <div className="md:hidden flex items-center justify-between h-16 w-full px-4 border-b border-[#464554]/10 bg-[#1b1b23] sticky top-0 z-40">
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="p-2 text-[#c7c4d7] hover:text-[#c0c1ff] transition cursor-pointer"
        >
          <Menu size={20} />
        </button>
        <span 
          onClick={() => router.push('/')}
          className="text-lg font-black text-[#c0c1ff] tracking-widest cursor-pointer hover:text-[#aeb0ee] transition-colors"
          title="Go to Home Page"
        >
          AURA
        </span>
        <button
          onClick={() => setActiveTab('settings')}
          className="p-2 text-[#c7c4d7] hover:text-[#c0c1ff] transition cursor-pointer"
        >
          <Settings size={18} />
        </button>
      </div>

      {/* 3. Mobile Sidebar Drawer */}
      {isMobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-50 transition-opacity">
          <div className="w-64 h-full bg-[#1b1b23] border-r border-[#464554]/10 flex flex-col py-8 px-4 relative">
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="absolute top-4 right-4 p-2 text-[#c7c4d7] hover:text-white"
            >
              <X size={20} />
            </button>
            <div className="mb-10 px-2 flex flex-col gap-3">
              <div>
                <h1 
                  onClick={() => { setIsMobileSidebarOpen(false); router.push('/'); }}
                  className="text-2xl font-black text-[#c0c1ff] tracking-widest cursor-pointer hover:text-[#aeb0ee] transition-colors"
                  title="Go to Home Page"
                >
                  AURA
                </h1>
                <p className="text-[#c7c4d7] text-[10px] uppercase tracking-wider font-semibold mt-1">Premium Member</p>
              </div>
              <div className="flex flex-col gap-1.5 mt-1">
                <button
                  onClick={() => { setIsMobileSidebarOpen(false); router.push('/'); }}
                  className="w-full text-center py-1.5 text-[9px] font-bold uppercase tracking-wider text-gray-400 hover:text-white bg-[#12131a] hover:bg-white/5 rounded-md border border-[#22212a]/30 transition-all cursor-pointer"
                >
                  Home Page
                </button>
                {user.role === 'admin' && (
                  <button
                    onClick={() => { setIsMobileSidebarOpen(false); router.push('/admin'); }}
                    className="w-full text-center py-1.5 text-[9px] font-bold uppercase tracking-wider text-[#c0c1ff] hover:text-[#aeb0ee] bg-[#c0c1ff]/10 hover:bg-[#c0c1ff]/20 rounded-md border border-[#c0c1ff]/10 transition-all cursor-pointer"
                  >
                    Admin Console
                  </button>
                )}
              </div>
            </div>

            <nav className="flex-1 space-y-1.5">
              <button
                onClick={() => { setActiveTab('profile'); setAddressFormOpen(false); setIsMobileSidebarOpen(false); }}
                className={getTabClassName('profile')}
              >
                <UserIcon size={16} />
                <span>Profile</span>
              </button>
              <button
                onClick={() => { setActiveTab('orders'); setIsMobileSidebarOpen(false); }}
                className={getTabClassName('orders')}
              >
                <ShoppingBag size={16} />
                <span>Orders</span>
              </button>
              <button
                onClick={() => { setActiveTab('addresses'); setIsMobileSidebarOpen(false); }}
                className={getTabClassName('addresses')}
              >
                <MapPin size={16} />
                <span>Addresses</span>
              </button>
              <button
                onClick={() => { setActiveTab('wishlist'); setIsMobileSidebarOpen(false); }}
                className={getTabClassName('wishlist')}
              >
                <Heart size={16} />
                <span>Wishlist</span>
              </button>
              <button
                onClick={() => { setActiveTab('settings'); setIsMobileSidebarOpen(false); }}
                className={getTabClassName('settings')}
              >
                <Settings size={16} />
                <span>Settings</span>
              </button>
            </nav>

            <div className="pt-4 border-t border-[#464554]/20 mt-auto">
              <button
                onClick={() => { setIsMobileSidebarOpen(false); handleLogout(); }}
                className="flex items-center gap-3 py-3 px-4 rounded-lg text-[#ffb4ab] hover:bg-[#ffb4ab]/10 active:scale-[0.97] transition-all text-xs font-semibold cursor-pointer w-full text-left"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Main Content Canvas */}
      <main className="flex-1 md:ml-64 p-6 sm:p-10 min-h-screen">

        {/* Header Block */}
        <header className="flex justify-between items-center w-full mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {activeTab === 'profile' && 'Dashboard'}
              {activeTab === 'orders' && 'Order History'}
              {activeTab === 'addresses' && 'Saved Addresses'}
              {activeTab === 'wishlist' && 'My Wishlist'}
              {activeTab === 'settings' && 'Settings'}
            </h2>
            <p className="text-[#c7c4d7] text-xs sm:text-sm mt-1">
              {activeTab === 'profile' && `Welcome back, ${user.name}.`}
              {activeTab === 'orders' && 'Track and manage your premium AURA acquisitions.'}
              {activeTab === 'addresses' && 'Manage your shipping and billing locations.'}
              {activeTab === 'wishlist' && 'Your curated collection of premium AURA sound devices.'}
              {activeTab === 'settings' && 'Update your personal profile details and security password.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => toast.success('All notifications read')}
              className="p-3 bg-[#292932] rounded-full text-[#c7c4d7] hover:text-[#c0c1ff] transition-colors cursor-pointer"
            >
              <Bell size={18} />
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className="p-3 bg-[#292932] rounded-full text-[#c7c4d7] hover:text-[#c0c1ff] transition-colors cursor-pointer"
            >
              <Settings size={18} />
            </button>
          </div>
        </header>

        {/* Dynamic Panels */}
        <div className="space-y-8">

          {/* PROFILE (OVERVIEW) TAB VIEW */}
          {activeTab === 'profile' && (
            <div className="space-y-8">
              {/* Profile Overview Card */}
              <section className="bg-[#1f1f27] rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 group overflow-hidden relative border border-[#464554]/10 shadow-lg">
                <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10 text-center sm:text-left w-full sm:w-auto">
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-[#c0c1ff]/20 p-1 group-hover:border-[#c0c1ff]/50 transition-all shrink-0 bg-[#1b1b23]">
                    <img
                      className="w-full h-full object-cover rounded-full"
                      alt="User Profile"
                      src={user.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e'}
                    />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white leading-normal">{user.name}</h3>
                    <p className="text-[#c7c4d7] text-sm">{user.email}</p>
                    <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                      <span className="bg-[#c0c1ff]/10 text-[#c0c1ff] border border-[#c0c1ff]/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        {tierName}
                      </span>
                      <span className="bg-[#c0c1ff]/10 text-[#c0c1ff] border border-[#c0c1ff]/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        {totalOrdersCount} Total Orders
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('settings')}
                  className="bg-[#c0c1ff] text-[#1000a9] px-6 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all text-xs shrink-0 cursor-pointer w-full sm:w-auto z-10"
                >
                  <Edit size={14} />
                  <span>Edit Profile</span>
                </button>
                {/* Decoration */}
                <div className="absolute -right-12 -top-12 w-64 h-64 bg-[#c0c1ff]/5 rounded-full blur-3xl pointer-events-none"></div>
              </section>

              {/* Recent Order Tracking Card */}
              <section className="bg-[#1f1f27] rounded-2xl p-6 sm:p-8 border border-[#464554]/10 shadow-lg">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                  <h3 className="text-lg font-bold text-white">Recent Order Tracking</h3>
                  <span className="text-[10px] font-bold text-[#c0c1ff] bg-[#c0c1ff]/10 border border-[#c0c1ff]/20 px-3 py-1 rounded-full uppercase tracking-wider">
                    Order #{latestOrder._id.slice(-6).toUpperCase()}
                  </span>
                </div>
                <div className="relative py-8 px-2 sm:px-4">
                  {/* Progress Line Background */}
                  <div className="absolute top-[50%] left-6 right-6 h-[2px] bg-[#34343d] -translate-y-1/2"></div>
                  {/* Progress Line Active */}
                  <div
                    style={{
                      width: `${latestOrder.orderStatus === 'placed' ? '0%' :
                        latestOrder.orderStatus === 'processing' ? '33.33%' :
                          latestOrder.orderStatus === 'shipped' || latestOrder.orderStatus === 'packed' ? '66.66%' : '100%'
                        }`
                    }}
                    className="absolute top-[50%] left-6 max-w-[calc(100%-48px)] h-[2px] bg-[#c0c1ff] -translate-y-1/2 transition-all duration-700"
                  ></div>

                  <div className="relative flex justify-between gap-2 sm:gap-4">
                    {/* Step 1: Placed */}
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#c0c1ff] flex items-center justify-center text-[#1000a9] relative z-10 shadow-lg shadow-[#c0c1ff]/20">
                        <Check size={16} strokeWidth={3} />
                      </div>
                      <div className="text-center max-w-[80px] sm:max-w-none">
                        <p className="text-white font-bold text-xs sm:text-sm">Placed</p>
                        <p className="text-[#c7c4d7] text-[9px] sm:text-[10px] mt-0.5">
                          {formatTrackerDate(latestOrder.createdAt, 0).split(',')[0]}
                        </p>
                      </div>
                    </div>

                    {/* Step 2: Processing */}
                    <div className="flex flex-col items-center gap-3">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center relative z-10 shadow-lg ${latestOrder.orderStatus !== 'placed'
                        ? 'bg-[#c0c1ff] text-[#1000a9] shadow-[#c0c1ff]/20'
                        : 'bg-[#1b1b23] text-[#c0c1ff] border border-[#c0c1ff]/30'
                        }`}>
                        {latestOrder.orderStatus !== 'placed' ? (
                          <Check size={16} strokeWidth={3} />
                        ) : (
                          <div className="w-2.5 h-2.5 bg-[#c0c1ff] rounded-full animate-pulse"></div>
                        )}
                      </div>
                      <div className="text-center max-w-[80px] sm:max-w-none">
                        <p className={`font-bold text-xs sm:text-sm ${latestOrder.orderStatus !== 'placed' ? 'text-white' : 'text-[#908fa0]'}`}>Processing</p>
                        <p className="text-[#c7c4d7] text-[9px] sm:text-[10px] mt-0.5">
                          {formatTrackerDate(latestOrder.createdAt, 4).split(',')[0]}
                        </p>
                      </div>
                    </div>

                    {/* Step 3: Shipped */}
                    <div className="flex flex-col items-center gap-3">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center relative z-10 shadow-lg ${latestOrder.orderStatus === 'shipped' || latestOrder.orderStatus === 'out-for-delivery' || latestOrder.orderStatus === 'delivered'
                        ? 'bg-[#c0c1ff] text-[#1000a9] shadow-[#c0c1ff]/20'
                        : latestOrder.orderStatus === 'processing'
                          ? 'bg-[#1b1b23] text-[#c0c1ff] border border-[#c0c1ff]/30'
                          : 'bg-[#1b1b23] text-[#908fa0] border border-[#464554]/30'
                        }`}>
                        {latestOrder.orderStatus === 'shipped' || latestOrder.orderStatus === 'out-for-delivery' || latestOrder.orderStatus === 'delivered' ? (
                          <Check size={16} strokeWidth={3} />
                        ) : latestOrder.orderStatus === 'processing' ? (
                          <div className="w-2.5 h-2.5 bg-[#c0c1ff] rounded-full animate-pulse"></div>
                        ) : (
                          <Truck size={14} />
                        )}
                      </div>
                      <div className="text-center max-w-[80px] sm:max-w-none">
                        <p className={`font-bold text-xs sm:text-sm ${latestOrder.orderStatus === 'shipped' || latestOrder.orderStatus === 'out-for-delivery' || latestOrder.orderStatus === 'delivered'
                          ? 'text-white'
                          : 'text-[#908fa0]'
                          }`}>Shipped</p>
                        <p className="text-[#c7c4d7] text-[9px] sm:text-[10px] mt-0.5">
                          {formatTrackerDate(latestOrder.createdAt, 22).split(',')[0]}
                        </p>
                      </div>
                    </div>

                    {/* Step 4: Out for Delivery / Delivered */}
                    <div className="flex flex-col items-center gap-3">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center relative z-10 shadow-lg ${latestOrder.orderStatus === 'delivered'
                        ? 'bg-[#c0c1ff] text-[#1000a9] shadow-[#c0c1ff]/20'
                        : latestOrder.orderStatus === 'out-for-delivery'
                          ? 'bg-[#1b1b23] text-[#c0c1ff] border-2 border-[#c0c1ff] ring-4 ring-[#c0c1ff]/20 shadow-[#c0c1ff]/20'
                          : 'bg-[#1b1b23] text-[#908fa0] border border-[#464554]/30'
                        }`}>
                        {latestOrder.orderStatus === 'delivered' ? (
                          <Check size={16} strokeWidth={3} />
                        ) : latestOrder.orderStatus === 'out-for-delivery' ? (
                          <div className="w-2.5 h-2.5 bg-[#c0c1ff] rounded-full animate-ping"></div>
                        ) : (
                          <Package size={14} />
                        )}
                      </div>
                      <div className="text-center max-w-[80px] sm:max-w-none">
                        <p className={`font-bold text-xs sm:text-sm ${latestOrder.orderStatus === 'delivered' || latestOrder.orderStatus === 'out-for-delivery' ? 'text-[#c0c1ff]' : 'text-[#908fa0]'}`}>
                          {latestOrder.orderStatus === 'delivered' ? 'Delivered' : 'In Transit'}
                        </p>
                        <p className="text-[#c7c4d7] text-[9px] sm:text-[10px] mt-0.5">
                          {latestOrder.orderStatus === 'delivered' ? 'Completed' : 'Expected Today'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Shipping Address Grid */}
              <section>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-white">Shipping Addresses</h3>
                  <button
                    onClick={() => {
                      setActiveTab('addresses');
                      setEditingAddressId(null);
                      setAddressData({ street: '', city: '', state: '', postalCode: '', country: 'United States', isDefault: false });
                      setAddressFormOpen(true);
                    }}
                    className="text-[#c0c1ff] flex items-center gap-1 hover:underline text-xs font-semibold"
                  >
                    <Plus size={14} />
                    <span>Add New Address</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {addressesToShow.slice(0, 2).map((addr, idx) => (
                    <div
                      key={addr._id || idx}
                      className="bg-[#1f1f27] rounded-xl p-5 border border-[#464554]/10 hover:border-[#c0c1ff]/30 transition-all duration-300 group relative"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2">
                          {idx === 0 ? <Home size={16} className="text-[#c0c1ff]" /> : <Building size={16} className="text-[#c7c4d7]" />}
                          <p className="text-white font-bold text-sm">{idx === 0 ? 'Home' : 'Office'}</p>
                          {addr.isDefault && (
                            <span className="bg-[#3f4178] text-[#aeb0ee] text-[9px] uppercase tracking-wider px-2 py-0.5 rounded font-bold">
                              Default
                            </span>
                          )}
                        </div>
                        {/* Hover buttons */}
                        <div className="md:opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 absolute top-4 right-4">
                          <button
                            onClick={() => {
                              setActiveTab('addresses');
                              handleEditAddress(addr);
                            }}
                            className="p-1.5 text-[#c7c4d7] hover:text-[#c0c1ff] hover:bg-[#34343d]/40 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit size={14} />
                          </button>
                          {addr._id !== 'mock-addr-1' && addr._id !== 'mock-addr-2' && (
                            <button
                              onClick={() => deleteAddressMutation.mutate(addr._id!)}
                              className="p-1.5 text-[#c7c4d7] hover:text-[#ffb4ab] hover:bg-[#ffb4ab]/10 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="space-y-0.5 text-[#c7c4d7] text-xs">
                        <p className="text-white font-medium mb-1">{user.name}</p>
                        <p>{addr.street}</p>
                        <p>{addr.city}, {addr.state} {addr.postalCode}</p>
                        <p>{addr.country}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Bonus Bento Cards */}
              <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-1 md:col-span-2 bg-[#1f1f27] rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between border border-[#464554]/10 shadow-lg relative overflow-hidden gap-4">
                  <div className="relative z-10">
                    <p className="text-[#c0c1ff] font-bold text-[10px] uppercase tracking-widest mb-1.5">AURA REWARDS</p>
                    <h4 className="text-xl sm:text-2xl font-bold text-white mb-4">You've earned {loyaltyPoints.toLocaleString()} points</h4>
                    <button
                      onClick={() => toast.success('Points system gateway under development')}
                      className="bg-[#c0c1ff] text-[#1000a9] px-5 py-2 rounded-lg font-bold text-xs hover:brightness-110 transition cursor-pointer"
                    >
                      Redeem Points
                    </button>
                  </div>
                  {/* Abstract Orb */}
                  <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-gradient-to-br from-[#c0c1ff]/15 to-[#8083ff]/10 rounded-full blur-xl pointer-events-none"></div>
                </div>

                <div className="col-span-1 bg-[#292932] rounded-xl p-6 border border-[#464554]/10 relative overflow-hidden flex flex-col justify-end min-h-[150px] group shadow-lg">
                  {/* Subtle Background Glow */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#1f1f27] to-transparent opacity-80 z-0"></div>
                  <div className="absolute -right-12 -top-12 w-28 h-28 bg-[#ffb783]/5 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500"></div>

                  <div className="relative z-10 mt-auto">
                    <p className="text-white font-bold text-sm">Exclusive Preview</p>
                    <p className="text-[#c7c4d7] text-xs mt-0.5">Winter Collection 2024</p>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* ORDERS HISTORY TAB VIEW */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              {ordersLoading ? (
                <div className="space-y-4">
                  <div className="h-20 w-full rounded-xl bg-[#1f1f27] animate-pulse" />
                  <div className="h-20 w-full rounded-xl bg-[#1f1f27] animate-pulse" />
                </div>
              ) : orders.length === 0 ? (
                <div className="bg-[#1f1f27] border border-[#464554]/10 rounded-xl p-12 text-center shadow-lg">
                  <ShoppingBag size={40} className="mx-auto text-[#908fa0] mb-4 opacity-50" />
                  <p className="text-sm text-[#c7c4d7]">You haven't placed any orders yet.</p>
                  <Link
                    href="/catalog"
                    className="inline-block mt-4 bg-[#c0c1ff] text-[#1000a9] px-6 py-2.5 rounded-lg text-xs font-bold hover:brightness-110 transition"
                  >
                    Start Exploring
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => {
                    const firstProduct = order.products[0]?.product;
                    const fallbackImg = 'https://www.gstatic.com/labs-code/stitch/stitch-placeholder-300x300.svg';
                    const productImg = firstProduct?.images?.[0] || fallbackImg;
                    const itemsText = order.products.map(p => p.product?.name).join(', ');

                    return (
                      <div
                        key={order._id}
                        className="bg-gradient-to-br from-[#1f1f27] to-[#1b1b23] border border-[#464554]/10 rounded-xl p-5 hover:border-[#c0c1ff]/30 transition-all duration-300 flex flex-col md:flex-row gap-5 items-center group shadow-md"
                      >
                        <div className="w-20 h-20 bg-[#13121a] rounded-lg overflow-hidden flex-shrink-0 border border-[#464554]/10">
                          <img
                            src={productImg}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>

                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 w-full text-center md:text-left">
                          <div className="flex flex-col justify-center">
                            <span className="text-[#c7c4d7] text-[10px] uppercase tracking-wider font-semibold">Order ID</span>
                            <span className="font-bold text-white text-base mt-0.5">#{order._id.slice(-6).toUpperCase()}</span>
                            <span className="text-[#c0c1ff] text-xs font-medium mt-1 truncate max-w-[200px] mx-auto md:mx-0">
                              {firstProduct?.name || 'AURA Acquisition'}
                              {order.products.length > 1 && ` (+${order.products.length - 1} more)`}
                            </span>
                          </div>

                          <div className="flex flex-col justify-center">
                            <span className="text-[#c7c4d7] text-[10px] uppercase tracking-wider font-semibold">Status</span>
                            <div className="flex items-center justify-center md:justify-start gap-1.5 mt-1 text-[#ffb783]">
                              <span className="w-2 h-2 rounded-full bg-[#ffb783] animate-pulse"></span>
                              <span className="text-xs font-bold uppercase tracking-wider">
                                {order.orderStatus === 'out-for-delivery' ? 'Out For Delivery' : order.orderStatus}
                              </span>
                            </div>
                            <span className="text-white font-bold text-sm mt-1">${order.totalAmount.toFixed(2)}</span>
                          </div>

                          <div className="flex items-center justify-center md:justify-end gap-3">
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="bg-[#c0c1ff] text-[#1000a9] font-bold text-xs px-5 py-2.5 rounded-lg hover:brightness-110 transition shadow-md shadow-[#c0c1ff]/10 active:scale-[0.97] cursor-pointer"
                            >
                              Track Order
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SAVED ADDRESSES TAB VIEW */}
          {activeTab === 'addresses' && (
            <div className="space-y-6">
              {addressFormOpen ? (
                // Address Edit Form
                <form
                  onSubmit={handleAddressSubmit}
                  className="bg-[#1f1f27] p-6 sm:p-8 border border-[#464554]/10 rounded-xl shadow-lg space-y-5"
                >
                  <div className="flex justify-between items-center border-b border-[#464554]/10 pb-4 mb-2">
                    <h3 className="text-base font-bold text-white uppercase tracking-wider">
                      {editingAddressId ? 'Edit Address' : 'Add New Address'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setAddressFormOpen(false)}
                      className="p-1.5 text-[#c7c4d7] hover:text-white hover:bg-[#34343d]/40 rounded-lg cursor-pointer"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#c7c4d7]">Street Address</label>
                    <input
                      type="text"
                      required
                      value={addressData.street}
                      onChange={(e) => setAddressData({ ...addressData, street: e.target.value })}
                      className="w-full px-4 py-3 text-xs bg-[#13121a] border border-[#464554]/20 rounded-xl text-white focus:ring-1 focus:ring-[#c0c1ff] focus:border-[#c0c1ff] outline-none transition"
                      placeholder="123 Main St"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#c7c4d7]">City</label>
                      <input
                        type="text"
                        required
                        value={addressData.city}
                        onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
                        className="w-full px-4 py-3 text-xs bg-[#13121a] border border-[#464554]/20 rounded-xl text-white focus:ring-1 focus:ring-[#c0c1ff] focus:border-[#c0c1ff] outline-none transition"
                        placeholder="San Francisco"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#c7c4d7]">State / Region</label>
                      <input
                        type="text"
                        required
                        value={addressData.state}
                        onChange={(e) => setAddressData({ ...addressData, state: e.target.value })}
                        className="w-full px-4 py-3 text-xs bg-[#13121a] border border-[#464554]/20 rounded-xl text-white focus:ring-1 focus:ring-[#c0c1ff] focus:border-[#c0c1ff] outline-none transition"
                        placeholder="CA"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#c7c4d7]">Postal Code</label>
                      <input
                        type="text"
                        required
                        value={addressData.postalCode}
                        onChange={(e) => setAddressData({ ...addressData, postalCode: e.target.value })}
                        className="w-full px-4 py-3 text-xs bg-[#13121a] border border-[#464554]/20 rounded-xl text-white focus:ring-1 focus:ring-[#c0c1ff] focus:border-[#c0c1ff] outline-none transition"
                        placeholder="94103"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#c7c4d7]">Country</label>
                      <input
                        type="text"
                        required
                        value={addressData.country}
                        onChange={(e) => setAddressData({ ...addressData, country: e.target.value })}
                        className="w-full px-4 py-3 text-xs bg-[#13121a] border border-[#464554]/20 rounded-xl text-white focus:ring-1 focus:ring-[#c0c1ff] focus:border-[#c0c1ff] outline-none transition"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 py-2">
                    <input
                      type="checkbox"
                      id="addressDefaultCheck"
                      checked={addressData.isDefault}
                      onChange={(e) => setAddressData({ ...addressData, isDefault: e.target.checked })}
                      className="h-4 w-4 bg-[#13121a] border-[#464554]/30 rounded text-[#c0c1ff] focus:ring-[#c0c1ff] cursor-pointer"
                    />
                    <label htmlFor="addressDefaultCheck" className="text-xs font-semibold text-[#c7c4d7] select-none cursor-pointer">
                      Set as default shipping address
                    </label>
                  </div>

                  <div className="flex gap-3 justify-end pt-4 border-t border-[#464554]/15">
                    <button
                      type="button"
                      onClick={() => setAddressFormOpen(false)}
                      className="px-5 py-2.5 border border-[#464554]/40 hover:bg-[#34343d]/30 text-xs font-bold rounded-lg transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={addressMutation.isPending}
                      className="px-6 py-2.5 bg-[#c0c1ff] text-[#1000a9] text-xs font-bold rounded-lg hover:brightness-110 active:scale-[0.97] transition"
                    >
                      {addressMutation.isPending ? 'Saving...' : 'Save Address'}
                    </button>
                  </div>
                </form>
              ) : (
                // Addresses Grid Panel
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-[#c7c4d7]">Saved delivery and billing configurations.</p>
                    <button
                      onClick={() => {
                        setEditingAddressId(null);
                        setAddressData({ street: '', city: '', state: '', postalCode: '', country: 'United States', isDefault: false });
                        setAddressFormOpen(true);
                      }}
                      className="bg-[#c0c1ff] text-[#1000a9] font-bold text-xs px-4 py-2 rounded-lg hover:brightness-110 flex items-center gap-1 cursor-pointer transition active:scale-[0.97]"
                    >
                      <Plus size={14} />
                      <span>Add Address</span>
                    </button>
                  </div>

                  {user.addresses.length === 0 ? (
                    <div className="bg-[#1f1f27] border border-[#464554]/10 rounded-xl p-12 text-center shadow-lg">
                      <MapPin size={40} className="mx-auto text-[#908fa0] mb-4 opacity-50" />
                      <p className="text-sm text-[#c7c4d7]">No saved addresses yet. Save one for faster checkouts.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {user.addresses.map((addr) => (
                        <div
                          key={addr._id}
                          className="bg-[#1f1f27] rounded-xl p-6 border border-[#464554]/20 flex flex-col hover:border-[#c0c1ff]/30 transition-colors group relative overflow-hidden shadow-lg"
                        >
                          <div className="absolute top-0 right-0 w-32 h-32 bg-[#c0c1ff]/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>

                          <div className="flex justify-between items-start mb-4 z-10">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-[#3f4178]/30 text-[#c0c1ff] flex items-center justify-center shrink-0">
                                <MapPin size={16} />
                              </div>
                              <div>
                                <h3 className="font-bold text-white text-base">{user.name}</h3>
                                {addr.isDefault && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[9px] font-bold bg-[#c0c1ff]/15 text-[#c0c1ff] mt-1 border border-[#c0c1ff]/20 uppercase tracking-wider">
                                    Default Address
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1.5 mb-6 flex-1 z-10 text-[#c7c4d7] text-xs">
                            <p>{addr.street}</p>
                            <p>{addr.city}, {addr.state} {addr.postalCode}</p>
                            <p>{addr.country}</p>
                          </div>

                          <div className="flex gap-2 pt-4 border-t border-[#464554]/15 z-10">
                            <button
                              onClick={() => handleEditAddress(addr)}
                              className="flex-1 flex items-center justify-center gap-1.5 bg-[#34343d]/50 hover:bg-[#34343d] text-white py-2 rounded-lg text-xs font-semibold transition border border-[#464554]/20 cursor-pointer"
                            >
                              <Edit size={13} />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => deleteAddressMutation.mutate(addr._id!)}
                              className="p-2 bg-[#34343d]/50 hover:bg-[#ffb4ab]/10 text-[#c7c4d7] hover:text-[#ffb4ab] border border-[#464554]/20 hover:border-[#ffb4ab]/20 rounded-lg transition cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* WISHLIST TAB VIEW */}
          {activeTab === 'wishlist' && (
            <div className="space-y-6">
              {wishlistLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="aspect-square rounded-xl bg-[#1f1f27] animate-pulse" />
                  <div className="aspect-square rounded-xl bg-[#1f1f27] animate-pulse" />
                </div>
              ) : wishlistProducts.length === 0 ? (
                <div className="bg-[#1f1f27] border border-[#464554]/10 rounded-xl p-12 text-center shadow-lg">
                  <Heart size={40} className="mx-auto text-[#908fa0] mb-4 opacity-50" />
                  <p className="text-sm text-[#c7c4d7]">Your wishlist is currently empty.</p>
                  <Link
                    href="/catalog"
                    className="inline-block mt-4 bg-[#c0c1ff] text-[#1000a9] px-6 py-2.5 rounded-lg text-xs font-bold hover:brightness-110 transition"
                  >
                    Browse Sound Devices
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {wishlistProducts.map((prod) => {
                    const fallbackImg = 'https://www.gstatic.com/labs-code/stitch/stitch-placeholder-300x300.svg';
                    const ratingValue = prod.rating || 4.8;
                    const reviewCount = prod.numReviews || 82;
                    const isLowStock = prod.stock > 0 && prod.stock <= 5;
                    const isOutOfStock = prod.stock === 0;

                    return (
                      <article
                        key={prod._id}
                        className="bg-[#1f1f27] rounded-xl p-4 flex flex-col group hover:bg-[#292932] transition-colors duration-300 relative border border-[#292932] hover:border-[#464554]/50 shadow-sm"
                      >
                        {/* Image Canvas */}
                        <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-[#13121a] mb-4">
                          <img
                            alt={prod.name}
                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                            src={prod.images?.[0] || fallbackImg}
                          />
                          {/* Close / Remove button */}
                          <button
                            onClick={async (e) => {
                              e.preventDefault();
                              await apiRequest(`/users/wishlist/${prod._id}`, { method: 'POST' });
                              queryClient.invalidateQueries({ queryKey: ['wishlist'] });
                              syncMe();
                              toast.success('Removed from wishlist');
                            }}
                            className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-black/80 transition cursor-pointer"
                          >
                            <X size={14} />
                          </button>
                          {/* Stock Badge */}
                          {!isOutOfStock ? (
                            <div className={`absolute bottom-2.5 left-2.5 px-2 py-1 rounded flex items-center gap-1.5 backdrop-blur-sm ${isLowStock ? 'bg-[#d97721]/20 border border-[#ffb783]/30' : 'bg-black/60 border border-[#464554]/25'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isLowStock ? 'bg-[#ffb783]' : 'bg-[#c0c1ff] animate-pulse'}`}></span>
                              <span className={`font-semibold text-[9px] ${isLowStock ? 'text-[#ffb783]' : 'text-white'}`}>
                                {isLowStock ? 'Low Stock' : 'In Stock'}
                              </span>
                            </div>
                          ) : (
                            <div className="absolute bottom-2.5 left-2.5 px-2 py-1 rounded flex items-center gap-1.5 bg-[#ffb4ab]/15 border border-[#ffb4ab]/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#ffb4ab]"></span>
                              <span className="font-semibold text-[9px] text-[#ffb4ab]">Out of Stock</span>
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 flex flex-col">
                          {/* Name + Price on same row */}
                          <div className="flex justify-between items-baseline gap-2 mb-2">
                            <h3 className="font-bold text-white text-[15px] leading-snug group-hover:text-[#c0c1ff] transition-colors line-clamp-2">
                              {prod.name}
                            </h3>
                            <p className="font-bold text-[#c0c1ff] text-[15px] shrink-0">${prod.price.toFixed(2)}</p>
                          </div>

                          {/* Star Ratings */}
                          <div className="flex items-center gap-1.5 mb-4">
                            {renderStars(ratingValue)}
                            <span className="text-[#c7c4d7] text-[11px]">{ratingValue} ({reviewCount} reviews)</span>
                          </div>

                          {/* Add to Cart button */}
                          <button
                            disabled={isOutOfStock}
                            onClick={() => {
                              if (isOutOfStock) return;
                              addItem({
                                productId: prod._id,
                                name: prod.name,
                                slug: prod.slug,
                                price: prod.price,
                                image: prod.images?.[0] || fallbackImg,
                                quantity: 1,
                                stock: prod.stock || 10,
                                selectedSize: prod.sizes?.[0],
                                selectedColor: prod.colors?.[0]?.name
                              });
                              toast.success(`${prod.name} added to cart`);
                            }}
                            className="mt-auto w-full py-2.5 px-4 rounded-lg bg-[#6366f1] hover:bg-[#818cf8] disabled:bg-[#464554]/50 disabled:cursor-not-allowed text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#6366f1]/20 active:scale-[0.98]"
                          >
                            <ShoppingBag size={14} />
                            <span>Add to Cart</span>
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SETTINGS VIEW PANEL */}
          {activeTab === 'settings' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* Profile Details Edit Card */}
              <div className="bg-[#1f1f27] border border-[#464554]/10 p-6 sm:p-8 rounded-2xl shadow-lg space-y-6">
                <h3 className="text-base font-bold text-white uppercase tracking-wider border-b border-[#464554]/10 pb-3 flex items-center gap-2">
                  <UserIcon size={16} className="text-[#c0c1ff]" />
                  <span>Personal Profile</span>
                </h3>

                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#c7c4d7]">Display Name</label>
                    <input
                      type="text"
                      required
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full px-4 py-3 text-xs bg-[#13121a] border border-[#464554]/20 rounded-xl text-white focus:ring-1 focus:ring-[#c0c1ff] focus:border-[#c0c1ff] outline-none transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#c7c4d7]">Avatar Image URL</label>
                    <input
                      type="text"
                      value={profileAvatar}
                      onChange={(e) => setProfileAvatar(e.target.value)}
                      className="w-full px-4 py-3 text-xs bg-[#13121a] border border-[#464554]/20 rounded-xl text-white focus:ring-1 focus:ring-[#c0c1ff] focus:border-[#c0c1ff] outline-none transition"
                      placeholder="https://..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={profileMutation.isPending}
                    className="w-full py-3 bg-[#c0c1ff] text-[#1000a9] font-bold text-xs rounded-xl hover:brightness-110 active:scale-[0.98] transition cursor-pointer shadow-lg shadow-[#c0c1ff]/10"
                  >
                    {profileMutation.isPending ? 'Updating...' : 'Update Details'}
                  </button>
                </form>
              </div>

              {/* Password Change Edit Card */}
              <div className="bg-[#1f1f27] border border-[#464554]/10 p-6 sm:p-8 rounded-2xl shadow-lg space-y-6">
                <h3 className="text-base font-bold text-white uppercase tracking-wider border-b border-[#464554]/10 pb-3 flex items-center gap-2">
                  <Lock size={16} className="text-[#c0c1ff]" />
                  <span>Security Password</span>
                </h3>

                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#c7c4d7]">Current Password</label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-4 py-3 text-xs bg-[#13121a] border border-[#464554]/20 rounded-xl text-white focus:ring-1 focus:ring-[#c0c1ff] focus:border-[#c0c1ff] outline-none transition pr-10"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#908fa0] hover:text-white transition cursor-pointer"
                      >
                        {showCurrentPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#c7c4d7]">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-3 text-xs bg-[#13121a] border border-[#464554]/20 rounded-xl text-white focus:ring-1 focus:ring-[#c0c1ff] focus:border-[#c0c1ff] outline-none transition pr-10"
                        placeholder="•••••••• (Min 6 chars)"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#908fa0] hover:text-white transition cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={passwordMutation.isPending}
                    className="w-full py-3 bg-[#c0c1ff] text-[#1000a9] font-bold text-xs rounded-xl hover:brightness-110 active:scale-[0.98] transition cursor-pointer shadow-lg shadow-[#c0c1ff]/10"
                  >
                    {passwordMutation.isPending ? 'Updating...' : 'Change Password'}
                  </button>
                </form>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* 5. Detailed Tracking Timeline Dialog Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-center items-center p-4">
          <div className="w-full max-w-xl bg-[#1b1b23] border border-[#464554]/20 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col relative">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 right-4 p-1.5 text-[#c7c4d7] hover:text-white hover:bg-[#34343d]/60 rounded-full transition cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex justify-between items-center border-b border-[#464554]/15 pb-4 mb-6">
              <h3 className="text-base font-bold uppercase tracking-wider text-white">Order Tracking Details</h3>
            </div>

            {/* Modal Tracker Timeline */}
            <div className="relative py-6 px-2 mb-6">
              <div className="absolute top-[50%] left-6 right-6 h-[2px] bg-[#34343d] -translate-y-1/2"></div>
              <div
                style={{
                  width: `${selectedOrder.orderStatus === 'placed' ? '0%' :
                    selectedOrder.orderStatus === 'processing' ? '33.33%' :
                      selectedOrder.orderStatus === 'shipped' || selectedOrder.orderStatus === 'packed' ? '66.66%' : '100%'
                    }`
                }}
                className="absolute top-[50%] left-6 max-w-[calc(100%-48px)] h-[2px] bg-[#c0c1ff] -translate-y-1/2 transition-all duration-700"
              />

              <div className="relative flex justify-between gap-2">
                {/* Placed */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#c0c1ff] flex items-center justify-center text-[#1000a9] z-10 shadow-md">
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">Placed</span>
                </div>

                {/* Processing */}
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 shadow-md ${selectedOrder.orderStatus !== 'placed'
                    ? 'bg-[#c0c1ff] text-[#1000a9]'
                    : 'bg-[#1b1b23] text-[#c0c1ff] border border-[#c0c1ff]/30'
                    }`}>
                    {selectedOrder.orderStatus !== 'placed' ? (
                      <Check size={14} strokeWidth={3} />
                    ) : (
                      <div className="w-2 h-2 bg-[#c0c1ff] rounded-full animate-pulse" />
                    )}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${selectedOrder.orderStatus !== 'placed' ? 'text-white' : 'text-[#908fa0]'}`}>
                    Processing
                  </span>
                </div>

                {/* Shipped */}
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 shadow-md ${selectedOrder.orderStatus === 'shipped' || selectedOrder.orderStatus === 'out-for-delivery' || selectedOrder.orderStatus === 'delivered'
                    ? 'bg-[#c0c1ff] text-[#1000a9]'
                    : selectedOrder.orderStatus === 'processing'
                      ? 'bg-[#1b1b23] text-[#c0c1ff] border border-[#c0c1ff]/30'
                      : 'bg-[#1b1b23] text-[#908fa0] border border-[#464554]/30'
                    }`}>
                    {selectedOrder.orderStatus === 'shipped' || selectedOrder.orderStatus === 'out-for-delivery' || selectedOrder.orderStatus === 'delivered' ? (
                      <Check size={14} strokeWidth={3} />
                    ) : selectedOrder.orderStatus === 'processing' ? (
                      <div className="w-2 h-2 bg-[#c0c1ff] rounded-full animate-pulse" />
                    ) : (
                      <Truck size={12} />
                    )}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${selectedOrder.orderStatus === 'shipped' || selectedOrder.orderStatus === 'out-for-delivery' || selectedOrder.orderStatus === 'delivered'
                    ? 'text-white'
                    : 'text-[#908fa0]'
                    }`}>
                    Shipped
                  </span>
                </div>

                {/* Delivered */}
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 shadow-md ${selectedOrder.orderStatus === 'delivered'
                    ? 'bg-[#c0c1ff] text-[#1000a9]'
                    : selectedOrder.orderStatus === 'out-for-delivery'
                      ? 'bg-[#1b1b23] text-[#c0c1ff] border border-[#c0c1ff]/30'
                      : 'bg-[#1b1b23] text-[#908fa0] border border-[#464554]/30'
                    }`}>
                    {selectedOrder.orderStatus === 'delivered' ? (
                      <Check size={14} strokeWidth={3} />
                    ) : selectedOrder.orderStatus === 'out-for-delivery' ? (
                      <div className="w-2 h-2 bg-[#c0c1ff] rounded-full animate-pulse" />
                    ) : (
                      <Package size={12} />
                    )}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${selectedOrder.orderStatus === 'delivered' || selectedOrder.orderStatus === 'out-for-delivery' ? 'text-white' : 'text-[#908fa0]'
                    }`}>
                    Delivered
                  </span>
                </div>
              </div>
            </div>

            {/* Package Details */}
            <div className="bg-[#13121a] border border-[#464554]/15 rounded-xl p-4 space-y-3 mb-6 text-xs max-h-[160px] overflow-y-auto">
              <h4 className="font-bold text-[10px] text-[#c7c4d7] uppercase tracking-wider border-b border-[#464554]/10 pb-2">Package Details</h4>
              {selectedOrder.products.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span className="text-white font-medium">{item.product?.name} {item.selectedSize ? `(${item.selectedSize})` : ''}</span>
                  <span className="text-[#c7c4d7]">Qty: {item.quantity} | ${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center text-xs font-semibold border-t border-[#464554]/15 pt-4">
              <span className="text-[#c7c4d7]">Stripe Transaction: <code className="bg-[#34343d]/60 px-1.5 py-0.5 rounded text-[10px] font-bold text-white">{selectedOrder.stripePaymentIntentId?.slice(-10) || 'mock-trans'}</code></span>
              <span className="text-[#c0c1ff] text-sm font-bold">Total: ${selectedOrder.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { apiRequest } from '../../services/api';
import { Product, Category, Order, User } from '../../types';
import {
  Sliders,
  TrendingUp,
  ShoppingBag,
  FolderOpen,
  Users as UsersIcon,
  Plus,
  Trash2,
  Edit2,
  RotateCcw,
  Check,
  CheckCircle,
  Truck,
  Package,
  Calendar,
  Eye,
  Settings,
  Star,
  Bell,
  Download,
  Search,
  ChevronDown,
  Sparkle,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  LayoutGrid,
  List,
  AlertTriangle,
  Ban,
  Volume2,
  Zap,
  Speaker,
  Lightbulb,
  Headphones,
  RefreshCw,
  Smile,
  LogOut,
  Upload,
  ImageIcon,
  X as XIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import toast from 'react-hot-toast';

export default function AdminPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
      logout();
      toast.success('Logged out successfully');
      router.push('/login');
    } catch (err) {
      toast.error('Logout failed');
    }
  };
  const [activeTab, setActiveTab] = useState<'analytics' | 'products' | 'categories' | 'orders' | 'users' | 'settings'>('analytics');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [categoryFiltersOpen, setCategoryFiltersOpen] = useState(false);
  const [orderFiltersOpen, setOrderFiltersOpen] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);

  // Custom confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { }
  });

  // Settings editable state
  const [stripeWebhookSecret, setStripeWebhookSecret] = useState('whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
  const [stripeForwardingEndpoint, setStripeForwardingEndpoint] = useState('http://localhost:5000/api/orders/webhook');
  const [imagekitPublicKey, setImagekitPublicKey] = useState('public_IKxxxxxxxxxxxxxxxxxxxxxxxx');
  const [imagekitUrlEndpoint, setImagekitUrlEndpoint] = useState('https://ik.imagekit.io/aura-premium-edc');

  // Load settings on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedWebhook = localStorage.getItem('stripe_webhook_secret');
      const savedForwarding = localStorage.getItem('stripe_forwarding_endpoint');
      const savedPublicKey = localStorage.getItem('imagekit_public_key');
      const savedUrlEndpoint = localStorage.getItem('imagekit_url_endpoint');
      if (savedWebhook) setStripeWebhookSecret(savedWebhook);
      if (savedForwarding) setStripeForwardingEndpoint(savedForwarding);
      if (savedPublicKey) setImagekitPublicKey(savedPublicKey);
      if (savedUrlEndpoint) setImagekitUrlEndpoint(savedUrlEndpoint);
    }
  }, []);

  const handleSaveSettings = () => {
    localStorage.setItem('stripe_webhook_secret', stripeWebhookSecret);
    localStorage.setItem('stripe_forwarding_endpoint', stripeForwardingEndpoint);
    localStorage.setItem('imagekit_public_key', imagekitPublicKey);
    localStorage.setItem('imagekit_url_endpoint', imagekitUrlEndpoint);
    toast.success('Console settings saved successfully');
  };

  // Prevent Recharts hydration mismatch
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Protect Admin Route
  useEffect(() => {
    const checkAdmin = setTimeout(() => {
      if (!isAuthenticated || user?.role !== 'admin') {
        toast.error('Access denied. Administrator privileges required.');
        router.push('/');
      }
    }, 1500);

    return () => clearTimeout(checkAdmin);
  }, [isAuthenticated, user, router]);

  // Forms states
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productData, setProductData] = useState({
    name: '',
    sku: '',
    description: '',
    categories: [] as string[],
    price: 0,
    discountPrice: 0,
    stock: 0,
    images: [] as string[],
    sizes: [] as string[],
    colors: [] as { name: string; hex: string }[]
  });
  const [imageUploading, setImageUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload a File object to ImageKit via backend
  const uploadImageToImageKit = useCallback(async (file: File): Promise<string | null> => {
    setImageUploading(true);
    try {
      return await new Promise<string | null>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const base64 = e.target?.result as string;
            const res = await apiRequest('/imagekit/upload', {
              method: 'POST',
              data: {
                file: base64,
                fileName: file.name,
                folder: '/products',
              },
            });
            if (res.success && res.url) {
              resolve(res.url);
            } else {
              reject(new Error('Upload failed'));
            }
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = () => reject(new Error('File read failed'));
        reader.readAsDataURL(file);
      });
    } catch (err: any) {
      toast.error(err.message || 'Image upload failed');
      return null;
    } finally {
      setImageUploading(false);
    }
  }, []);

  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState('');

  // Search & Filtering States
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('All');
  const [productStockFilter, setProductStockFilter] = useState('All');

  const [categorySearch, setCategorySearch] = useState('');
  const [categoryStatusFilter, setCategoryStatusFilter] = useState('All');

  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('All');

  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('All');
  const [userStatusFilter, setUserStatusFilter] = useState('All');

  // Fetch admin analytics
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['adminAnalytics'],
    queryFn: () => apiRequest('/admin/analytics'),
    enabled: isAuthenticated && user?.role === 'admin'
  });

  // Fetch products
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['adminProducts'],
    queryFn: () => apiRequest('/products?limit=50'),
    enabled: isAuthenticated && user?.role === 'admin' && activeTab === 'products'
  });

  // Fetch categories
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['adminCategories'],
    queryFn: () => apiRequest('/categories'),
    enabled: isAuthenticated && user?.role === 'admin'
  });

  // Fetch orders
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['adminOrders'],
    queryFn: () => apiRequest('/admin/orders'),
    enabled: isAuthenticated && user?.role === 'admin' && activeTab === 'orders'
  });

  // Fetch users
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => apiRequest('/admin/users'),
    enabled: isAuthenticated && user?.role === 'admin' && activeTab === 'users'
  });

  // Mutations
  const productMutation = useMutation({
    mutationFn: (data: typeof productData) => {
      // Fix values
      const payload = {
        ...data,
        price: Number(data.price),
        discountPrice: data.discountPrice ? Number(data.discountPrice) : undefined,
        stock: Number(data.stock),
      };

      if (editingProductId) {
        return apiRequest(`/admin/products/${editingProductId}`, {
          method: 'PUT',
          data: payload,
        });
      }
      return apiRequest('/admin/products', {
        method: 'POST',
        data: payload,
      });
    },
    onSuccess: () => {
      toast.success(editingProductId ? 'Product updated' : 'Product created');
      setProductFormOpen(false);
      setEditingProductId(null);
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
    },
    onError: (err: any) => {
      // Show specific field-level validation errors if available
      if (err.errors && Array.isArray(err.errors) && err.errors.length > 0) {
        const fieldErrors = err.errors.map((e: any) => `${e.field}: ${e.message}`).join('\n');
        toast.error(`Validation failed:\n${fieldErrors}`, { duration: 5000 });
      } else {
        toast.error(err.message || 'Product operation failed');
      }
    }

  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/admin/products/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Product deleted');
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
    },
  });

  const categoryMutation = useMutation({
    mutationFn: (name: string) => {
      if (editingCategoryId) {
        return apiRequest(`/admin/categories/${editingCategoryId}`, {
          method: 'PUT',
          data: { name },
        });
      }
      return apiRequest('/admin/categories', {
        method: 'POST',
        data: { name },
      });
    },
    onSuccess: () => {
      toast.success(editingCategoryId ? 'Category updated' : 'Category created');
      setCategoryFormOpen(false);
      setEditingCategoryId(null);
      setCategoryName('');
      queryClient.invalidateQueries({ queryKey: ['adminCategories'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Category operation failed');
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/admin/categories/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Category deleted');
      queryClient.invalidateQueries({ queryKey: ['adminCategories'] });
    },
  });

  const orderStatusMutation = useMutation({
    mutationFn: ({ id, orderStatus }: { id: string; orderStatus: string }) =>
      apiRequest(`/admin/orders/${id}/status`, { method: 'PUT', data: { orderStatus } }),
    onSuccess: () => {
      toast.success('Order status updated');
      queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
    },
  });

  const refundMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/admin/orders/${id}/refund`, { method: 'POST' }),
    onSuccess: () => {
      toast.success('Refund completed successfully');
      queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
      queryClient.invalidateQueries({ queryKey: ['adminAnalytics'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Refund failed');
    }
  });

  const userStatusMutation = useMutation({
    mutationFn: ({ id, isSuspended, role }: { id: string; isSuspended?: boolean; role?: string }) =>
      apiRequest(`/admin/users/${id}/status`, { method: 'PUT', data: { isSuspended, role } }),
    onSuccess: () => {
      toast.success('User privileges updated');
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update user privileges');
    }
  });

  // Event Handlers
  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (productData.categories.length === 0) {
      toast.error('Please select at least one category!');
      return;
    }
    productMutation.mutate(productData);
  };

  const handleEditProduct = (prod: Product) => {
    setEditingProductId(prod._id);
    // Support both new categories[] and legacy category field
    const existingCats = prod.categories?.length > 0
      ? prod.categories.map((c) => c._id)
      : prod.category?._id ? [prod.category._id] : [];
    setProductData({
      name: prod.name,
      sku: prod.sku,
      description: prod.description,
      categories: existingCats,
      price: prod.price,
      discountPrice: prod.discountPrice || 0,
      stock: prod.stock,
      images: prod.images,
      sizes: prod.sizes || [],
      colors: prod.colors || []
    });
    setProductFormOpen(true);
  };

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    categoryMutation.mutate(categoryName);
  };

  const handleEditCategory = (cat: Category) => {
    setEditingCategoryId(cat._id);
    setCategoryName(cat.name);
    setCategoryFormOpen(true);
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="h-10 w-10 border-4 border-brand-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-brand-muted mt-4">Verifying administrator credentials...</p>
      </div>
    );
  }

  const metrics = analyticsData?.metrics || { totalRevenue: 0, totalOrders: 0, totalCustomers: 0, totalProducts: 0 };
  const dbChartData = analyticsData?.chartData || [];
  const topProducts = analyticsData?.topProducts || [];
  const recentOrders = analyticsData?.recentOrders || [];

  const categories: Category[] = categoriesData?.categories || [];
  const products: Product[] = productsData?.products || [];
  const orders: Order[] = ordersData?.orders || [];
  const users: User[] = usersData?.users || [];

  const dynamicTotalProducts = products.length;
  const dynamicLowStock = products.filter(p => p.stock > 0 && p.stock <= 5).length;
  const dynamicOutOfStock = products.filter(p => p.stock === 0).length;

  const totalProductsCount = dynamicTotalProducts > 0 ? dynamicTotalProducts : 1284;
  const lowStockCount = dynamicTotalProducts > 0 ? dynamicLowStock : 24;
  const outOfStockCount = dynamicTotalProducts > 0 ? dynamicOutOfStock : 8;

  // Category Metas and fallbacks
  const getCategoryMeta = (slug: string, name: string) => {
    const s = (slug || name || '').toLowerCase();
    if (s.includes('headphone')) {
      return {
        desc: 'Over-ear & On-ear premium sets',
        icon: <Headphones size={16} />
      };
    }
    if (s.includes('earbud') || s.includes('wireless') || s.includes('ear') || s.includes('bud')) {
      return {
        desc: 'True wireless & in-ear monitors',
        icon: <Volume2 size={16} />
      };
    }
    if (s.includes('charger') || s.includes('cable') || s.includes('power') || s.includes('zap')) {
      return {
        desc: 'Fast charging & cables',
        icon: <Zap size={16} />
      };
    }
    if (s.includes('home-audio') || s.includes('speaker') || s.includes('audio') || s.includes('soundbar') || s.includes('sound')) {
      return {
        desc: 'Soundbars & bookshelf speakers',
        icon: <Speaker size={16} />
      };
    }
    return {
      desc: 'Premium curated audio selection',
      icon: <FolderOpen size={16} />
    };
  };

  const displayCategories = categories.length > 0 ? categories : [
    { _id: 'mock-cat-1', name: 'Headphones', slug: 'headphones' },
    { _id: 'mock-cat-2', name: 'Earbuds', slug: 'earbuds' },
    { _id: 'mock-cat-3', name: 'Chargers', slug: 'chargers' },
    { _id: 'mock-cat-4', name: 'Home Audio', slug: 'home-audio' },
  ];

  const totalCategoriesCount = categories.length > 0 ? categories.length : 14;
  const categoryProductsCount = products.length > 0 ? products.length : 168;

  // Helper: Count products belonging to a category
  const getProductCountForCategory = (catId: string) => {
    if (catId.startsWith('mock-cat-')) {
      if (catId === 'mock-cat-1') return 24;
      if (catId === 'mock-cat-2') return 18;
      if (catId === 'mock-cat-3') return 12;
      if (catId === 'mock-cat-4') return 8;
    }
    return products.filter((p) => p.category?._id === catId || (p.category as any) === catId).length;
  };

  // Filtered Products
  const filteredProducts = products.filter((prod) => {
    const matchesSearch = prod.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      prod.sku.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCategory = productCategoryFilter === 'All' || prod.category?._id === productCategoryFilter || (prod.category as any) === productCategoryFilter;
    let matchesStock = true;
    if (productStockFilter === 'In Stock') matchesStock = prod.stock > 0;
    else if (productStockFilter === 'Low Stock') matchesStock = prod.stock > 0 && prod.stock <= 5;
    else if (productStockFilter === 'Out of Stock') matchesStock = prod.stock === 0;
    return matchesSearch && matchesCategory && matchesStock;
  });

  // Filtered Categories
  const filteredCategories = displayCategories.filter((cat) => {
    const matchesSearch = cat.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
      cat.slug.toLowerCase().includes(categorySearch.toLowerCase());
    const hasProducts = getProductCountForCategory(cat._id) > 0;
    let matchesStatus = true;
    if (categoryStatusFilter === 'Active') matchesStatus = hasProducts;
    else if (categoryStatusFilter === 'Inactive') matchesStatus = !hasProducts;
    return matchesSearch && matchesStatus;
  });

  // Initials badge background hash helper
  const getInitialsBg = (name: string) => {
    const colors = [
      'bg-[#818cf8]/20 text-[#818cf8] border border-[#818cf8]/30',
      'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      'bg-amber-500/20 text-amber-400 border border-amber-500/30',
      'bg-rose-500/20 text-rose-400 border border-rose-500/30',
      'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Orders — use real API data only, no mock fallback
  const totalOrdersCount = orders.length;
  const pendingOrdersCount = orders.filter(
    (o) => o.orderStatus === 'placed' || o.orderStatus === 'processing' || o.orderStatus === 'packed'
  ).length;
  const refundedOrdersCount = orders.filter((o) => o.paymentStatus === 'refunded').length;

  // Filtered Orders
  const filteredOrders = orders.filter((ord) => {
    const custName = (ord.user && typeof ord.user === 'object') ? ord.user.name : 'Guest';
    const custEmail = (ord.user && typeof ord.user === 'object') ? ord.user.email : '';
    const matchesSearch = ord._id.toLowerCase().includes(orderSearch.toLowerCase()) ||
      custName.toLowerCase().includes(orderSearch.toLowerCase()) ||
      custEmail.toLowerCase().includes(orderSearch.toLowerCase());
    const matchesStatus = orderStatusFilter === 'All' || ord.orderStatus === orderStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const dbUsers = users || [];
  const displayUsers = dbUsers;

  // Filtered Users/Customers
  const filteredUsers = displayUsers.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.role.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = userRoleFilter === 'All' || u.role === userRoleFilter.toLowerCase();
    let matchesStatus = true;
    if (userStatusFilter === 'Active') matchesStatus = !u.isSuspended;
    else if (userStatusFilter === 'Suspended') matchesStatus = !!u.isSuspended;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const activeUsersCount = dbUsers.filter((u) => !u.isSuspended).length;
  const suspendedUsersCount = dbUsers.filter((u) => u.isSuspended).length;
  const adminsCount = dbUsers.filter((u) => u.role === 'admin').length;

  // Sparkline mockup data
  const salesSpark = [
    { val: 120 }, { val: 140 }, { val: 130 }, { val: 170 }, { val: 160 }, { val: 200 }, { val: 180 }, { val: 220 }
  ];
  const ordersSpark = [
    { val: 100 }, { val: 110 }, { val: 105 }, { val: 130 }, { val: 125 }, { val: 150 }, { val: 140 }, { val: 165 }
  ];
  const customersSpark = [
    { val: 800 }, { val: 820 }, { val: 810 }, { val: 850 }, { val: 840 }, { val: 880 }, { val: 870 }, { val: 890 }
  ];
  const conversionSpark = [
    { val: 3.2 }, { val: 3.1 }, { val: 2.9 }, { val: 2.8 }, { val: 2.7 }, { val: 2.8 }, { val: 2.6 }, { val: 2.5 }
  ];

  const liveMetrics = analyticsData?.metrics || { totalRevenue: 0, totalOrders: 0, totalCustomers: 0, totalProducts: 0 };
  const displayMetrics = {
    totalRevenue: liveMetrics.totalRevenue || 128450,
    totalOrders: liveMetrics.totalOrders || 1420,
    totalCustomers: liveMetrics.totalCustomers || 890,
    totalProducts: liveMetrics.totalProducts || 12,
    conversionRate: 2.8,
  };

  const rawChartData = analyticsData?.chartData || [];
  const chartData = (rawChartData.length > 0 && rawChartData.some((d: any) => d.sales > 0))
    ? rawChartData
    : [
      { month: 'May', sales: 45000, orders: 40000 },
      { month: 'Jun', sales: 51000, orders: 48000 },
      { month: 'Jul', sales: 48000, orders: 51000 },
      { month: 'Aug', sales: 62000, orders: 55000 },
      { month: 'Sep', sales: 60000, orders: 58000 },
      { month: 'Oct', sales: 72000, orders: 74000 },
    ];

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#121118] text-white flex font-sans">
      {/* Sidebar Navigation */}
      <aside className="h-full w-64 flex flex-col py-6 bg-[#13121a] border-r border-[#22212a] flex-shrink-0">
        <div

          className="px-6 mb-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-[0_0_12px_rgba(99,102,241,0.4)]">
            <Sparkle size={20} className="fill-white stroke-none" />
          </div>
          <div>
            <h1 className="font-semibold text-lg text-white leading-tight tracking-tight">AURA</h1>
            <p className="text-[10px] text-gray-500 font-medium tracking-wider uppercase opacity-70">Admin Console</p>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left cursor-pointer ${activeTab === 'analytics'
              ? 'text-white font-bold bg-white/5 border-r-2 border-[#818cf8]'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
          >
            <TrendingUp size={16} />
            <span className="text-xs font-semibold tracking-wide">Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left cursor-pointer ${activeTab === 'products'
              ? 'text-white font-bold bg-white/5 border-r-2 border-[#818cf8]'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
          >
            <ShoppingBag size={16} />
            <span className="text-xs font-semibold tracking-wide">Products</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left cursor-pointer ${activeTab === 'categories'
              ? 'text-white font-bold bg-white/5 border-r-2 border-[#818cf8]'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
          >
            <FolderOpen size={16} />
            <span className="text-xs font-semibold tracking-wide">Categories</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left cursor-pointer ${activeTab === 'orders'
              ? 'text-white font-bold bg-white/5 border-r-2 border-[#818cf8]'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
          >
            <Package size={16} />
            <span className="text-xs font-semibold tracking-wide">Orders</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left cursor-pointer ${activeTab === 'users'
              ? 'text-white font-bold bg-white/5 border-r-2 border-[#818cf8]'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
          >
            <UsersIcon size={16} />
            <span className="text-xs font-semibold tracking-wide">Customers</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left cursor-pointer ${activeTab === 'settings'
              ? 'text-white font-bold bg-white/5 border-r-2 border-[#818cf8]'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
          >
            <Settings size={16} />
            <span className="text-xs font-semibold tracking-wide">Settings</span>
          </button>
        </nav>

        {/* Profile info */}
        <div className="mt-auto px-4 pt-6 border-t border-[#22212a]">
          <div className="p-3 rounded-xl bg-[#1c1b22] border border-[#22212a] flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border border-[#2e2d38]">
              <img
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80"
                alt="Alex Rivera"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{user.name || 'Alex Rivera'}</p>
              <p className="text-[9px] text-[#818cf8] uppercase tracking-wider font-bold">SUPER ADMIN</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#121118]">
        {/* Top App Bar */}
        <header className="flex justify-between items-center px-6 w-full h-16 bg-[#121118]/80 backdrop-blur-md border-b border-[#22212a] flex-shrink-0">
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <div className="relative w-full">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Search size={14} className="opacity-60" />
              </span>
              <input
                className="w-full bg-[#13121a] border border-[#22212a] rounded-lg pl-10 pr-4 py-2 text-xs focus:ring-1 focus:ring-[#818cf8] focus:border-[#818cf8] text-white placeholder-gray-500 outline-none transition"
                placeholder="Search analytics, products, or orders..."
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-gray-400 hover:text-white p-1.5 transition cursor-pointer">
              <Bell size={16} />
            </button>
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-rose-400 p-1.5 transition flex items-center gap-1.5 cursor-pointer"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
            <div className="h-4 w-px bg-[#22212a]"></div>
            <span className="text-xs font-semibold text-gray-400">Console V2.4</span>
            <div className="w-8 h-8 rounded-full overflow-hidden border border-[#2e2d38]">
              <img
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80"
                alt="Alex Rivera"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar">
          {/* Tab Panels */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Analytics Overview</h2>
                  <p className="text-xs text-gray-400 mt-1">Welcome back. Here's what's happening with AURA today.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button className="flex items-center gap-2 bg-[#1c1b22] border border-[#22212a] rounded-lg px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#292832] transition">
                    <Calendar size={14} className="text-gray-400" />
                    <span>Last 30 Days</span>
                    <ChevronDown size={12} className="text-gray-400 ml-1" />
                  </button>
                  <button className="flex items-center gap-2 bg-[#6366f1] hover:bg-[#4f46e5] text-white rounded-lg px-4 py-2.5 text-xs font-semibold transition shadow-[0_4px_12px_rgba(99,102,241,0.2)]">
                    <Download size={14} />
                    <span>Export Report</span>
                  </button>
                </div>
              </div>

              {/* KPI Cards */}
              {analyticsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-40 bg-[#1c1b22] rounded-xl border border-[#22212a]" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Sales */}
                  <div className="bg-[#1c1b22] border border-[#22212a] p-6 rounded-xl hover:shadow-[0_0_20px_rgba(99,102,241,0.1)] transition-all duration-300 flex flex-col justify-between h-40 relative">
                    <div className="flex justify-between items-start">
                      <div className="w-9 h-9 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                        <TrendingUp size={16} />
                      </div>
                      <span className="text-emerald-400 text-[11px] font-bold flex items-center gap-0.5">
                        +12.5% <ArrowUpRight size={12} />
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mt-2">Total Sales</p>
                      <h3 className="text-2xl font-bold text-white mt-1">${displayMetrics.totalRevenue.toLocaleString()}</h3>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-10 overflow-hidden">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={salesSpark} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="salesSparkGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#818cf8" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Area type="monotone" dataKey="val" stroke="#818cf8" strokeWidth={1.5} fillOpacity={1} fill="url(#salesSparkGrad)" dot={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Orders */}
                  <div className="bg-[#1c1b22] border border-[#22212a] p-6 rounded-xl hover:shadow-[0_0_20px_rgba(99,102,241,0.1)] transition-all duration-300 flex flex-col justify-between h-40 relative">
                    <div className="flex justify-between items-start">
                      <div className="w-9 h-9 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                        <ShoppingBag size={16} />
                      </div>
                      <span className="text-emerald-400 text-[11px] font-bold flex items-center gap-0.5">
                        +5.2% <ArrowUpRight size={12} />
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mt-2">Total Orders</p>
                      <h3 className="text-2xl font-bold text-white mt-1">{displayMetrics.totalOrders.toLocaleString()}</h3>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-10 overflow-hidden">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={ordersSpark} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="ordersSparkGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#818cf8" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Area type="monotone" dataKey="val" stroke="#818cf8" strokeWidth={1.5} fillOpacity={1} fill="url(#ordersSparkGrad)" dot={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Customers */}
                  <div className="bg-[#1c1b22] border border-[#22212a] p-6 rounded-xl hover:shadow-[0_0_20px_rgba(99,102,241,0.1)] transition-all duration-300 flex flex-col justify-between h-40 relative">
                    <div className="flex justify-between items-start">
                      <div className="w-9 h-9 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
                        <UsersIcon size={16} />
                      </div>
                      <span className="text-emerald-400 text-[11px] font-bold flex items-center gap-0.5">
                        +8.1% <ArrowUpRight size={12} />
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mt-2">Active Customers</p>
                      <h3 className="text-2xl font-bold text-white mt-1">{displayMetrics.totalCustomers.toLocaleString()}</h3>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-10 overflow-hidden">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={customersSpark} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="customersSparkGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#fb923c" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#fb923c" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Area type="monotone" dataKey="val" stroke="#fb923c" strokeWidth={1.5} fillOpacity={1} fill="url(#customersSparkGrad)" dot={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Conversion */}
                  <div className="bg-[#1c1b22] border border-[#22212a] p-6 rounded-xl hover:shadow-[0_0_20px_rgba(99,102,241,0.1)] transition-all duration-300 flex flex-col justify-between h-40 relative">
                    <div className="flex justify-between items-start">
                      <div className="w-9 h-9 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 border border-red-500/20">
                        <Percent size={16} />
                      </div>
                      <span className="text-rose-400 text-[11px] font-bold flex items-center gap-0.5">
                        -0.4% <ArrowDownRight size={12} />
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mt-2">Conversion Rate</p>
                      <h3 className="text-2xl font-bold text-white mt-1">{displayMetrics.conversionRate}%</h3>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-10 overflow-hidden">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={conversionSpark} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="conversionSparkGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f87171" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Area type="monotone" dataKey="val" stroke="#f87171" strokeWidth={1.5} fillOpacity={1} fill="url(#conversionSparkGrad)" dot={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* Revenue Trends Chart */}
              {isMounted && chartData.length > 0 && (
                <div className="bg-[#1c1b22] border border-[#22212a] rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h4 className="font-bold text-white text-base">Revenue Trends</h4>
                      <p className="text-xs text-gray-400 mt-1">Monthly revenue projection and actual performance</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#818cf8]"></span>
                        <span className="text-gray-400">Sales</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full border border-dashed border-[#7072ac]"></span>
                        <span className="text-gray-400">Orders</span>
                      </div>
                    </div>
                  </div>
                  <div className="h-72 w-full text-[10px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#818cf8" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} stroke="#22212a" strokeDasharray="3 3" />
                        <XAxis dataKey="month" stroke="#94a3b8" className="opacity-50" tickLine={false} axisLine={false} />
                        <YAxis
                          stroke="#94a3b8"
                          className="opacity-50"
                          tickLine={false}
                          axisLine={false}
                          domain={[40000, 75000]}
                          ticks={[40000, 45000, 50000, 55000, 60000, 65000, 70000, 75000]}
                          tickFormatter={(v) => `$${Math.round(v / 1000)}k`}
                        />
                        <Tooltip contentStyle={{ background: '#13121a', color: '#ffffff', border: '1px solid #22212a', borderRadius: '8px' }} />
                        <Area type="monotone" dataKey="sales" stroke="#818cf8" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" name="Sales" dot={{ fill: '#ffffff', stroke: '#818cf8', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: '#ffffff', stroke: '#818cf8', strokeWidth: 3 }} />
                        <Area type="monotone" dataKey="orders" stroke="#7072ac" strokeWidth={2} strokeDasharray="5 5" fill="none" name="Orders" dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Bottom Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Orders (66%) */}
                <div className="lg:col-span-2 bg-[#1c1b22] border border-[#22212a] rounded-xl overflow-hidden shadow-sm">
                  <div className="p-6 border-b border-[#22212a] flex justify-between items-center">
                    <h4 className="font-bold text-white text-sm">Recent Orders</h4>
                    <button onClick={() => setActiveTab('orders')} className="text-[#818cf8] font-semibold text-xs hover:underline cursor-pointer">View All</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-[#13121a]/50 text-gray-400 font-bold uppercase text-[9px] tracking-wider border-b border-[#22212a]">
                        <tr>
                          <th className="px-6 py-3.5">Order ID</th>
                          <th className="px-6 py-3.5">Customer</th>
                          <th className="px-6 py-3.5">Amount</th>
                          <th className="px-6 py-3.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#22212a]">
                        {recentOrders.map((ord: any) => (
                          <tr key={ord._id} className="hover:bg-[#13121a]/20 transition-colors">
                            <td className="px-6 py-4 font-semibold text-white">#{ord._id.slice(-6)}</td>
                            <td className="px-6 py-4 text-gray-400">{ord.user?.name || 'Guest'}</td>
                            <td className="px-6 py-4 font-semibold text-white">${ord.totalAmount.toFixed(2)}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${ord.paymentStatus === 'paid' ? 'bg-emerald-500/10 text-brand-success' : 'bg-rose-500/10 text-brand-error'
                                }`}>
                                {ord.paymentStatus}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Top Selling Products (33%) */}
                <div className="bg-[#1c1b22] border border-[#22212a] rounded-xl flex flex-col">
                  <div className="p-6 border-b border-[#22212a]">
                    <h4 className="font-bold text-white text-sm">Top Selling Products</h4>
                  </div>
                  <div className="p-6 flex-1 space-y-4">
                    {topProducts.map((prod: any) => (
                      <div key={prod._id} className="flex items-center gap-4 p-1 rounded-lg hover:bg-[#13121a]/30 transition-colors">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#13121a] flex-shrink-0 border border-[#22212a]">
                          <img className="w-full h-full object-cover" src={prod.images[0]} alt="" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="text-white font-bold text-xs truncate">{prod.name}</h5>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1.5 bg-[#13121a] rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${prod.rating * 20}%` }}></div>
                            </div>
                            <span className="text-[10px] text-gray-400 font-bold flex items-center gap-0.5">
                              <Star size={8} className="fill-yellow-500 text-yellow-500" /> {prod.rating}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PRODUCTS TAB */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="bg-[#1c1b22] border border-[#22212a] rounded-2xl p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                <div className="space-y-1 z-10">
                  <h2 className="text-2xl font-extrabold text-white">Product Catalog</h2>
                  <p className="text-gray-400 text-sm">Orchestrate your entire inventory and product lifecycle</p>
                </div>
                <div className="flex items-center gap-3 z-10">
                  <button className="px-4 py-2 bg-[#22212a] border border-[#302f3a] text-white text-xs font-semibold rounded-lg hover:bg-[#2d2c38] transition">Export CSV</button>
                  <button
                    onClick={() => {
                      setEditingProductId(null);
                      setProductData({ name: '', sku: '', description: '', categories: [], price: 0, discountPrice: 0, stock: 0, images: [''], sizes: [], colors: [] });
                      setProductFormOpen(true);
                    }}
                    className="bg-[#6366f1] hover:bg-[#4f46e5] text-white font-bold text-xs px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-[0_0_20px_rgba(99,102,241,0.3)] transition"
                  >
                    <Plus size={16} /> Add New Product
                  </button>
                </div>
              </div>

              {!productFormOpen && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Inventory', val: totalProductsCount.toLocaleString(), color: 'text-white' },
                    { label: 'Low Stock', val: lowStockCount, color: 'text-amber-400' },
                    { label: 'Out of Stock', val: outOfStockCount, color: 'text-rose-400' },
                    { label: 'Categories', val: categories.length, color: 'text-emerald-400' }
                  ].map((stat, i) => (
                    <div key={i} className="bg-[#1c1b22] border border-[#22212a] p-5 rounded-xl">
                      <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">{stat.label}</p>
                      <h4 className={`text-2xl font-black mt-2 ${stat.color}`}>{stat.val}</h4>
                    </div>
                  ))}
                </div>
              )}
              {/* ── PREMIUM CREATE / EDIT FORM ── */}
              {productFormOpen && (
                <div className="bg-[#16151d] border border-[#2a2938] rounded-2xl overflow-hidden shadow-2xl">
                  <div className="flex items-center justify-between px-8 py-5 border-b border-[#2a2938] bg-gradient-to-r from-indigo-600/10 to-transparent">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                        {editingProductId ? <Edit2 size={14} className="text-indigo-400" /> : <Plus size={14} className="text-indigo-400" />}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">{editingProductId ? 'Edit Product' : 'Create New Product'}</h3>
                        <p className="text-[10px] text-gray-500">Fill in all required fields to {editingProductId ? 'update the' : 'publish a new'} product</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => setProductFormOpen(false)} className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition cursor-pointer">
                      <XIcon size={16} />
                    </button>
                  </div>

                  <form onSubmit={handleProductSubmit}>
                    <div className="flex flex-col lg:flex-row">
                      {/* Left — Image */}
                      <div className="lg:w-72 flex-shrink-0 p-6 border-b lg:border-b-0 lg:border-r border-[#2a2938] bg-[#13121a]/50 flex flex-col gap-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Product Images</p>
                        <div className="w-full aspect-square rounded-xl overflow-hidden bg-[#1c1b22] border border-[#2a2938] flex items-center justify-center">
                          {productData.images.filter(Boolean).length > 0
                            ? <img src={productData.images.filter(Boolean)[0]} alt="" className="w-full h-full object-cover" />
                            : <div className="flex flex-col items-center gap-2 text-gray-600"><ImageIcon size={32} /><span className="text-[10px]">No image yet</span></div>
                          }
                        </div>
                        {productData.images.filter(Boolean).length > 0 && (
                          <div className="flex gap-2 flex-wrap">
                            {productData.images.filter(Boolean).map((url, idx) => (
                              <div key={idx} className="relative w-14 h-14 rounded-lg overflow-hidden border-2 group cursor-pointer" style={{ borderColor: idx === 0 ? '#6366f1' : '#2a2938' }}>
                                <img src={url} alt="" className="w-full h-full object-cover" />
                                <button type="button" onClick={() => setProductData({ ...productData, images: productData.images.filter((_, i) => i !== idx) })} className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                  <XIcon size={12} className="text-white" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        <div
                          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                          onDragLeave={() => setIsDragging(false)}
                          onDrop={async (e) => {
                            e.preventDefault(); setIsDragging(false);
                            for (const file of Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))) {
                              const url = await uploadImageToImageKit(file);
                              if (url) setProductData(prev => ({ ...prev, images: [...prev.images.filter(Boolean), url] }));
                            }
                          }}
                          className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${isDragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-[#2a2938] hover:border-indigo-500/40 hover:bg-indigo-500/5'}`}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {imageUploading ? (
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                              <p className="text-[10px] text-indigo-400 font-medium">Uploading to ImageKit...</p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-9 h-9 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20"><Upload size={16} className="text-indigo-400" /></div>
                              <p className="text-[11px] text-gray-400 font-medium">Drop images or <span className="text-indigo-400">browse</span></p>
                              <p className="text-[9px] text-gray-600">PNG · JPG · WebP · ImageKit CDN</p>
                            </div>
                          )}
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={async (e) => {
                          for (const file of Array.from(e.target.files || [])) {
                            const url = await uploadImageToImageKit(file);
                            if (url) setProductData(prev => ({ ...prev, images: [...prev.images.filter(Boolean), url] }));
                          }
                          e.target.value = '';
                        }} />
                        <details>
                          <summary className="text-[10px] text-gray-600 cursor-pointer hover:text-gray-400 transition select-none">Paste URL manually</summary>
                          <input type="text" className="mt-2 w-full px-3 py-2 text-xs bg-[#1c1b22] border border-[#2a2938] rounded-lg text-white outline-none focus:border-indigo-500/60 transition placeholder:text-gray-600" placeholder="https://... press Enter"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') { e.preventDefault(); const v = (e.target as HTMLInputElement).value.trim(); if (v) { setProductData(prev => ({ ...prev, images: [...prev.images.filter(Boolean), v] })); (e.target as HTMLInputElement).value = ''; } }
                            }} />
                        </details>
                      </div>

                      {/* Right — Fields */}
                      <div className="flex-1 p-6 space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Product Name <span className="text-rose-400">*</span></label>
                            <input type="text" required value={productData.name} onChange={(e) => setProductData({ ...productData, name: e.target.value })} className="w-full px-4 py-2.5 text-sm bg-[#1c1b22] border border-[#2a2938] rounded-xl text-white outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition placeholder:text-gray-600" placeholder="AirPods Pro Max" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">SKU Reference <span className="text-rose-400">*</span></label>
                            <input type="text" required value={productData.sku} onChange={(e) => setProductData({ ...productData, sku: e.target.value })} className="w-full px-4 py-2.5 text-sm bg-[#1c1b22] border border-[#2a2938] rounded-xl text-white font-mono outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition placeholder:text-gray-600" placeholder="APP-MAX-BLK" />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Description <span className="text-rose-400">*</span></label>
                          <textarea required value={productData.description} onChange={(e) => setProductData({ ...productData, description: e.target.value })} className="w-full px-4 py-3 text-sm bg-[#1c1b22] border border-[#2a2938] rounded-xl text-white min-h-[100px] outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition resize-none placeholder:text-gray-600" placeholder="Describe the product features..." />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Price (USD) <span className="text-rose-400">*</span></label>
                            <div className="relative"><span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-semibold">$</span><input type="number" required min={0} step={0.01} value={productData.price} onChange={(e) => setProductData({ ...productData, price: Number(e.target.value) })} className="w-full pl-7 pr-4 py-2.5 text-sm bg-[#1c1b22] border border-[#2a2938] rounded-xl text-white outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition" /></div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Sale Price</label>
                            <div className="relative"><span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-semibold">$</span><input type="number" min={0} step={0.01} value={productData.discountPrice || ''} onChange={(e) => setProductData({ ...productData, discountPrice: Number(e.target.value) })} className="w-full pl-7 pr-4 py-2.5 text-sm bg-[#1c1b22] border border-[#2a2938] rounded-xl text-white outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition placeholder:text-gray-600" placeholder="Optional" /></div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Stock Qty <span className="text-rose-400">*</span></label>
                            <input type="number" required min={0} value={productData.stock} onChange={(e) => setProductData({ ...productData, stock: Number(e.target.value) })} className="w-full px-4 py-2.5 text-sm bg-[#1c1b22] border border-[#2a2938] rounded-xl text-white outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Categories <span className="text-rose-400">*</span></label>
                            {productData.categories.length > 0 && (
                              <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                                {productData.categories.length} selected
                              </span>
                            )}
                          </div>
                          {categories.length === 0 ? (
                            <p className="text-[11px] text-gray-600 italic py-2">No categories found. Create one first.</p>
                          ) : (
                            <div className="flex flex-wrap gap-2 p-3 bg-[#13121a] border border-[#2a2938] rounded-xl">
                              {categories.map((c) => {
                                const selected = productData.categories.includes(c._id);
                                return (
                                  <button
                                    key={c._id}
                                    type="button"
                                    onClick={() => {
                                      const next = selected
                                        ? productData.categories.filter((id) => id !== c._id)
                                        : [...productData.categories, c._id];
                                      setProductData({ ...productData, categories: next });
                                    }}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${selected
                                      ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 shadow-[0_0_8px_rgba(99,102,241,0.2)]'
                                      : 'bg-[#1c1b22] border-[#2a2938] text-gray-400 hover:border-indigo-500/30 hover:text-gray-200'
                                      }`}
                                  >
                                    {selected && <Check size={10} className="text-indigo-400 flex-shrink-0" />}
                                    {c.name}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        {(productData.name || productData.price > 0) && (
                          <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#1c1b22] border border-[#2a2938] flex-shrink-0">
                              {productData.images.filter(Boolean)[0] ? <img src={productData.images.filter(Boolean)[0]} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-600"><ImageIcon size={14} /></div>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-white truncate">{productData.name || 'Product Name'}</p>
                              <p className="text-[10px] text-gray-500 font-mono">{productData.sku || 'SKU'}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              {productData.discountPrice > 0 ? (<div><p className="text-xs font-bold text-indigo-400">${productData.discountPrice.toFixed(2)}</p><p className="text-[10px] text-gray-600 line-through">${productData.price.toFixed(2)}</p></div>) : <p className="text-xs font-bold text-white">${productData.price.toFixed(2)}</p>}
                            </div>
                          </div>
                        )}
                        <div className="flex gap-3 justify-end pt-2 border-t border-[#2a2938]">
                          <button type="button" onClick={() => setProductFormOpen(false)} className="px-5 py-2.5 border border-[#2a2938] text-xs font-semibold rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition cursor-pointer">Cancel</button>
                          <button type="submit" disabled={productMutation.isPending || imageUploading} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-[0_4px_20px_rgba(99,102,241,0.3)] flex items-center gap-2">
                            {productMutation.isPending ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</> : <>{editingProductId ? 'Update Product' : 'Publish Product'}</>}
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {/* ── PRODUCT TABLE ── */}
              {!productFormOpen && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="relative flex-1 max-w-sm">
                      <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 text-xs bg-[#1c1b22] border border-[#22212a] rounded-xl text-white outline-none focus:border-indigo-500/50 transition placeholder:text-gray-600" placeholder="Search by name or SKU..." />
                    </div>
                    <select className="bg-[#1c1b22] border border-[#22212a] text-white rounded-xl px-4 py-2.5 text-xs cursor-pointer outline-none focus:border-indigo-500/50 transition" value={productCategoryFilter} onChange={(e) => setProductCategoryFilter(e.target.value)}>
                      <option value="All">All Categories</option>
                      {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                    <select className="bg-[#1c1b22] border border-[#22212a] text-white rounded-xl px-4 py-2.5 text-xs cursor-pointer outline-none focus:border-indigo-500/50 transition" value={productStockFilter} onChange={(e) => setProductStockFilter(e.target.value)}>
                      <option value="All">All Stock</option>
                      <option value="In Stock">In Stock</option>
                      <option value="Low Stock">Low Stock (≤ 5)</option>
                      <option value="Out of Stock">Out of Stock</option>
                    </select>
                    <button className="flex items-center gap-2 bg-[#1c1b22] border border-[#22212a] rounded-xl px-4 py-2.5 text-xs font-semibold text-gray-300 hover:text-white transition cursor-pointer ml-auto">
                      <Download size={13} className="text-gray-500" /> Export
                    </button>
                  </div>

                  <div className="bg-[#16151d] border border-[#22212a] rounded-2xl overflow-hidden">
                    <div className="grid grid-cols-[56px_1fr_140px_120px_140px_90px] items-center px-5 py-3 border-b border-[#22212a] bg-[#13121a]/60">
                      <div /><span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Product</span><span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Category</span><span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Price</span><span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Stock</span><span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 text-right">Actions</span>
                    </div>
                    <div className="divide-y divide-[#1e1d28]">
                      {productsLoading ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /><p className="text-xs text-gray-500">Loading products...</p></div>
                      ) : filteredProducts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                          <div className="w-14 h-14 rounded-2xl bg-[#1c1b22] border border-[#22212a] flex items-center justify-center"><Package size={24} className="text-gray-600" /></div>
                          <p className="text-sm text-gray-400 font-medium">No products found</p>
                          <p className="text-xs text-gray-600">Try adjusting your search or filters</p>
                        </div>
                      ) : filteredProducts.map((prod) => {
                        let statusText = 'In Stock'; let statusClass = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'; let dotClass = 'bg-emerald-400';
                        if (prod.stock === 0) { statusText = 'Out of Stock'; statusClass = 'bg-rose-500/10 text-rose-400 border border-rose-500/20'; dotClass = 'bg-rose-400'; }
                        else if (prod.stock <= 5) { statusText = `Low (${prod.stock})`; statusClass = 'bg-amber-500/10 text-amber-400 border border-amber-500/20'; dotClass = 'bg-amber-400'; }
                        return (
                          <div key={prod._id} className="grid grid-cols-[56px_1fr_140px_120px_140px_90px] items-center px-5 py-3.5 hover:bg-white/[0.02] transition-colors group">
                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#1c1b22] border border-[#2a2938] flex-shrink-0">
                              {prod.images[0] ? <img src={prod.images[0]} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-700"><ImageIcon size={14} /></div>}
                            </div>
                            <div className="pr-4"><p className="text-sm font-semibold text-white truncate">{prod.name}</p><p className="text-[10px] text-gray-500 font-mono mt-0.5">SKU: {prod.sku}</p></div>
                            <div className="flex flex-wrap gap-1">
                              {(prod.categories?.length > 0 ? prod.categories : prod.category ? [prod.category] : []).map((cat) => (
                                <span key={cat._id} className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide">{cat.name}</span>
                              ))}
                              {(!prod.categories?.length && !prod.category) && (
                                <span className="bg-[#1c1b22] text-gray-500 border border-[#2a2938] rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide">Uncategorized</span>
                              )}
                            </div>
                            <div><p className="text-sm font-bold text-white">${prod.price.toFixed(2)}</p>{prod.discountPrice && prod.discountPrice > 0 && <p className="text-[10px] text-emerald-400">Sale: ${prod.discountPrice.toFixed(2)}</p>}</div>
                            <div><span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold ${statusClass}`}><span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotClass}`} />{statusText}</span></div>
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => handleEditProduct(prod)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition cursor-pointer" title="Edit"><Edit2 size={13} /></button>
                              <button onClick={() => deleteProductMutation.mutate(prod._id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer" title="Delete"><Trash2 size={13} /></button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {filteredProducts.length > 0 && (
                      <div className="flex items-center justify-between px-5 py-3 border-t border-[#22212a] bg-[#13121a]/40">
                        <span className="text-[11px] text-gray-500">Showing <span className="font-semibold text-white">{filteredProducts.length}</span> of <span className="font-semibold text-white">{products.length}</span> products</span>
                        <div className="flex items-center gap-1">
                          <button disabled className="w-7 h-7 rounded-lg border border-[#22212a] text-gray-600 flex items-center justify-center text-xs cursor-not-allowed">&lt;</button>
                          <button className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-600/40 text-white text-xs font-bold flex items-center justify-center">1</button>
                          <button disabled className="w-7 h-7 rounded-lg border border-[#22212a] text-gray-600 flex items-center justify-center text-xs cursor-not-allowed">&gt;</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CATEGORIES TAB */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              {/* Redesigned Header Block */}
              <div className="bg-[#1c1b22] border border-[#22212a] rounded-2xl p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                <div className="space-y-1.5 z-10">
                  <div className="text-[10px] text-[#818cf8] font-bold uppercase tracking-wider">Inventory &gt; Structure</div>
                  <h2 className="text-2xl font-extrabold text-white">Category Management</h2>
                  <p className="text-gray-400 text-sm">Organize and structure your premium storefront catalog with clean layouts and custom slugs</p>
                </div>
                {!categoryFormOpen && (
                  <button
                    onClick={() => {
                      setEditingCategoryId(null);
                      setCategoryName('');
                      setCategoryFormOpen(true);
                    }}
                    className="bg-[#6366f1] hover:bg-[#4f46e5] text-white font-bold text-xs px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-[0_0_20px_rgba(99,102,241,0.3)] transition z-10"
                  >
                    <Plus size={16} /> Create Category
                  </button>
                )}
              </div>

              {!categoryFormOpen && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Total Categories Card */}
                  <div className="bg-[#1c1b22] border border-[#22212a] p-6 rounded-xl hover:shadow-[0_0_20px_rgba(99,102,241,0.1)] transition-all duration-300 flex items-center justify-between h-28 relative overflow-hidden group">
                    <div className="space-y-1">
                      <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Total Categories</p>
                      <h3 className="text-3xl font-black text-white">{totalCategoriesCount.toString().padStart(2, '0')}</h3>
                      <p className="text-[11px] text-gray-500 font-medium">Global structure</p>
                    </div>
                    <span className="absolute top-4 right-4 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">+2 New</span>
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <LayoutGrid size={20} />
                    </div>
                  </div>

                  {/* Total Products Card */}
                  <div className="bg-[#1c1b22] border border-[#22212a] p-6 rounded-xl hover:shadow-[0_0_20px_rgba(99,102,241,0.1)] transition-all duration-300 flex items-center justify-between h-28 relative overflow-hidden group">
                    <div className="space-y-1">
                      <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Total Products</p>
                      <h3 className="text-3xl font-black text-white">{categoryProductsCount}</h3>
                      <p className="text-[11px] text-gray-500 font-medium">Assigned items</p>
                    </div>
                    <span className="absolute top-4 right-4 text-[10px] text-gray-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full font-bold">AVG 12/CAT</span>
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <Package size={20} />
                    </div>
                  </div>

                  {/* Catalog Growth Card */}
                  <div className="bg-[#1c1b22] border border-[#22212a] p-6 rounded-xl hover:shadow-[0_0_20px_rgba(99,102,241,0.1)] transition-all duration-300 flex items-center justify-between h-28 relative overflow-hidden group">
                    <div className="space-y-1">
                      <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Catalog Growth</p>
                      <h3 className="text-3xl font-black text-white">Active</h3>
                      <p className="text-[11px] text-gray-500 font-medium">Health status</p>
                    </div>
                    <span className="absolute top-4 right-4 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">+12% MoM</span>
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                      <TrendingUp size={20} />
                    </div>
                  </div>

                  {/* Public View Card */}
                  <div className="bg-[#1c1b22] border border-[#22212a] p-6 rounded-xl hover:shadow-[0_0_20px_rgba(99,102,241,0.1)] transition-all duration-300 flex items-center justify-between h-28 relative overflow-hidden group">
                    <div className="space-y-1">
                      <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Public View</p>
                      <h3 className="text-3xl font-black text-white">Live</h3>
                      <p className="text-[11px] text-gray-500 font-medium">Storefront status</p>
                    </div>
                    <span className="absolute top-4 right-4 text-[10px] text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full font-bold">Top: Earbuds</span>
                    <div className="w-10 h-10 rounded-lg bg-[#6366f1]/10 border border-[#6366f1]/20 flex items-center justify-center text-[#818cf8]">
                      <Eye size={20} />
                    </div>
                  </div>
                </div>
              )}

              {categoryFormOpen ? (
                <div className="bg-[#16151d] border border-[#2a2938] rounded-2xl overflow-hidden shadow-2xl max-w-xl mx-auto">
                  <div className="flex items-center justify-between px-8 py-5 border-b border-[#2a2938] bg-gradient-to-r from-indigo-600/10 to-transparent">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                        {editingCategoryId ? <Edit2 size={14} className="text-indigo-400" /> : <Plus size={14} className="text-indigo-400" />}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">{editingCategoryId ? 'Edit Category' : 'Create New Category'}</h3>
                        <p className="text-[10px] text-gray-500">Provide a name to structure your store’s product pages</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => setCategoryFormOpen(false)} className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition cursor-pointer">
                      <XIcon size={16} />
                    </button>
                  </div>

                  <form onSubmit={handleCategorySubmit} className="p-6 space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Category Name <span className="text-rose-400">*</span></label>
                      <input
                        type="text"
                        required
                        value={categoryName}
                        onChange={(e) => setCategoryName(e.target.value)}
                        className="w-full px-4 py-2.5 text-sm bg-[#1c1b22] border border-[#2a2938] rounded-xl text-white outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition placeholder:text-gray-600"
                        placeholder="e.g. Mechanical Keyboards"
                      />
                    </div>

                    {categoryName && (
                      <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Storefront URL Slug Preview</p>
                        <p className="text-xs font-mono text-[#818cf8]">/categories/{categoryName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}</p>
                      </div>
                    )}

                    <div className="flex gap-3 justify-end pt-4 border-t border-[#2a2938]">
                      <button type="button" onClick={() => setCategoryFormOpen(false)} className="px-5 py-2.5 border border-[#2a2938] text-xs font-semibold rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition cursor-pointer">Cancel</button>
                      <button type="submit" disabled={categoryMutation.isPending} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-[0_4px_20px_rgba(99,102,241,0.3)] flex items-center gap-2">
                        {categoryMutation.isPending ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</> : <>{editingCategoryId ? 'Update Category' : 'Save Category'}</>}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Collapsible search/filters panel */}
                  {categoryFiltersOpen && (
                    <div className="bg-[#1c1b22] border border-[#22212a] rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
                      <div className="relative w-full sm:max-w-md">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                          <Search size={14} className="opacity-50" />
                        </span>
                        <input
                          className="w-full bg-[#13121a] border border-[#22212a] text-white rounded-lg pl-10 pr-4 py-2 text-xs outline-none focus:border-[#818cf8] transition-all placeholder:text-gray-500"
                          placeholder="Search categories..."
                          type="text"
                          value={categorySearch}
                          onChange={(e) => setCategorySearch(e.target.value)}
                        />
                      </div>
                      <div className="flex items-center gap-4 w-full sm:w-auto">
                        <select
                          className="bg-[#13121a] border border-[#22212a] text-white rounded-lg px-3 py-2 text-xs cursor-pointer outline-none focus:border-[#818cf8]"
                          value={categoryStatusFilter}
                          onChange={(e) => setCategoryStatusFilter(e.target.value)}
                        >
                          <option value="All">All Statuses</option>
                          <option value="Active">Active (Has Products)</option>
                          <option value="Inactive">Inactive (Empty)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Categories List Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-[#22212a] pb-3">
                      <div className="flex gap-6">
                        <button className="text-xs font-bold text-white border-b-2 border-indigo-500 pb-3 -mb-3 transition-colors">All Categories</button>
                        <button className="text-xs font-semibold text-gray-400 hover:text-white pb-3 -mb-3 transition-colors cursor-pointer">Featured</button>
                        <button className="text-xs font-semibold text-gray-400 hover:text-white pb-3 -mb-3 transition-colors cursor-pointer">Archived</button>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setCategoryFiltersOpen(!categoryFiltersOpen)}
                          className={`flex items-center gap-2 border rounded-lg px-4 py-2 text-xs font-semibold transition cursor-pointer ${categoryFiltersOpen
                            ? 'border-[#6366f1] bg-[#6366f1]/10 text-white'
                            : 'border-[#22212a] bg-[#13121a] text-white hover:bg-[#292832]'
                            }`}
                        >
                          <Sliders size={14} className="text-gray-400" />
                          <span>Filter</span>
                        </button>
                        <button
                          type="button"
                          className="flex items-center gap-2 bg-[#13121a] border border-[#22212a] rounded-lg px-4 py-2 text-xs font-semibold text-white hover:bg-[#292832] transition cursor-pointer"
                        >
                          <Download size={14} className="text-gray-400" />
                          <span>Export</span>
                        </button>
                      </div>
                    </div>

                    <div className="bg-[#16151d] border border-[#22212a] rounded-2xl overflow-hidden">
                      <div className="grid grid-cols-[64px_1fr_180px_120px_120px_90px] items-center px-6 py-4 border-b border-[#22212a] bg-[#13121a]/60">
                        <div />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Category Name</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">URL Slug</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Products</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Status</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 text-right">Actions</span>
                      </div>

                      <div className="divide-y divide-[#1e1d28]">
                        {categoriesLoading ? (
                          <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-xs text-gray-500">Loading categories...</p>
                          </div>
                        ) : filteredCategories.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <div className="w-14 h-14 rounded-2xl bg-[#1c1b22] border border-[#22212a] flex items-center justify-center">
                              <LayoutGrid size={24} className="text-gray-600" />
                            </div>
                            <p className="text-sm text-gray-400 font-medium">No categories found</p>
                            <p className="text-xs text-gray-600">Try adjusting your filters or search terms</p>
                          </div>
                        ) : (
                          filteredCategories.map((cat) => {
                            const pCount = getProductCountForCategory(cat._id);
                            const meta = getCategoryMeta(cat.slug, cat.name);

                            let statusText = 'Inactive';
                            let statusClass = 'bg-gray-500/10 text-gray-400 border border-[#22212a]';
                            let dotClass = 'bg-gray-400';
                            if (pCount > 0) {
                              if (cat.slug === 'home-audio') {
                                statusText = 'Paused';
                                statusClass = 'bg-[#d97706]/15 text-[#fbbf24] border border-[#d97706]/30';
                                dotClass = 'bg-[#fbbf24]';
                              } else {
                                statusText = 'Active';
                                statusClass = 'bg-[#047857]/15 text-[#34d399] border border-[#047857]/30';
                                dotClass = 'bg-[#34d399]';
                              }
                            }

                            return (
                              <div key={cat._id} className="grid grid-cols-[64px_1fr_180px_120px_120px_90px] items-center px-6 py-4 hover:bg-white/[0.02] transition-colors group">
                                <div className="w-10 h-10 rounded-xl bg-[#1c1b22] border border-[#2a2938] flex items-center justify-center text-[#818cf8]">
                                  {meta.icon}
                                </div>
                                <div className="pr-4">
                                  <span className="font-bold text-white text-sm">{cat.name}</span>
                                  <span className="text-[10px] text-gray-500 block mt-0.5">{meta.desc}</span>
                                </div>
                                <div>
                                  <span className="bg-[#13121a] border border-[#22212a] rounded-lg px-2.5 py-1 text-[11px] font-mono text-[#818cf8]">
                                    /{cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-')}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-300 font-semibold text-sm">{pCount} products</span>
                                </div>
                                <div>
                                  <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-bold items-center gap-1.5 ${statusClass}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
                                    {statusText}
                                  </span>
                                </div>
                                <div className="flex items-center justify-end gap-1">
                                  <button onClick={() => handleEditCategory(cat)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition cursor-pointer" title="Edit">
                                    <Edit2 size={13} />
                                  </button>
                                  <button onClick={() => deleteCategoryMutation.mutate(cat._id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer" title="Delete">
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {filteredCategories.length > 0 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-[#22212a] bg-[#13121a]/40">
                          <span className="text-gray-400 text-xs font-medium">
                            Showing <span className="font-semibold text-white">1 - {filteredCategories.length}</span> of <span className="font-semibold text-white">{filteredCategories.length}</span> categories
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button className="w-8 h-8 rounded border border-[#22212a] text-gray-400 disabled:opacity-50 hover:text-white flex items-center justify-center transition cursor-not-allowed" disabled>
                              &lt;
                            </button>
                            <button className="bg-indigo-600/25 border border-indigo-600 text-white rounded w-8 h-8 flex items-center justify-center font-bold text-xs">
                              1
                            </button>
                            <button className="w-8 h-8 rounded border border-[#22212a] text-gray-400 hover:text-white flex items-center justify-center transition cursor-not-allowed" disabled>
                              &gt;
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* SEO Insights & Tip cards */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* SEO Insights */}
                    <div className="lg:col-span-2 bg-[#1c1b22] border border-[#22212a] p-6 rounded-xl flex flex-col justify-between relative overflow-hidden">
                      <div className="relative z-10">
                        <h4 className="font-bold text-white text-base mb-2">SEO Performance Insights</h4>
                        <p className="text-xs text-gray-400 leading-relaxed max-w-2xl mb-4">
                          Your top performing category <strong className="text-white">"Earbuds"</strong> has seen a 22% increase in organic traffic this month. Consider adding more descriptive metadata to the <strong className="text-white">"Home Audio"</strong> category to boost its visibility.
                        </p>
                      </div>
                      <button className="text-[#818cf8] font-bold text-xs flex items-center gap-1 hover:underline cursor-pointer w-fit">
                        <span>View detailed SEO report</span>
                        <ArrowUpRight size={14} />
                      </button>
                      <div className="absolute right-0 bottom-0 w-48 h-32 bg-indigo-500/5 blur-3xl pointer-events-none rounded-full" />
                    </div>

                    {/* Admin Tip */}
                    <div className="bg-[#1c1b22] border border-[#22212a] p-6 rounded-xl flex flex-col justify-between gap-4">
                      <div className="flex items-center gap-2 text-amber-400">
                        <Lightbulb size={16} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Admin Tip</span>
                      </div>
                      <p className="text-xs text-gray-400 italic leading-relaxed">
                        "You can drag and drop categories to reorder them on the storefront homepage. Rearranging affects the main navigation hierarchy."
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ORDERS TAB */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Order Management</h2>
                  <p className="text-xs text-gray-400 mt-1">Monitor and manage all incoming transactions across your platform.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button className="flex items-center gap-2 bg-[#13121a] border border-[#22212a] rounded-lg px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#292832] transition cursor-pointer">
                    <Download size={14} className="text-gray-400" />
                    <span>Export CSV</span>
                  </button>
                  <button className="bg-[#c7d2fe] hover:bg-[#b4c6fc] text-[#13121a] font-bold text-xs px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-sm">
                    <Plus size={14} /> Create Order
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Orders Card */}
                <div className="bg-[#1c1b22] border border-[#22212a] p-6 rounded-xl flex items-center justify-between h-28 relative overflow-hidden group">
                  <div className="space-y-1">
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Total Orders</p>
                    {ordersLoading ? (
                      <div className="h-8 w-16 bg-white/5 rounded animate-pulse mt-1" />
                    ) : (
                      <h3 className="text-3xl font-bold text-white">{totalOrdersCount.toLocaleString()}</h3>
                    )}
                    <p className="text-[11px] text-gray-500 font-medium">Platform lifetime</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400">
                    <LayoutGrid size={20} />
                  </div>
                </div>

                {/* Pending Orders Card */}
                <div className="bg-[#1c1b22] border border-[#22212a] p-6 rounded-xl flex items-center justify-between h-28 relative overflow-hidden group">
                  <div className="space-y-1">
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Pending Orders</p>
                    {ordersLoading ? (
                      <div className="h-8 w-12 bg-white/5 rounded animate-pulse mt-1" />
                    ) : (
                      <h3 className="text-3xl font-bold text-white">{pendingOrdersCount}</h3>
                    )}
                    <p className="text-[11px] text-gray-500 font-medium">To be fulfilled</p>
                  </div>
                  <span className="absolute top-4 right-4 text-[10px] text-gray-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full font-bold">Real-time</span>
                  <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400">
                    <Package size={20} />
                  </div>
                </div>

                {/* Refunds Card */}
                <div className="bg-[#1c1b22] border border-[#22212a] p-6 rounded-xl flex items-center justify-between h-28 relative overflow-hidden group">
                  <div className="space-y-1">
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Refunds</p>
                    {ordersLoading ? (
                      <div className="h-8 w-10 bg-white/5 rounded animate-pulse mt-1" />
                    ) : (
                      <h3 className="text-3xl font-bold text-white">{refundedOrdersCount}</h3>
                    )}
                    <p className="text-[11px] text-gray-500 font-medium">Processed returns</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400">
                    <RotateCcw size={20} />
                  </div>
                </div>
              </div>

              {/* Table card */}
              <div className="bg-[#1c1b22] border border-[#22212a] rounded-xl p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-[#22212a] pb-3">
                  <h4 className="font-bold text-white text-base">Recent Transactions</h4>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setOrderFiltersOpen(!orderFiltersOpen)}
                      className={`flex items-center justify-center w-8 h-8 border rounded-lg transition cursor-pointer ${orderFiltersOpen
                        ? 'border-indigo-500 bg-indigo-500/10 text-white'
                        : 'border-[#22212a] bg-[#13121a] text-white hover:bg-[#292832]'
                        }`}
                    >
                      <Sliders size={14} className="text-gray-400" />
                    </button>
                    <button className="flex items-center justify-center w-8 h-8 bg-[#13121a] border border-[#22212a] rounded-lg text-white hover:bg-[#292832] transition cursor-pointer">
                      <List size={14} className="text-gray-400" />
                    </button>
                  </div>
                </div>

                {/* Collapsible search/filters panel */}
                {orderFiltersOpen && (
                  <div className="bg-[#13121a] border border-[#22212a] rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full sm:max-w-md">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <Search size={14} className="opacity-50" />
                      </span>
                      <input
                        className="w-full bg-[#1c1b22] border border-[#22212a] text-white rounded-lg pl-10 pr-4 py-2 text-xs outline-none focus:border-[#818cf8] transition-all placeholder:text-gray-500"
                        placeholder="Search by Order ID or customer..."
                        type="text"
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                      />
                    </div>
                    <div className="w-full sm:w-48">
                      <select
                        className="w-full bg-[#1c1b22] border border-[#22212a] text-white rounded-lg px-3 py-2 text-xs cursor-pointer outline-none focus:border-[#818cf8]"
                        value={orderStatusFilter}
                        onChange={(e) => setOrderStatusFilter(e.target.value)}
                      >
                        <option value="All">All Statuses</option>
                        <option value="placed">Placed</option>
                        <option value="processing">Processing</option>
                        <option value="packed">Packed</option>
                        <option value="shipped">Shipped</option>
                        <option value="out-for-delivery">Out for Delivery</option>
                        <option value="delivered">Delivered</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse min-w-[800px]">
                    <thead className="bg-[#13121a]/50 text-gray-400 font-bold uppercase text-[9px] tracking-wider border-b border-[#22212a]">
                      <tr>
                        <th className="px-6 py-4">Order ID</th>
                        <th className="px-6 py-4">Customer</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Total Amount</th>
                        <th className="px-6 py-4">Payment Status</th>
                        <th className="px-6 py-4">Fulfillment Status</th>
                        <th className="px-6 py-4 text-right pr-6">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#22212a] text-sm">
                      {ordersLoading ? (
                        <tr><td colSpan={7} className="text-center py-8 text-gray-400">Loading orders...</td></tr>
                      ) : filteredOrders.length === 0 ? (
                        <tr><td colSpan={7} className="text-center py-8 text-gray-400">No orders found.</td></tr>
                      ) : (
                        filteredOrders.map((ord) => {
                          const cName = (ord.user && typeof ord.user === 'object') ? ord.user.name : 'Guest';
                          const cEmail = (ord.user && typeof ord.user === 'object') ? ord.user.email : '';
                          const initials = cName.split(' ').map((n: any) => n[0]).join('').toUpperCase().slice(0, 2);
                          const initialsBg = getInitialsBg(cName);

                          const displayId = `#AUR-${ord._id.slice(-6).toUpperCase()}`;
                          const displayDate = ord.createdAt
                            ? new Date(ord.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                            : '—';

                          let payText: string = ord.paymentStatus;
                          let payClass = '';
                          let payDot = '';
                          if (ord.paymentStatus === 'paid') {
                            payText = 'Paid';
                            payClass = 'bg-[#047857]/15 text-[#34d399] border border-[#047857]/30';
                            payDot = 'bg-[#34d399]';
                          } else if (ord.paymentStatus === 'refunded') {
                            payText = 'Refunded';
                            payClass = 'bg-[#d97706]/15 text-[#fbbf24] border border-[#d97706]/30';
                            payDot = 'bg-[#fbbf24]';
                          } else if (ord.paymentStatus === 'failed') {
                            payText = 'Failed';
                            payClass = 'bg-[#93000a]/15 text-[#ffdad6] border border-[#93000a]/30';
                            payDot = 'bg-[#ffb4ab]';
                          } else {
                            payText = 'Pending';
                            payClass = 'bg-gray-500/10 text-gray-400 border border-[#22212a]';
                            payDot = 'bg-gray-400';
                          }

                          let fulfillText: string = ord.orderStatus;
                          let fulfillClass = '';
                          let fulfillDot = '';
                          if (ord.orderStatus === 'delivered') {
                            fulfillText = 'Delivered';
                            fulfillClass = 'bg-indigo-500/15 text-[#818cf8] border border-indigo-500/30';
                            fulfillDot = 'bg-[#818cf8]';
                          } else if (ord.orderStatus === 'placed') {
                            fulfillText = 'Placed';
                            fulfillClass = 'bg-sky-500/10 text-sky-400 border border-sky-500/20';
                            fulfillDot = 'bg-sky-400';
                          } else {
                            fulfillText = ord.orderStatus.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
                            fulfillClass = 'bg-[#d97706]/15 text-[#fbbf24] border border-[#d97706]/30';
                            fulfillDot = 'bg-[#fbbf24]';
                          }

                          return (
                            <tr key={ord._id} className="hover:bg-[#13121a]/20 transition-colors group">
                              <td className="px-6 py-4 font-bold text-[#818cf8] tracking-wide">{displayId}</td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${initialsBg}`}>
                                    {initials}
                                  </div>
                                  <span className="font-semibold text-white">{cName}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-gray-400">{displayDate}</td>
                              <td className="px-6 py-4 font-bold text-white">${ord.totalAmount.toFixed(2)}</td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold items-center gap-1.5 ${payClass}`}>
                                  {payDot && <span className={`w-1.5 h-1.5 rounded-full ${payDot}`} />}
                                  {payText}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                {editingOrderId === ord._id ? (
                                  <select
                                    value={ord.orderStatus}
                                    onChange={(e) => {
                                      orderStatusMutation.mutate({ id: ord._id, orderStatus: e.target.value });
                                      setEditingOrderId(null);
                                    }}
                                    className="bg-[#13121a] border border-[#22212a] px-2 py-1 rounded text-xs font-semibold text-white outline-none focus:border-[#818cf8] cursor-pointer transition"
                                  >
                                    <option value="placed">Placed</option>
                                    <option value="processing">Processing</option>
                                    <option value="packed">Packed</option>
                                    <option value="shipped">Shipped</option>
                                    <option value="out-for-delivery">Out for Delivery</option>
                                    <option value="delivered">Delivered</option>
                                  </select>
                                ) : (
                                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold items-center gap-1.5 ${fulfillClass}`}>
                                    {fulfillDot && <span className={`w-1.5 h-1.5 rounded-full ${fulfillDot}`} />}
                                    {fulfillText}
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right pr-6">
                                <div className="flex items-center justify-end gap-3">
                                  <button
                                    onClick={() => setEditingOrderId(editingOrderId === ord._id ? null : ord._id)}
                                    className="p-1.5 text-gray-400 hover:text-white transition cursor-pointer"
                                    title="Edit Status"
                                  >
                                    <Edit2 size={13} />
                                  </button>
                                  {ord.paymentStatus === 'paid' && (
                                    <button
                                      onClick={() => {
                                        if (window.confirm('Process refund? This will restock inventory.')) {
                                          refundMutation.mutate(ord._id);
                                        }
                                      }}
                                      className="p-1.5 text-gray-400 hover:text-amber-400 transition cursor-pointer"
                                      title="Refund Order"
                                    >
                                      <RotateCcw size={13} />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#22212a]">
                  <span className="text-gray-400 text-xs font-medium">
                    Showing <span className="font-semibold text-white">{filteredOrders.length}</span> of <span className="font-semibold text-white">{totalOrdersCount.toLocaleString()}</span> orders
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button className="w-8 h-8 rounded border border-[#22212a] text-gray-400 disabled:opacity-50 hover:text-white flex items-center justify-center transition cursor-not-allowed" disabled>
                      &lt;
                    </button>
                    <button className="bg-indigo-600/25 border border-indigo-600 text-white rounded w-8 h-8 flex items-center justify-center font-bold text-xs">
                      1
                    </button>
                    <button className="w-8 h-8 rounded border border-[#22212a] text-gray-400 hover:text-white flex items-center justify-center transition cursor-not-allowed" disabled>
                      &gt;
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* USERS TAB */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">User Management</h2>
                  <p className="text-xs text-gray-400 mt-1">Manage customer accounts, roles, permissions, and account status.</p>
                </div>
              </div>

              {/* Actions Row */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-[#1c1b22] p-4 rounded-xl border border-[#22212a]">
                <div className="relative w-full sm:max-w-md">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Search size={14} className="opacity-55" />
                  </span>
                  <input
                    className="w-full bg-[#13121a] border border-[#22212a] text-white rounded-lg pl-10 pr-4 py-2.5 text-xs focus:ring-1 focus:ring-[#818cf8] focus:border-[#818cf8] placeholder-gray-500 outline-none transition"
                    placeholder="Search by name, email or role..."
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                </div>
                <button
                  onClick={() => {
                    toast.success("Administrator provisioning system initialized.");
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#c0c1ff] hover:bg-[#b0b1ff] text-[#1000a9] rounded-xl font-bold text-xs transition-all shadow-[0_4px_12px_rgba(192,193,255,0.2)] cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Create Admin</span>
                </button>
              </div>

              {/* Table section */}
              <div className="bg-[#1c1b22] border border-[#22212a] rounded-xl overflow-hidden shadow-sm flex flex-col">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[800px] text-xs">
                    <thead>
                      <tr className="bg-[#13121a]/50 text-gray-400 font-bold uppercase text-[9px] tracking-wider border-b border-[#22212a]">
                        <th className="px-6 py-4 font-semibold">User</th>
                        <th className="px-6 py-4 font-semibold">Role</th>
                        <th className="px-6 py-4 font-semibold">Date Joined</th>
                        <th className="px-6 py-4 font-semibold">Status</th>
                        <th className="px-6 py-4 font-semibold text-right pr-6">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#22212a] text-sm">
                      {usersLoading ? (
                        <tr><td colSpan={5} className="text-center py-8 text-gray-400">Loading user directory...</td></tr>
                      ) : filteredUsers.length === 0 ? (
                        <tr><td colSpan={5} className="text-center py-8 text-gray-400">No accounts found matching filters.</td></tr>
                      ) : (
                        filteredUsers.map((u: User) => {
                          const initials = u.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
                          const initialsBg = getInitialsBg(u.name);
                          const displayDate = u.createdAt.includes('-')
                            ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                            : u.createdAt;

                          return (
                            <tr key={u._id} className="hover:bg-[#13121a]/20 transition-colors group">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  {u.avatar ? (
                                    <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded-full border border-[#22212a] object-cover flex-shrink-0" />
                                  ) : (
                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${initialsBg}`}>
                                      {initials}
                                    </div>
                                  )}
                                  <div>
                                    <div className="font-bold text-white text-sm">{u.name}</div>
                                    <div className="text-gray-400 text-xs mt-0.5">{u.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${u.role === 'admin'
                                  ? 'bg-[#8083ff]/10 text-[#c0c1ff] border border-[#8083ff]/20'
                                  : 'bg-white/5 text-gray-400 border border-[#22212a]'
                                  }`}>
                                  {u.role}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-gray-400">{displayDate}</td>
                              <td className="px-6 py-4">
                                <div className={`flex items-center gap-1.5 ${u.isSuspended ? 'text-rose-400' : 'text-[#c0c1ff]'}`}>
                                  <div className={`w-1.5 h-1.5 rounded-full ${u.isSuspended ? 'bg-rose-400' : 'bg-[#c0c1ff]'}`} />
                                  <span className="text-xs font-semibold">{u.isSuspended ? 'Suspended' : 'Active'}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right pr-6">
                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  {u.role !== 'admin' && (
                                    <button
                                      onClick={() => {
                                        const actionText = u.isSuspended ? 'activate' : 'suspend';
                                        setConfirmModal({
                                          isOpen: true,
                                          title: `${u.isSuspended ? 'Activate' : 'Suspend'} User Account`,
                                          message: `Are you sure you want to change ${u.name}'s account status to ${actionText === 'activate' ? 'Active' : 'Suspended'}?`,
                                          onConfirm: () => userStatusMutation.mutate({ id: u._id, isSuspended: !u.isSuspended })
                                        });
                                      }}
                                      className="p-1 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition cursor-pointer"
                                      title={u.isSuspended ? "Activate User" : "Suspend User"}
                                    >
                                      {u.isSuspended ? (
                                        <CheckCircle size={14} className="text-emerald-400" />
                                      ) : (
                                        <Ban size={14} className="text-rose-400" />
                                      )}
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      const nextRole = u.role === 'admin' ? 'customer' : 'admin';
                                      if (u._id === user._id) {
                                        toast.error("You cannot change your own admin role.");
                                        return;
                                      }
                                      setConfirmModal({
                                        isOpen: true,
                                        title: 'Modify User Role',
                                        message: `Are you sure you want to change ${u.name}'s role to ${nextRole}?`,
                                        onConfirm: () => userStatusMutation.mutate({ id: u._id, role: nextRole })
                                      });
                                    }}
                                    className="p-1 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition cursor-pointer"
                                    title="Change Role"
                                  >
                                    <Sliders size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 bg-[#13121a]/50 flex justify-between items-center border-t border-[#22212a]">
                  <p className="text-gray-400 text-xs font-semibold">
                    Showing <span className="font-semibold text-white">{filteredUsers.length}</span> of <span className="font-semibold text-white">{users.length}</span> users
                  </p>
                  <div className="flex items-center gap-1.5">
                    <button className="w-8 h-8 rounded border border-[#22212a] text-gray-400 disabled:opacity-50 hover:text-white flex items-center justify-center transition cursor-not-allowed" disabled>
                      &lt;
                    </button>
                    <span className="text-xs text-white font-bold px-2">1</span>
                    <button className="w-8 h-8 rounded border border-[#22212a] text-gray-400 disabled:opacity-50 hover:text-white flex items-center justify-center transition cursor-not-allowed" disabled>
                      &gt;
                    </button>
                  </div>
                </div>
              </div>

              {/* Bento style KPI Cards at bottom */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                {/* Active Users */}
                <div className="bg-[#1c1b22] p-6 rounded-xl border border-[#22212a] flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Active Users</p>
                    <h3 className="text-2xl font-bold text-white mt-1">
                      {usersLoading ? '...' : activeUsersCount.toLocaleString()}
                    </h3>
                    <p className="text-emerald-400 text-[11px] mt-1.5 flex items-center gap-1">
                      <CheckCircle size={12} /> Account status online
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-[#8083ff]/10 border border-[#8083ff]/20 flex items-center justify-center text-[#c0c1ff]">
                    <UsersIcon size={20} />
                  </div>
                </div>

                {/* Suspended Accounts */}
                <div className="bg-[#1c1b22] p-6 rounded-xl border border-[#22212a] flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Suspended Accounts</p>
                    <h3 className="text-2xl font-bold text-white mt-1">
                      {usersLoading ? '...' : suspendedUsersCount.toLocaleString()}
                    </h3>
                    <p className="text-rose-400 text-[11px] mt-1.5 flex items-center gap-1">
                      <Ban size={12} /> Restricted accounts
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                    <Ban size={20} />
                  </div>
                </div>

                {/* Administrative Staff */}
                <div className="bg-[#1c1b22] p-6 rounded-xl border border-[#22212a] flex items-center justify-between overflow-hidden relative">
                  <div>
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Administrative Staff</p>
                    <h3 className="text-2xl font-bold text-white mt-1">
                      {usersLoading ? '...' : adminsCount.toLocaleString()}
                    </h3>
                    <p className="text-emerald-400 text-[11px] mt-1.5 flex items-center gap-1">
                      <Sliders size={12} /> console operators
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Sliders size={20} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="border-b border-[#22212a] pb-4">
                <h2 className="text-xl font-bold text-white">Console Settings</h2>
                <p className="text-xs text-gray-400 mt-0.5">Manage console configurations, API integrations, and developer preferences.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Stripe Integrations */}
                <div className="bg-[#1c1b22] border border-[#22212a] rounded-xl p-6 space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sliders size={16} className="text-[#818cf8]" /> Stripe Gateway Integration
                  </h3>
                  <p className="text-xs text-gray-400">Configure Stripe checkout session behavior and webhook registration endpoints.</p>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-gray-500">Stripe Webhook Secret</label>
                      <input
                        type="text"
                        value={stripeWebhookSecret}
                        onChange={(e) => setStripeWebhookSecret(e.target.value)}
                        className="w-full mt-1 px-3 py-2 text-xs bg-[#13121a] border border-[#22212a] rounded-lg text-white focus:border-[#818cf8] outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-gray-500">Forwarding Endpoint</label>
                      <input
                        type="text"
                        value={stripeForwardingEndpoint}
                        onChange={(e) => setStripeForwardingEndpoint(e.target.value)}
                        className="w-full mt-1 px-3 py-2 text-xs bg-[#13121a] border border-[#22212a] rounded-lg text-white focus:border-[#818cf8] outline-none transition"
                      />
                    </div>
                  </div>
                </div>

                {/* ImageKit Credentials */}
                <div className="bg-[#1c1b22] border border-[#22212a] rounded-xl p-6 space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FolderOpen size={16} className="text-[#818cf8]" /> Media Assets (ImageKit)
                  </h3>
                  <p className="text-xs text-gray-400">Manage public and private image/video optimization asset delivery credentials.</p>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-gray-500">Public Key</label>
                      <input
                        type="text"
                        value={imagekitPublicKey}
                        onChange={(e) => setImagekitPublicKey(e.target.value)}
                        className="w-full mt-1 px-3 py-2 text-xs bg-[#13121a] border border-[#22212a] rounded-lg text-white focus:border-[#818cf8] outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-gray-500">URL Endpoint</label>
                      <input
                        type="text"
                        value={imagekitUrlEndpoint}
                        onChange={(e) => setImagekitUrlEndpoint(e.target.value)}
                        className="w-full mt-1 px-3 py-2 text-xs bg-[#13121a] border border-[#22212a] rounded-lg text-white focus:border-[#818cf8] outline-none transition"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="px-6 py-2.5 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-xs font-semibold rounded-lg shadow-[0_4px_12px_rgba(99,102,241,0.2)] transition cursor-pointer"
                >
                  Save Settings
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── CUSTOM CONFIRMATION MODAL ── */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#09080c]/85 backdrop-blur-md transition-all duration-300">
          <div className="bg-[#16151d] border border-[#2a2938] rounded-2xl p-6 w-full max-w-sm shadow-2xl relative transition-all duration-300 transform scale-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{confirmModal.title}</h3>
                <p className="text-[10px] text-gray-500 mt-0.5">Console authorization check</p>
              </div>
            </div>
            <p className="text-xs text-gray-300 mb-6 leading-relaxed">
              {confirmModal.message}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                className="px-4 py-2 border border-[#2a2938] text-xs font-semibold rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal({ ...confirmModal, isOpen: false });
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition shadow-[0_4px_12px_rgba(99,102,241,0.2)] cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
}

export interface Color {
  name: string;
  hex: string;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  category: Category;       // legacy single category
  categories: Category[];   // multi-category (new)
  price: number;
  discountPrice?: number;
  stock: number;
  sku: string;
  images: string[];
  sizes: string[];
  colors: Color[];
  rating: number;
  numReviews: number;
  createdAt: string;
}

export interface UserAddress {
  _id?: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  avatar: string;
  addresses: UserAddress[];
  wishlist: string[];
  isVerified: boolean;
  isSuspended?: boolean;
  createdAt: string;
}

export interface OrderItem {
  product: {
    _id: string;
    name: string;
    images: string[];
    sku?: string;
    price: number;
  };
  quantity: number;
  price: number;
  selectedSize?: string;
  selectedColor?: string;
}

export interface Order {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  } | string;
  products: OrderItem[];
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  deliveryMethod: string;
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  orderStatus: 'placed' | 'processing' | 'packed' | 'shipped' | 'out-for-delivery' | 'delivered';
  stripePaymentIntentId?: string;
  createdAt: string;
}

export interface Review {
  _id: string;
  product: string;
  user: {
    _id: string;
    name: string;
    avatar: string;
  };
  rating: number;
  comment: string;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  name: string;
  slug: string;
  price: number;
  image: string;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  stock: number;
}

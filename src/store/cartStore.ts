import { create } from 'zustand';
import { CartItem } from '../types';

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, size?: string, color?: string) => void;
  updateQuantity: (productId: string, quantity: number, size?: string, color?: string) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
  initializeCart: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  initializeCart: () => {
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        try {
          set({ items: JSON.parse(savedCart) });
        } catch (e) {
          console.error('Failed to parse cart data', e);
        }
      }
    }
  },

  addItem: (newItem) => {
    set((state) => {
      const existingItemIndex = state.items.findIndex(
        (item) =>
          item.productId === newItem.productId &&
          item.selectedSize === newItem.selectedSize &&
          item.selectedColor === newItem.selectedColor
      );

      let updatedItems;

      if (existingItemIndex > -1) {
        updatedItems = [...state.items];
        const existingItem = updatedItems[existingItemIndex];
        const newQty = existingItem.quantity + newItem.quantity;
        // Keep within stock limits
        existingItem.quantity = Math.min(newQty, existingItem.stock);
      } else {
        updatedItems = [...state.items, newItem];
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('cart', JSON.stringify(updatedItems));
      }
      return { items: updatedItems };
    });
  },

  removeItem: (productId, size, color) => {
    set((state) => {
      const updatedItems = state.items.filter(
        (item) =>
          !(
            item.productId === productId &&
            item.selectedSize === size &&
            item.selectedColor === color
          )
      );
      if (typeof window !== 'undefined') {
        localStorage.setItem('cart', JSON.stringify(updatedItems));
      }
      return { items: updatedItems };
    });
  },

  updateQuantity: (productId, quantity, size, color) => {
    set((state) => {
      const updatedItems = state.items.map((item) => {
        if (
          item.productId === productId &&
          item.selectedSize === size &&
          item.selectedColor === color
        ) {
          return { ...item, quantity: Math.max(1, Math.min(quantity, item.stock)) };
        }
        return item;
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem('cart', JSON.stringify(updatedItems));
      }
      return { items: updatedItems };
    });
  },

  clearCart: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cart');
    }
    set({ items: [] });
  },

  getCartTotal: () => {
    return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
  },

  getCartCount: () => {
    return get().items.reduce((count, item) => count + item.quantity, 0);
  },
}));

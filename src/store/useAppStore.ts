import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { Product, ProductVariant, CartItem, EcomSettings, InstituteInfo } from '../types';
import { DEFAULT_ECOM_SETTINGS, DEFAULT_INSTITUTE_INFO } from '../lib/constants';

interface AppState {
  // Admin Auth State
  adminEmail: string | null;
  setAdminEmail: (email: string | null) => void;
  logoutAdmin: () => void;
  
  // Store Info & Settings
  ecomSettings: EcomSettings;
  instituteInfo: InstituteInfo;
  setEcomSettings: (settings: EcomSettings) => void;
  setInstituteInfo: (info: InstituteInfo) => void;

  // Ecom Cart State
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      adminEmail: null,
      setAdminEmail: (email) => set({ adminEmail: email }),
      logoutAdmin: () => set({ adminEmail: null }),
      
      ecomSettings: DEFAULT_ECOM_SETTINGS,
      instituteInfo: DEFAULT_INSTITUTE_INFO,
      setEcomSettings: (settings) => set({ ecomSettings: settings }),
      setInstituteInfo: (info) => set({ instituteInfo: info }),
      
      cart: [],
      addToCart: (item) =>
        set((state) => {
          const existingItem = state.cart.find((i) => 
            i.product.id === item.product.id && 
            (i.variant ? i.variant.id === item.variant?.id : true)
          );
          if (existingItem) {
            return {
              cart: state.cart.map((i) =>
                i.product.id === item.product.id && (i.variant ? i.variant.id === item.variant?.id : true)
                  ? { ...i, quantity: i.quantity + item.quantity } : i
              ),
            };
          }
          return { cart: [...state.cart, item] };
        }),
      removeFromCart: (productId, variantId?: string) =>
        set((state) => ({
          cart: state.cart.filter((i) => !(i.product.id === productId && (variantId ? i.variant?.id === variantId : true))),
        })),
      updateQuantity: (productId, quantity, variantId?: string) =>
        set((state) => ({
          cart: state.cart.map((i) => (i.product.id === productId && (variantId ? i.variant?.id === variantId : true) ? { ...i, quantity } : i)),
        })),
      clearCart: () => set({ cart: [] }),
    }),
    {
      name: 'store-app-storage',
    }
  )
);

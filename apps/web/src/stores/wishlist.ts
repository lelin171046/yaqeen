import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WishlistItem {
  productId: string;
  slug: string;
  name: string;
  image: string;
  price: number;
}

interface WishlistState {
  items: WishlistItem[];
  addItem: (item: WishlistItem) => void;
  removeItem: (productId: string) => void;
  toggleItem: (item: WishlistItem) => void;
  clear: () => void;
}

export const useWishlist = create<WishlistState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => ({
          items: state.items.some((existing) => existing.productId === item.productId)
            ? state.items
            : [item, ...state.items],
        })),
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        })),
      toggleItem: (item) =>
        set((state) => ({
          items: state.items.some((existing) => existing.productId === item.productId)
            ? state.items.filter((existing) => existing.productId !== item.productId)
            : [item, ...state.items],
        })),
      clear: () => set({ items: [] }),
    }),
    {
      name: 'anando-deal-wishlist',
      version: 1,
    },
  ),
);

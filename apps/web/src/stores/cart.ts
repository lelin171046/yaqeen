import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartLine {
  productId: string;
  slug: string;
  name: string;
  image: string;
  variantSku: string;
  variantLabel: string;
  price: number;
  maxStock: number;
  quantity: number;
}

interface CartState {
  items: CartLine[];
  addItem: (item: Omit<CartLine, 'quantity'>, quantity?: number) => void;
  removeItem: (productId: string, variantSku: string) => void;
  setQuantity: (productId: string, variantSku: string, quantity: number) => void;
  clear: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item, quantity = 1) =>
        set((state) => {
          const existing = state.items.find(
            (line) =>
              line.productId === item.productId && line.variantSku === item.variantSku,
          );

          if (existing) {
            return {
              items: state.items.map((line) =>
                line.productId === item.productId && line.variantSku === item.variantSku
                  ? {
                      ...line,
                      quantity: Math.min(line.quantity + quantity, line.maxStock),
                    }
                  : line,
              ),
            };
          }

          return {
            items: [
              ...state.items,
              { ...item, quantity: Math.min(quantity, item.maxStock) },
            ],
          };
        }),
      removeItem: (productId, variantSku) =>
        set((state) => ({
          items: state.items.filter(
            (line) =>
              !(line.productId === productId && line.variantSku === variantSku),
          ),
        })),
      setQuantity: (productId, variantSku, quantity) =>
        set((state) => ({
          items: state.items.map((line) =>
            line.productId === productId && line.variantSku === variantSku
              ? {
                  ...line,
                  quantity: Math.max(1, Math.min(quantity, line.maxStock)),
                }
              : line,
          ),
        })),
      clear: () => set({ items: [] }),
    }),
    {
      name: 'yaqeen-cart',
      version: 1,
    },
  ),
);

export function cartSubtotal(items: CartLine[]): number {
  return items.reduce((sum, line) => sum + line.price * line.quantity, 0);
}

export function cartCount(items: CartLine[]): number {
  return items.reduce((sum, line) => sum + line.quantity, 0);
}

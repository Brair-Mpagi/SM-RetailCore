import { create } from 'zustand';
import { Product, CartItem } from '@/types';

interface CartState {
  items: CartItem[];
  customer: { name?: string; phone?: string } | null;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  setCustomer: (customer: { name?: string; phone?: string } | null) => void;
  getSubtotal: () => number;
  getVATAmount: () => number;
  getDiscountAmount: () => number;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  customer: null,

  addItem: (product, quantity = 1) => {
    const items = get().items;
    const existingItem = items.find((item) => item.product.id === product.id);

    if (existingItem) {
      set({
        items: items.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + quantity,
                subtotal: (item.quantity + quantity) * product.unit_price,
                vat_amount: (item.quantity + quantity) * product.unit_price * product.vat_rate,
                total:
                  (item.quantity + quantity) * product.unit_price +
                  (item.quantity + quantity) * product.unit_price * product.vat_rate,
              }
            : item
        ),
      });
    } else {
      const subtotal = quantity * product.unit_price;
      const vat_amount = subtotal * product.vat_rate;
      const total = subtotal + vat_amount;

      set({
        items: [
          ...items,
          {
            product,
            quantity,
            subtotal,
            vat_amount,
            discount_amount: 0,
            total,
          },
        ],
      });
    }
  },

  removeItem: (productId) => {
    set({ items: get().items.filter((item) => item.product.id !== productId) });
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }

    set({
      items: get().items.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              quantity,
              subtotal: quantity * item.product.unit_price,
              vat_amount: quantity * item.product.unit_price * item.product.vat_rate,
              total:
                quantity * item.product.unit_price +
                quantity * item.product.unit_price * item.product.vat_rate,
            }
          : item
      ),
    });
  },

  clearCart: () => {
    set({ items: [], customer: null });
  },

  setCustomer: (customer) => {
    set({ customer });
  },

  getSubtotal: () => {
    return get().items.reduce((sum, item) => sum + item.subtotal, 0);
  },

  getVATAmount: () => {
    return get().items.reduce((sum, item) => sum + item.vat_amount, 0);
  },

  getDiscountAmount: () => {
    return get().items.reduce((sum, item) => sum + item.discount_amount, 0);
  },

  getTotal: () => {
    return get().items.reduce((sum, item) => sum + item.total, 0);
  },

  getItemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },
}));

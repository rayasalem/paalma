
import { CartItem } from '../types';

/**
 * Cart Service
 * Utility functions for managing cart operations.
 * State is typically managed by the UI (App.tsx), but logic resides here.
 */
export const cartService = {
  
  calculateTotal(cart: CartItem[]): number {
    return cart.reduce((sum, item) => sum + ((item.price || item.price_ils || 0) * item.quantity), 0);
  },

  countItems(cart: CartItem[]): number {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  },

  addItem(cart: CartItem[], newItem: CartItem): CartItem[] {
    const existing = cart.find(p => p.id === newItem.id);
    if (existing) {
      return cart.map(p => p.id === newItem.id ? { ...p, quantity: p.quantity + newItem.quantity } : p);
    }
    return [...cart, newItem];
  },

  updateQuantity(cart: CartItem[], id: string, delta: number): CartItem[] {
    return cart.map(p => {
      if (p.id === id) return { ...p, quantity: Math.max(0, p.quantity + delta) };
      return p;
    }).filter(p => p.quantity > 0);
  }
};

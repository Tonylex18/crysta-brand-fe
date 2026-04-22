import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from './AuthContext';
import { cartAPI, CartItem, CartResponse } from '../pages/lib/api';

type CartContextType = {
  cartItems: CartItem[];
  loading: boolean;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  cartSubtotalKobo: number;
  cartUpdatedAt: string | null;
  cartCount: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

const redirectToAuth = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('authUser');
  window.location.href = '/auth';
};

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartSubtotalKobo, setCartSubtotalKobo] = useState(0);
  const [cartUpdatedAt, setCartUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const applyCartResponse = useCallback((response: CartResponse) => {
    setCartItems(response.items || []);
    setCartSubtotalKobo(response.items_subtotal_kobo || 0);
    setCartUpdatedAt(response.updated_at || null);
  }, []);

  const fetchCart = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await cartAPI.get();
      applyCartResponse(response);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      setCartItems([]);
      setCartSubtotalKobo(0);
      setCartUpdatedAt(null);
    }
    setLoading(false);
  }, [user, applyCartResponse]);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }
    if (user) {
      fetchCart();
    } else {
      setCartItems([]);
      setCartSubtotalKobo(0);
      setCartUpdatedAt(null);
      setLoading(false);
    }
  }, [user, authLoading, fetchCart]);

  const addToCart = async (productId: string, quantity: number = 1) => {
    if (!user) {
      toast.error('Please sign in first before adding item to cart');
      redirectToAuth();
      return;
    }
    try {
      const response = await cartAPI.addItem(productId, quantity);
      applyCartResponse(response);
    } catch (error: any) {
      if (error?.response?.status === 401) {
        toast.error('Please sign in first before adding item to cart');
        redirectToAuth();
        return;
      }
      throw error;
    }
  };

  const removeFromCart = async (productId: string) => {
    if (!user) return;
    const response = await cartAPI.removeItem(productId);
    applyCartResponse(response);
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (!user) return;
    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }
    const response = await cartAPI.updateItem(productId, quantity);
    applyCartResponse(response);
  };

  const clearCart = async () => {
    if (!user) return;
    const response = await cartAPI.clear();
    applyCartResponse(response);
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      loading,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartSubtotalKobo,
      cartUpdatedAt,
      cartCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

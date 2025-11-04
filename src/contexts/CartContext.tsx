import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { cartAPI, CartItem, Product } from '../lib/api';
import { useAuth } from './AuthContext';

// Define the actual cart item type that comes from the backend
type CartItemWithProduct = Omit<CartItem, 'product_id' | 'id'> & {
  _id: string;
  product_id: Product;
};

type CartContextType = {
  cartItems: CartItemWithProduct[];
  loading: boolean;
  addToCart: (productId: string, size: string, color: string, price: number, quantity?: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  cartTotal: number;
  cartCount: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }
    if (user) {
      fetchCart();
    } else {
      setCartItems([]);
      setLoading(false);
    }
  }, [user, authLoading]);

  const fetchCart = async () => {
    if (!user) return;

    console.log('fetchCart called');
    setLoading(true);
    try {
      const response = await cartAPI.getItems();
      console.log('fetchCart API response:', response);
      // Backend returns { success, data: CartItem[] } where CartItem has populated product_id
      const items = response?.data || [];
      console.log('fetchCart items:', items);
      setCartItems(items);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      setCartItems([]);
    }
    setLoading(false);
  };

  const addToCart = async (
    productId: string,
    size: string,
    color: string,
    price: number,
    quantity: number = 1
  ) => {
    if (!user) throw new Error('Must be logged in to add to cart');

    const existingItem = cartItems.find(
      item =>
        item.product_id.id === productId &&
        item.size === size &&
        item.color === color &&
        item.price === price
    );

    if (existingItem) {
      await updateQuantity(existingItem._id, existingItem.quantity + quantity);
    } else {
      try {
        await cartAPI.addItem(productId, size, price, color, quantity);
        await fetchCart();
      } catch (error) {
        console.error('Failed to add item to cart:', error);
        throw error;
      }
    }
  };

  const removeFromCart = async (itemId: string) => {
    console.log('removeFromCart called with itemId:', itemId);
    try {
      const result = await cartAPI.removeItem(itemId);
      console.log('removeFromCart API result:', result);
      await fetchCart();
    } catch (error) {
      console.error('Failed to remove item from cart:', error);
      throw error;
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    console.log('updateQuantity called with itemId:', itemId, 'quantity:', quantity);
    if (quantity <= 0) {
      console.log('Quantity is 0 or negative, removing item');
      await removeFromCart(itemId);
      return;
    }

    try {
      const result = await cartAPI.updateItem(itemId, quantity);
      console.log('updateQuantity API result:', result);
      await fetchCart();
    } catch (error) {
      console.error('Failed to update cart item quantity:', error);
      throw error;
    }
  };

  const clearCart = async () => {
    if (!user) return;

    try {
      await cartAPI.clear();
      setCartItems([]);
    } catch (error) {
      console.error('Failed to clear cart:', error);
      throw error;
    }
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + (item.product_id.price || item.price || 0) * item.quantity, 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      loading,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartTotal,
      cartCount,
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

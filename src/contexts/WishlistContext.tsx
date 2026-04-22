import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from './AuthContext';
import { wishlistAPI, WishlistItem, Product } from '../pages/lib/api';

type WishlistContextType = {
  items: WishlistItem[];
  loading: boolean;
  wishlistCount: number;
  isWishlisted: (productId: string) => boolean;
  toggle: (productId: string) => Promise<void>;
  remove: (productId: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const redirectToAuth = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('authUser');
  window.location.href = '/auth';
};

const buildApiOrigin = () => {
  const raw = (import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || 'http://localhost:5001/api/') as string;
  const base = raw.replace(/\/+$/, '');
  return base.replace(/\/api$/, '');
};

const toImageUrl = (apiOrigin: string, path?: string | null) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${apiOrigin}/${path.replace(/^\/+/, '')}`;
};

const normalizeProduct = (apiOrigin: string, product: Product): Product => ({
  ...product,
  image_url: toImageUrl(apiOrigin, product.image_url),
  images: (product.images || []).map((img) => toImageUrl(apiOrigin, img)).filter(Boolean),
});

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const apiOrigin = useMemo(() => buildApiOrigin(), []);

  const refresh = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const response = await wishlistAPI.list();
      const list = Array.isArray(response?.items) ? response.items : [];
      const normalized = list.map((item: WishlistItem) => ({
        ...item,
        product: normalizeProduct(apiOrigin, item.product),
      }));
      setItems(normalized);
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user, apiOrigin]);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }
    if (user) {
      refresh();
    } else {
      setItems([]);
      setLoading(false);
    }
  }, [user, authLoading, refresh]);

  const wishlistIds = useMemo(() => {
    return items
      .map((item) => item.product?.id || item.product?._id)
      .filter(Boolean) as string[];
  }, [items]);

  const isWishlisted = useCallback((productId: string) => wishlistIds.includes(productId), [wishlistIds]);

  const remove = useCallback(
    async (productId: string) => {
      if (!user) {
        toast.error('Please sign in first before adding item to wishlist');
        redirectToAuth();
        return;
      }
      try {
        await wishlistAPI.remove(productId);
        setItems((prev) => prev.filter((item) => (item.product?.id || item.product?._id) !== productId));
        toast.info('Removed from wishlist');
      } catch (error: any) {
        if (error?.response?.status === 401) {
          toast.error('Please sign in first before adding item to wishlist');
          redirectToAuth();
          return;
        }
        toast.error('Unable to update wishlist');
      }
    },
    [user]
  );

  const toggle = useCallback(
    async (productId: string) => {
      if (!user) {
        toast.error('Please sign in first before adding item to wishlist');
        redirectToAuth();
        return;
      }
      const currently = wishlistIds.includes(productId);
      try {
        if (currently) {
          await wishlistAPI.remove(productId);
          setItems((prev) => prev.filter((item) => (item.product?.id || item.product?._id) !== productId));
          toast.info('Removed from wishlist');
        } else {
          const response = await wishlistAPI.add(productId);
          const item = response?.item as WishlistItem | undefined;
          if (item?.product) {
            const normalized = { ...item, product: normalizeProduct(apiOrigin, item.product) };
            setItems((prev) => [normalized, ...prev]);
          } else {
            await refresh();
          }
          toast.success('Added to wishlist');
        }
      } catch (error: any) {
        if (error?.response?.status === 401) {
          toast.error('Please sign in first before adding item to wishlist');
          redirectToAuth();
          return;
        }
        toast.error('Unable to update wishlist');
      }
    },
    [user, wishlistIds, apiOrigin, refresh]
  );

  return (
    <WishlistContext.Provider
      value={{
        items,
        loading,
        wishlistCount: items.length,
        isWishlisted,
        toggle,
        remove,
        refresh,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}

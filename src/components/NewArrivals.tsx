import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import {
  getProductCompareAtPrice,
  getProductDisplayPrice,
  isProductOnSale,
  productsAPI,
  Product as ApiProduct,
} from '../pages/lib/api';
import { useWishlist } from '../contexts/WishlistContext';
import StarRating from './ratings/StarRating';

type Product = ApiProduct & { id: string; rating?: number };
type ApiProductWithId = ApiProduct & { _id?: string };

const formatNaira = (value: number) => `₦${value.toFixed(2)}`;

export default function NewArrivals() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const { isWishlisted, toggle } = useWishlist();

  const apiOrigin = useMemo(() => {
    const raw = (import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || 'http://localhost:5001/api/') as string;
    const base = raw.replace(/\/+$/, '');
    return base.replace(/\/api$/, '');
  }, []);

  const toImageUrl = useCallback((path?: string | null) => {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    return `${apiOrigin}/${path.replace(/^\/+/, '')}`;
  }, [apiOrigin]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await productsAPI.getAll({ limit: 50, sort: '-createdAt', isActive: true, excludeFeatured: true });
        const list = Array.isArray(res?.data) ? (res.data as ApiProductWithId[]) : [];
        const normalized: Product[] = list.map((p) => ({
          ...p,
          id: String(p.id || p._id || ''),
          image_url: toImageUrl(p.image_url),
        }));
        normalized.sort((a, b) => {
          const aDate = new Date((a as any).createdAt || a.created_at || 0).getTime();
          const bDate = new Date((b as any).createdAt || b.created_at || 0).getTime();
          return bDate - aDate;
        });
        if (mounted) setProducts(normalized.slice(0, 8));
      } catch {
        if (mounted) setProducts([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [toImageUrl]);

  const getProductPrice = (product: Product) => {
    return getProductDisplayPrice(product);
  };

  const handleQuickAdd = async (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    if ((product.stock ?? 0) <= 0) {
      toast.error('This product is out of stock');
      return;
    }
    if (!user) {
      toast.error('Please sign in first before adding item to cart');
      navigate('/auth');
      return;
    }
    try {
      await addToCart(product.id, 1);
      toast.success('Added to cart!');
    } catch {
      toast.error('Failed to add to cart');
    }
  };

  const handleWishlistToggle = async (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    const id = product.id?.toString() || product._id?.toString();
    if (!id) {
      toast.error('Unable to update wishlist');
      return;
    }
    await toggle(id);
  };

  return (
    <section className="py-20 bg-[#f5f4f1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-gray-500">Fresh picks</p>
            <h2 className="text-3xl sm:text-4xl font-semibold text-gray-900">New Arrivals</h2>
          </div>
          <button
            className="text-sm font-semibold text-gray-900 border-b-2 border-gray-900 pb-1 hover:text-gray-600 hover:border-gray-600 transition"
            onClick={() => navigate('/products')}
          >
            View More
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-3xl p-4 shadow-sm">
                <div className="aspect-square bg-gray-200 rounded-2xl mb-4" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white px-8 py-14 text-center text-sm text-gray-500">
            No new-arrival products are available yet. Products not marked as featured will appear here.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="group bg-white rounded-3xl p-4 shadow-sm hover:shadow-md transition cursor-pointer"
                onClick={() => navigate(`/product/${product.id}`)}
              >
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#f3f3f3] flex items-center justify-center [perspective:1000px]">
                  {(product.stock ?? 0) <= 0 && (
                    <span className="absolute left-3 top-3 rounded-full bg-gray-900 px-3 py-1 text-xs text-white z-10">
                      Out of stock
                    </span>
                  )}
                  <div className="relative h-full w-full transition-transform duration-700 [transform-style:preserve-3d] [transform:rotateY(0deg)_scale(1)] group-hover:[transform:rotateY(180deg)_scale(0.95)]">
                    <img
                      src={product.image_url || ''}
                      alt={product.name}
                      className="absolute inset-0 h-full w-full object-contain [backface-visibility:hidden]"
                    />
                    <img
                      src={(product.images?.find((img) => img && img !== product.image_url) || product.image_url) || ''}
                      alt={product.name}
                      className="absolute inset-0 h-full w-full object-contain [backface-visibility:hidden] [transform:rotateY(180deg)]"
                    />
                  </div>
                  <button
                    className="absolute top-3 right-3 bg-white rounded-full p-2 shadow hover:bg-gray-100 transition"
                    aria-label="Add to wishlist"
                    onClick={(e) => handleWishlistToggle(product, e)}
                  >
                    <Heart
                      className={isWishlisted(product.id) ? 'w-4 h-4 text-pink-500' : 'w-4 h-4 text-gray-400'}
                      fill={isWishlisted(product.id) ? 'currentColor' : 'none'}
                    />
                  </button>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">{product.name}</h3>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-gray-900">
                        {formatNaira(getProductPrice(product))}
                      </span>
                      {isProductOnSale(product) && (
                        <p className="text-xs text-gray-400 line-through">
                          {formatNaira(getProductCompareAtPrice(product) || 0)}
                        </p>
                      )}
                    </div>
                  </div>
                  <StarRating
                    className="mt-2"
                    rating={product.rating}
                    count={product.rating_count}
                    emptyLabel="Be the first to rate"
                  />
                  <button
                    onClick={(e) => handleQuickAdd(product, e)}
                    className="mt-4 w-full rounded-full border border-gray-900 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-900 hover:text-white transition"
                  >
                    {user ? 'Add To Cart' : 'Sign in to add'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

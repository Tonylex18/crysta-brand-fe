import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import {
  getProductCompareAtPrice,
  getProductDisplayPrice,
  isProductOnSale,
  productsAPI,
  Product as ApiProduct,
} from '../pages/lib/api';
import StarRating from './ratings/StarRating';

type Product = ApiProduct & { id: string; rating?: number };
type ApiProductWithId = ApiProduct & { _id?: string };

const formatNaira = (value: number) => `₦${value.toFixed(2)}`;

export default function TopRatedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
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
        const res = await productsAPI.getTopRated(10);
        const list = Array.isArray(res?.data) ? (res.data as ApiProductWithId[]) : [];
        const normalized: Product[] = list.map((product) => ({
          ...product,
          id: String(product.id || product._id || ''),
          image_url: toImageUrl(product.image_url),
          images: (product.images || []).map((image) => toImageUrl(image)).filter(Boolean),
        }));
        if (mounted) {
          setProducts(normalized);
        }
      } catch {
        if (mounted) {
          setProducts([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [toImageUrl]);

  const handleQuickAdd = async (product: Product, event: React.MouseEvent) => {
    event.stopPropagation();
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
      if ((product.colors?.length || 0) > 0 || (product.sizes?.length || 0) > 0) {
        navigate(`/product/${product.id}`);
        toast.info('Select the item options on the product page before adding to cart');
        return;
      }
      await addToCart(product.id, 1);
      toast.success('Added to cart!');
    } catch {
      toast.error('Failed to add to cart');
    }
  };

  const handleWishlistToggle = async (product: Product, event: React.MouseEvent) => {
    event.stopPropagation();
    await toggle(product.id);
  };

  return (
    <section className="bg-[#fcfaf5] py-20 mt-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.32em] text-amber-700">Customer favourites</p>
            <h2 className="mt-3 text-3xl font-semibold text-gray-900 sm:text-4xl">Top Rated Products</h2>
            <p className="mt-3 max-w-2xl text-sm text-gray-600">
              The highest-rated pieces customers keep coming back for.
            </p>
          </div>
          <button
            className="text-sm font-semibold text-gray-900 border-b-2 border-gray-900 pb-1 hover:text-gray-600 hover:border-gray-600 transition"
            onClick={() => navigate('/products')}
          >
            View More
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="animate-pulse rounded-[28px] bg-white p-4 shadow-sm">
                <div className="mb-4 aspect-square rounded-2xl bg-gray-200" />
                <div className="mb-2 h-4 w-3/4 rounded bg-gray-200" />
                <div className="h-4 w-1/2 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-[32px] border border-dashed border-amber-200 bg-white px-8 py-14 text-center text-sm text-gray-500">
            Top-rated products will appear here once customer reviews come in.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06 }}
                className="group cursor-pointer rounded-[28px] bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                onClick={() => navigate(`/product/${product.id}`)}
              >
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-[#f4f0e8]">
                  <div className="absolute left-3 top-3 z-10 rounded-full bg-amber-500 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
                    Top Rated
                  </div>
                  <button
                    className="absolute right-3 top-3 z-10 rounded-full bg-white p-2 shadow transition hover:bg-gray-100"
                    onClick={(event) => handleWishlistToggle(product, event)}
                    aria-label="Add to wishlist"
                  >
                    <Heart
                      className={isWishlisted(product.id) ? 'h-4 w-4 text-pink-500' : 'h-4 w-4 text-gray-400'}
                      fill={isWishlisted(product.id) ? 'currentColor' : 'none'}
                    />
                  </button>
                  <img
                    src={product.image_url || ''}
                    alt={product.name}
                    className="h-full w-full object-contain transition duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="mt-4">
                  <h3 className="line-clamp-2 text-sm font-semibold text-gray-900">{product.name}</h3>
                  <StarRating
                    className="mt-2"
                    rating={product.rating}
                    count={product.rating_count}
                    emptyLabel="No ratings yet"
                  />
                  <div className="mt-3 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{formatNaira(getProductDisplayPrice(product))}</p>
                      {isProductOnSale(product) && (
                        <p className="text-xs text-gray-400 line-through">
                          {formatNaira(getProductCompareAtPrice(product) || 0)}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(event) => handleQuickAdd(product, event)}
                      className="rounded-full border border-gray-900 px-4 py-2 text-xs font-semibold text-gray-900 transition hover:bg-gray-900 hover:text-white"
                    >
                      {user ? 'Add' : 'Sign in'}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

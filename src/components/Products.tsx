import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Filter } from 'lucide-react';
import { toast } from 'react-toastify';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import {
  getProductCompareAtPrice,
  getProductDisplayPrice,
  isProductOnSale,
  productsAPI,
  Product as ApiProduct,
} from '../pages/lib/api';
import { useNavigate } from 'react-router-dom';
import { useWishlist } from '../contexts/WishlistContext';
import emptyProduct from '../assets/no-product-found.png'
import StarRating from './ratings/StarRating';

// Normalize backend product to UI product shape
type Product = ApiProduct & { id: string; rating?: number };
type ApiProductWithId = ApiProduct & { _id?: string };

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [priceFilter, setPriceFilter] = useState<string>('all');
  const [sizeFilter, setSizeFilter] = useState<string>('all');
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isWishlisted, toggle } = useWishlist();
  const isAuthenticated = !!user;

  // Build absolute image URL if backend returns a relative path
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
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await productsAPI.getFeatured(24);
        // Expecting { success, data: ApiProduct[] }
        const list = Array.isArray(res?.data) ? (res.data as ApiProductWithId[]) : [];
        const normalized: Product[] = list.map((p) => ({
          ...p,
          id: String(p.id || p._id || ''),
          image_url: toImageUrl(p.image_url),
        }));
        if (isMounted) setProducts(normalized);
      } catch {
        if (isMounted) setProducts([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [toImageUrl]);

  // Sort options
  const sortOptions = [
    { label: 'Featured', value: 'featured' },
    { label: 'Price: Low to High', value: 'priceLow' },
    { label: 'Price: High to Low', value: 'priceHigh' },
    { label: 'Rating', value: 'rating' }
  ];
  const [sortBy, setSortBy] = useState(sortOptions[0].value);

  // Get all available sizes from products
  const allSizes = Array.from(new Set(products.flatMap(p => p.sizes ?? [])));

  // Reset filters handler
  const resetFilters = () => {
    setPriceFilter('all');
    setSizeFilter('all');
    setSortBy('featured');
  };

  const getProductPrice = (product: Product) => {
    return getProductDisplayPrice(product);
  };

  // Filtering
  let filteredProducts = products.filter(product => {
    const priceValue = getProductPrice(product);
    const priceOk = priceFilter === 'all'
      ? true
      : priceFilter === 'under4000'
        ? priceValue < 4000
        : priceFilter === '4000to10000'
          ? priceValue >= 4000 && priceValue < 100000
          : priceValue >= 10000;

    const sizeOk = sizeFilter === 'all' || (product.sizes && product.sizes.includes(sizeFilter));
    return priceOk && sizeOk;
  });

  // Sorting
  if (sortBy === 'priceLow') {
    filteredProducts = filteredProducts.slice().sort((a, b) => getProductPrice(a) - getProductPrice(b));
  } else if (sortBy === 'priceHigh') {
    filteredProducts = filteredProducts.slice().sort((a, b) => getProductPrice(b) - getProductPrice(a));
  } else if (sortBy === 'rating') {
    filteredProducts = filteredProducts.slice().sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  } else if (sortBy === 'featured') {
    filteredProducts = filteredProducts.slice().sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
  }

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
      const id = product.id?.toString() || product._id?.toString();
      if (!id) {
        toast.error('Unable to add this product');
        return;
      }
      await addToCart(id, 1);
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
    <>
      <section id="shop" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filter chips and sort */}
          <div className="flex flex-wrap flex-col gap-5 md:flex-row items-center justify-between mb-8">
            <div className="flex flex-wrap gap-3 items-center">
              {/* Price Filter Dropdown */}
              <select
                value={priceFilter}
                onChange={e => setPriceFilter(e.target.value)}
                className="px-4 py-2 bg-gray-100 rounded-full text-gray-700 text-sm font-medium hover:bg-gray-200 transition-all"
              >
                <option value="all">All Prices</option>
                <option value="under4000">Under ₦4,000</option>
                <option value="4000to10000">₦4,000 - ₦10,000</option>
                <option value="over10000">Over ₦10,0000</option>
              </select>
              {/* Size Filter Dropdown */}
              <select
                value={sizeFilter}
                onChange={e => setSizeFilter(e.target.value)}
                className="px-4 py-2 bg-gray-100 rounded-full text-gray-700 text-sm font-medium hover:bg-gray-200 transition-all"
              >
                <option value="all">All Sizes</option>
                {allSizes.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
              {/* All Filters Button */}
              <button
                className="flex items-center px-4 py-2 bg-gray-100 rounded-full text-gray-700 text-sm font-medium hover:bg-gray-200 transition-all"
                onClick={resetFilters}
              >
                All Filters
                <Filter className="ml-2 w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600 text-sm font-medium">Sort by</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="bg-gray-100 rounded-full px-4 py-2 text-sm font-medium text-gray-700 border focus:outline-none"
              >
                {sortOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              Featured Products
            </h2>
          </motion.div>
              
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square bg-gray-200 rounded-2xl mb-4" />
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <img
              src={emptyProduct}
              alt="No product found"
              className="mx-auto mb-6 w-full max-w-[440px] object-contain"
            />
              <p className="text-xl font-semibold text-gray-600 mb-4">
                No products found for the selected filter.
              </p>
              <button
                className="px-6 py-2 bg-[#12108b] text-white rounded-full font-semibold hover:bg-[#12108b]/90 transition"
                onClick={resetFilters}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="group bg-white rounded-3xl p-4 shadow-xl hover:shadow-xl transition cursor-pointer"
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
                      <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
                        {product.name}
                      </h3>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-gray-900">
                          ₦{getProductPrice(product).toFixed(2)}
                        </span>
                        {isProductOnSale(product) && (
                          <p className="text-xs text-gray-400 line-through">
                            ₦{(getProductCompareAtPrice(product) || 0).toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-500 text-sm mt-2 line-clamp-2">{product.description}</p>
                    <StarRating
                      className="mt-2"
                      rating={product.rating}
                      count={product.rating_count}
                      emptyLabel="Be the first to rate"
                    />
                    <button
                      onClick={e => handleQuickAdd(product, e)}
                      className="mt-4 w-full rounded-full border border-gray-900 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-900 hover:text-white transition"
                    >
                      {isAuthenticated ? 'Add to Cart' : 'Sign in to add'}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

    </>
  );
}

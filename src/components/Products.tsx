import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Filter } from 'lucide-react';
import { toast } from 'react-toastify';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { productsAPI, Product as ApiProduct } from '../lib/api';

// Normalize backend product to UI product shape
type Product = ApiProduct & { id: string; rating?: number };

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [priceFilter, setPriceFilter] = useState<string>('all');
  const [sizeFilter, setSizeFilter] = useState<string>('all');
  const { addToCart } = useCart();
  const { user } = useAuth();

  // Build absolute image URL if backend returns a relative path
  const apiOrigin = useMemo(() => {
    const raw = (import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || 'http://localhost:5001/api/') as string;
    const base = raw.replace(/\/+$/, '');
    return base.replace(/\/api$/, '');
  }, []);

  const toImageUrl = (path?: string | null) => {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    return `${apiOrigin}/${path.replace(/^\/+/, '')}`;
  };

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await productsAPI.getAll();
        // Expecting { success, data: ApiProduct[] }
        const list: any[] = Array.isArray(res?.data) ? res.data : [];
        const normalized: Product[] = list.map((p: any) => ({
          ...(p as ApiProduct),
          id: (p.id || p._id || '').toString(),
          image_url: toImageUrl(p.image_url),
        }));
        if (isMounted) setProducts(normalized);
      } catch (e) {
        if (isMounted) setProducts([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [apiOrigin]);

  // Dummy filter chips
  const filterChips = [
    'Price',
    'Color',
    'Size',
    'All Filters'
  ];

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

  // Filtering
  let filteredProducts = products.filter(product => {
    let priceOk = true;
    if (priceFilter === 'under50') priceOk = product.price < 50;
    else if (priceFilter === '50to100') priceOk = product.price >= 50 && product.price < 100;
    else if (priceFilter === 'over100') priceOk = product.price >= 100;

    let sizeOk = sizeFilter === 'all' || (product.sizes && product.sizes.includes(sizeFilter));
    return priceOk && sizeOk;
  });

  // Sorting
  if (sortBy === 'priceLow') {
    filteredProducts = filteredProducts.slice().sort((a, b) => a.price - b.price);
  } else if (sortBy === 'priceHigh') {
    filteredProducts = filteredProducts.slice().sort((a, b) => b.price - a.price);
  } else if (sortBy === 'rating') {
    filteredProducts = filteredProducts.slice().sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  } else if (sortBy === 'featured') {
    filteredProducts = filteredProducts.slice().sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
  }

  const handleQuickAdd = async (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast.error('Please sign in to add items to cart');
      return;
    }
    try {
      await addToCart(
        product.id.toString(),
        product.sizes?.[0] || 'M',
        product.colors?.[0] || 'Black',
        product.price
      );
      toast.success('Added to cart!');
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  return (
    <>
      <section id="shop" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filter chips and sort */}
          <div className="flex flex-wrap items-center justify-between mb-8">
            <div className="flex flex-wrap gap-3 items-center">
              {/* Price Filter Dropdown */}
              <select
                value={priceFilter}
                onChange={e => setPriceFilter(e.target.value)}
                className="px-4 py-2 bg-gray-100 rounded-full text-gray-700 text-sm font-medium hover:bg-gray-200 transition-all"
              >
                <option value="all">All Prices</option>
                <option value="under50">Under ₦50</option>
                <option value="50to100">₦50 - ₦100</option>
                <option value="over100">Over ₦100</option>
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
              Feature Product
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
              <p className="text-xl text-gray-600 mb-4">
                No products found for the selected filter.
              </p>
              <button
                className="px-6 py-2 bg-teal-600 text-white rounded-full font-semibold hover:bg-teal-700 transition"
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
                  onClick={() => setSelectedProduct(product)}
                  className="group cursor-pointer rounded-2xl transition-all"
                >
                  <div className="relative aspect-square rounded-2xl overflow-hidden mb-4 flex items-center justify-center">
                    <img
                      src={product.image_url || ''}
                      alt={product.name}
                      className="w-full h-full object-contain transition-transform duration-500"
                    />
                    <button
                      className="absolute top-4 right-4 bg-white rounded-full p-2 shadow hover:bg-gray-100 transition"
                      aria-label="Add to wishlist"
                    >
                      <Heart className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>
                  <div className='flex items-center justify-between'>
                    <h3 className="font-semibold text-gray-900 mb-1 text-lg">
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold font-serif text-gray-900">
                      ₦{product.price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-500 text-sm mb-2">{product.description}</p>
                  {/* Rating */}
                  <div className="flex items-center mb-3">
                    <span className="text-green-600 font-bold text-lg mr-1">
                      {'★'.repeat(Math.round(product.rating ?? 4))}
                    </span>
                    <span className="text-gray-600 text-sm">({Math.floor((product.rating ?? 4) * 25)})</span>
                  </div>
                  <button
                    onClick={e => handleQuickAdd(product, e)}
                    className="w-fit px-4 py-1 rounded-full text-gray-900 font-semibold hover:bg-gray-200 transition-all border"
                  >
                    Add to Cart
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )} */}
    </>
  );
}

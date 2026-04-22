import { useEffect, useMemo, useState } from 'react';
import { Filter, Heart, Search, X } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  categoriesAPI,
  getProductCompareAtPrice,
  getProductDisplayPrice,
  productsAPI,
  Product as ApiProduct,
  subcategoriesAPI,
} from './lib/api';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useWishlist } from '../contexts/WishlistContext';
import StarRating from '../components/ratings/StarRating';

type ApiProductWithId = ApiProduct & { _id?: string };
type Category = {
  _id?: string;
  id?: string;
  name?: string;
  slug?: string;
  parent_id?: { _id?: string; id?: string; name?: string; slug?: string } | string | null;
};
type Product = ApiProduct & { id: string; rating?: number };

const formatNaira = (value: number) => `₦${value.toFixed(2)}`;

const getSubcategoryId = (product: Product) => {
  const raw = product.category_id as any;
  if (!raw) return undefined;
  if (typeof raw === 'string') return raw;
  return raw._id || raw.id;
};

const getSubcategoryName = (product: Product) => {
  const raw = product.category_id as any;
  if (!raw || typeof raw === 'string') return '';
  return String(raw.name || '').trim();
};

const getParentCategoryId = (product: Product) => {
  const raw = product.category_id as any;
  if (!raw || typeof raw === 'string') return undefined;
  const parent = raw.parent_id;
  if (!parent) return undefined;
  if (typeof parent === 'string') return parent;
  return parent._id || parent.id;
};

const getParentCategoryName = (product: Product) => {
  const raw = product.category_id as any;
  if (!raw || typeof raw === 'string') return '';
  const parent = raw.parent_id;
  if (!parent || typeof parent === 'string') return '';
  return String(parent.name || '').trim();
};

const parseFilterList = (value: string | null) =>
  value
    ? value
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean)
    : [];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [ratingMin, setRatingMin] = useState(0);
  const [sortBy, setSortBy] = useState('best');
  const [showSecondImage, setShowSecondImage] = useState(true);
  const [showQuickAdd, setShowQuickAdd] = useState(true);
  const [showQuickView, setShowQuickView] = useState(true);
  const [showSoldOutBadge, setShowSoldOutBadge] = useState(true);
  const [showCategoryLabel, setShowCategoryLabel] = useState(true);
  const [cardAction, setCardAction] = useState<'popup' | 'navigate'>('navigate');
  const [swatchLimit, setSwatchLimit] = useState(4);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [searchDraft, setSearchDraft] = useState('');

  const { addToCart } = useCart();
  const { user } = useAuth();
  const { isWishlisted, toggle } = useWishlist();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

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
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const [productsRes, categoriesRes, subcategoriesRes] = await Promise.all([
          productsAPI.getAll({ limit: 200, sort: '-createdAt', isActive: true }),
          categoriesAPI.getAll({ parent_id: 'null' }),
          subcategoriesAPI.getAll({ limit: 300 }),
        ]);
        const list = Array.isArray(productsRes?.data) ? (productsRes.data as ApiProductWithId[]) : [];
        const normalized: Product[] = list.map((p) => ({
          ...p,
          id: String(p.id || p._id || ''),
          image_url: toImageUrl(p.image_url),
          images: (p.images || []).map((img) => toImageUrl(img)).filter(Boolean),
        }));
        const categoryList = Array.isArray(categoriesRes?.data) ? (categoriesRes.data as Category[]) : [];
        const subcategoryList = Array.isArray(subcategoriesRes?.data) ? (subcategoriesRes.data as Category[]) : [];
        if (mounted) {
          setProducts(normalized);
          setCategories(categoryList);
          setSubcategories(subcategoryList);
        }
      } catch {
        if (mounted) {
          setProducts([]);
          setCategories([]);
          setSubcategories([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setSearchTerm(searchParams.get('q')?.trim() || '');
    setSearchDraft(searchParams.get('q')?.trim() || '');
    setSelectedCategories(parseFilterList(searchParams.get('category')));
    setSelectedSubcategories(parseFilterList(searchParams.get('subcategory')));
    setSelectedColors([]);
    setSelectedSizes([]);
    setMinPrice('');
    setMaxPrice('');
    setInStockOnly(false);
    setOnSaleOnly(false);
    setRatingMin(0);
  }, [searchParams]);

  useEffect(() => {
    if (!filterOpen) return;

    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = 'hidden';

    return () => {
      body.style.overflow = previousOverflow;
    };
  }, [filterOpen]);

  const allColors = useMemo(() => {
    const colors = new Set<string>();
    products.forEach((p) => (p.colors || []).forEach((c) => colors.add(c)));
    return Array.from(colors);
  }, [products]);

  const allSizes = useMemo(() => {
    const sizes = new Set<string>();
    products.forEach((p) => (p.sizes || []).forEach((s) => sizes.add(s)));
    return Array.from(sizes);
  }, [products]);

  const categoryNameMap = useMemo(
    () =>
      new Map(
        categories.map((category) => [
          String(category.id || category._id || ''),
          String(category.name || ''),
        ]),
      ),
    [categories],
  );

  const subcategoryNameMap = useMemo(
    () =>
      new Map(
        subcategories.map((subcategory) => [
          String(subcategory.id || subcategory._id || ''),
          String(subcategory.name || ''),
        ]),
      ),
    [subcategories],
  );

  const getProductPrice = (product: Product) => {
    return getProductDisplayPrice(product);
  };

  const getProductCompare = (product: Product) => {
    return getProductCompareAtPrice(product);
  };

  const getDiscount = (product: Product) => {
    if (typeof product.discountPercentage === 'number') return product.discountPercentage;
    const compareAt = getProductCompare(product);
    const price = getProductPrice(product);
    if (compareAt && compareAt > price) {
      return Math.round(((compareAt - price) / compareAt) * 100);
    }
    return 0;
  };

  const filteredProducts = useMemo(() => {
    const min = minPrice ? Number(minPrice) : undefined;
    const max = maxPrice ? Number(maxPrice) : undefined;
    const searchLower = searchTerm.trim().toLowerCase();

    return products.filter((product) => {
      const price = getProductPrice(product);
      const compareAt = getProductCompare(product);
      const rating = product.rating ?? 0;

      const subcategoryId = getSubcategoryId(product);
      const parentCategoryId = getParentCategoryId(product) || subcategoryId;
      const subcategoryName = getSubcategoryName(product).toLowerCase();
      const parentCategoryName = getParentCategoryName(product).toLowerCase();

      const matchesCategory =
        selectedCategories.length === 0 || (parentCategoryId && selectedCategories.includes(parentCategoryId));
      const matchesSubcategory =
        selectedSubcategories.length === 0 || (subcategoryId && selectedSubcategories.includes(subcategoryId));
      const matchesSearch =
        !searchLower ||
        product.name.toLowerCase().includes(searchLower) ||
        (product.description || '').toLowerCase().includes(searchLower) ||
        (product.tags || []).some((tag) => tag.toLowerCase().includes(searchLower)) ||
        subcategoryName.includes(searchLower) ||
        parentCategoryName.includes(searchLower);
      const matchesPrice = (min === undefined || price >= min) && (max === undefined || price <= max);
      const matchesStock = !inStockOnly || (product.stock ?? 0) > 0;
      const matchesSale = !onSaleOnly || (compareAt !== undefined && compareAt > price);
      const matchesRating = rating >= ratingMin;
      const matchesColors =
        selectedColors.length === 0 || (product.colors || []).some((c) => selectedColors.includes(c));
      const matchesSizes =
        selectedSizes.length === 0 || (product.sizes || []).some((s) => selectedSizes.includes(s));

      return (
        matchesCategory &&
        matchesSubcategory &&
        matchesSearch &&
        matchesPrice &&
        matchesStock &&
        matchesSale &&
        matchesRating &&
        matchesColors &&
        matchesSizes
      );
    });
  }, [
    products,
    selectedCategories,
    selectedSubcategories,
    selectedColors,
    selectedSizes,
    searchTerm,
    minPrice,
    maxPrice,
    inStockOnly,
    onSaleOnly,
    ratingMin,
  ]);

  const sortedProducts = useMemo(() => {
    const items = [...filteredProducts];
    switch (sortBy) {
      case 'newest':
        return items.sort((a, b) => {
          const aDate = new Date((a as any).createdAt || a.created_at || 0).getTime();
          const bDate = new Date((b as any).createdAt || b.created_at || 0).getTime();
          return bDate - aDate;
        });
      case 'priceLow':
        return items.sort((a, b) => getProductPrice(a) - getProductPrice(b));
      case 'priceHigh':
        return items.sort((a, b) => getProductPrice(b) - getProductPrice(a));
      case 'rating':
        return items.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      case 'name':
        return items.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return items.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }
  }, [filteredProducts, sortBy]);

  const pageHeading = useMemo(() => {
    if (selectedSubcategories.length === 1) {
      return subcategoryNameMap.get(selectedSubcategories[0]) || 'Filtered Products';
    }
    if (selectedCategories.length === 1) {
      return categoryNameMap.get(selectedCategories[0]) || 'Filtered Products';
    }
    if (searchTerm.trim()) {
      return `Search: ${searchTerm.trim()}`;
    }
    return 'All Products';
  }, [categoryNameMap, searchTerm, selectedCategories, selectedSubcategories, subcategoryNameMap]);

  const pageEyebrow = useMemo(() => {
    if (selectedSubcategories.length > 0) return 'Subcategory results';
    if (selectedCategories.length > 0) return 'Category results';
    if (searchTerm.trim()) return 'Search results';
    return 'All collections';
  }, [searchTerm, selectedCategories.length, selectedSubcategories.length]);

  const resetFilters = () => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete('q');
      next.delete('category');
      next.delete('subcategory');
      return next;
    });
    setSearchTerm('');
    setSearchDraft('');
    setSelectedCategories([]);
    setSelectedSubcategories([]);
    setSelectedColors([]);
    setSelectedSizes([]);
    setMinPrice('');
    setMaxPrice('');
    setInStockOnly(false);
    setOnSaleOnly(false);
    setRatingMin(0);
  };

  const applySearch = () => {
    const nextValue = searchDraft.trim();
    setSearchTerm(nextValue);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (nextValue) {
        next.set('q', nextValue);
      } else {
        next.delete('q');
      }
      return next;
    });
  };

  const toggleSelection = (value: string, values: string[], setter: (next: string[]) => void) => {
    if (values.includes(value)) {
      setter(values.filter((item) => item !== value));
    } else {
      setter([...values, value]);
    }
  };

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
      await addToCart(product.id, 1);
      toast.success('Added to cart!');
    } catch {
      toast.error('Failed to add to cart');
    }
  };

  const handleCardClick = (product: Product) => {
    if (cardAction === 'popup' && showQuickView) {
      setQuickViewProduct(product);
      return;
    }
    navigate(`/product/${product.id}`);
  };

  const handleWishlistToggle = async (product: Product, event: React.MouseEvent) => {
    event.stopPropagation();
    await toggle(product.id);
  };

  const renderFilterContent = (isMobile = false) => (
    <div
      className={`rounded-3xl bg-white/95 backdrop-blur shadow-[0_20px_60px_-40px_rgba(0,0,0,0.45)] ${
        isMobile ? 'flex h-full flex-col' : 'p-6'
      }`}
    >
      <div className={`flex items-center justify-between ${isMobile ? 'border-b border-gray-100 px-5 py-5' : ''}`}>
        <h2 className="text-lg font-semibold text-gray-900">Filter</h2>
        <div className="flex items-center gap-3">
          <button className="text-xs text-gray-500 hover:text-gray-700" onClick={resetFilters}>
            Reset
          </button>
          {isMobile ? (
            <button
              type="button"
              onClick={() => setFilterOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-700"
              aria-label="Close filters"
            >
              <X className="h-5 w-5" />
            </button>
          ) : null}
        </div>
      </div>

      <div className={isMobile ? 'flex-1 space-y-6 overflow-y-auto px-5 py-5' : 'space-y-6'}>
        <div className="space-y-3 border-b border-gray-100 pb-6">
          <p className="text-sm font-semibold text-gray-700">Theme settings</p>
          <label className="flex items-center justify-between text-sm text-gray-600">
            Show second image on hover
            <input type="checkbox" checked={showSecondImage} onChange={() => setShowSecondImage((v) => !v)} />
          </label>
          <label className="flex items-center justify-between text-sm text-gray-600">
            Show category label
            <input type="checkbox" checked={showCategoryLabel} onChange={() => setShowCategoryLabel((v) => !v)} />
          </label>
          <label className="flex items-center justify-between text-sm text-gray-600">
            Enable quick add button
            <input type="checkbox" checked={showQuickAdd} onChange={() => setShowQuickAdd((v) => !v)} />
          </label>
          <label className="flex items-center justify-between text-sm text-gray-600">
            Enable quick view button
            <input type="checkbox" checked={showQuickView} onChange={() => setShowQuickView((v) => !v)} />
          </label>
          <label className="flex items-center justify-between text-sm text-gray-600">
            Show sold out badge
            <input type="checkbox" checked={showSoldOutBadge} onChange={() => setShowSoldOutBadge((v) => !v)} />
          </label>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700">Card action</p>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="radio"
                name="card-action"
                checked={cardAction === 'popup'}
                onChange={() => setCardAction('popup')}
              />
              Open popup
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="radio"
                name="card-action"
                checked={cardAction === 'navigate'}
                onChange={() => setCardAction('navigate')}
              />
              Go to product page
            </label>
          </div>
        </div>

        <div className="space-y-3 border-b border-gray-100 pb-6">
          <p className="text-sm font-semibold text-gray-700">Category</p>
          <div className="space-y-2 max-h-40 overflow-auto pr-1">
            {categories.map((category) => {
              const id = category._id || category.id || '';
              return (
                <label key={id} className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(id)}
                    onChange={() => toggleSelection(id, selectedCategories, setSelectedCategories)}
                  />
                  {category.name}
                </label>
              );
            })}
          </div>
        </div>

        <div className="space-y-3 border-b border-gray-100 pb-6">
          <p className="text-sm font-semibold text-gray-700">Price range</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={minPrice}
              onChange={(event) => setMinPrice(event.target.value)}
            />
            <input
              type="number"
              placeholder="Max"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
            />
          </div>
        </div>

        <div className="space-y-3 border-b border-gray-100 pb-6">
          <p className="text-sm font-semibold text-gray-700">Color swatches</p>
          <div className="flex flex-wrap gap-2">
            {allColors.length === 0 && <span className="text-xs text-gray-400">No colors available</span>}
            {allColors.map((color) => (
              <button
                key={color}
                type="button"
                className={`h-7 w-7 rounded-full border ${selectedColors.includes(color) ? 'ring-2 ring-gray-800' : 'border-gray-200'}`}
                style={{ backgroundColor: color }}
                onClick={() => toggleSelection(color, selectedColors, setSelectedColors)}
                title={color}
              />
            ))}
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Maximum swatches to show</span>
            <input
              type="number"
              className="w-16 rounded border border-gray-200 px-2 py-1 text-xs"
              min={1}
              max={8}
              value={swatchLimit}
              onChange={(event) => setSwatchLimit(Math.min(8, Math.max(1, Number(event.target.value))))}
            />
          </div>
        </div>

        <div className="space-y-3 border-b border-gray-100 pb-6">
          <p className="text-sm font-semibold text-gray-700">Sizes</p>
          <div className="flex flex-wrap gap-2">
            {allSizes.length === 0 && <span className="text-xs text-gray-400">No sizes available</span>}
            {allSizes.map((size) => (
              <button
                key={size}
                type="button"
                className={`rounded-full px-3 py-1 text-xs border ${selectedSizes.includes(size) ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600'}`}
                onClick={() => toggleSelection(size, selectedSizes, setSelectedSizes)}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3 border-b border-gray-100 pb-6">
          <p className="text-sm font-semibold text-gray-700">Rating</p>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="range"
              min={0}
              max={5}
              step={0.5}
              value={ratingMin}
              onChange={(event) => setRatingMin(Number(event.target.value))}
            />
            <span>{ratingMin.toFixed(1)}+</span>
          </div>
        </div>

        <div className="space-y-2 text-sm text-gray-600">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={inStockOnly} onChange={() => setInStockOnly((v) => !v)} />
            In stock only
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={onSaleOnly} onChange={() => setOnSaleOnly((v) => !v)} />
            On sale
          </label>
        </div>
      </div>

      {isMobile ? (
        <div className="border-t border-gray-100 px-5 py-4">
          <button
            type="button"
            onClick={() => setFilterOpen(false)}
            className="w-full rounded-full bg-gray-900 py-3 text-sm font-semibold text-white"
          >
            Show {sortedProducts.length} product{sortedProducts.length === 1 ? '' : 's'}
          </button>
        </div>
      ) : null}
    </div>
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f2f0eb,_#ffffff_55%)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col gap-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-gray-500">{pageEyebrow}</p>
              <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900">{pageHeading}</h1>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-gray-300 lg:hidden"
              onClick={() => setFilterOpen(true)}
            >
              <Filter className="h-4 w-4" />
              Filters
            </button>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative w-full md:w-[360px]">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search product"
                className="w-full rounded-full border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                value={searchDraft}
                onChange={(event) => {
                  setSearchDraft(event.target.value);
                  setSearchTerm(event.target.value);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    applySearch();
                  }
                }}
              />
              <button
                type="button"
                onClick={applySearch}
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-gray-900 text-white"
                aria-label="Apply search"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <span className="rounded-full bg-white px-3 py-1 shadow-sm">{sortedProducts.length} products</span>
              {(selectedCategories.length > 0 ||
                selectedSubcategories.length > 0 ||
                selectedColors.length > 0 ||
                selectedSizes.length > 0 ||
                minPrice ||
                maxPrice ||
                searchTerm) && (
                <button
                  className="rounded-full border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-600 hover:border-gray-400"
                  onClick={resetFilters}
                >
                  Clear filters
                </button>
              )}
              <div className="flex items-center gap-2">
                <span>Sort by:</span>
                <select
                  className="rounded-full border border-gray-200 bg-white px-3 py-2 text-sm"
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                >
                  <option value="best">Best selling</option>
                  <option value="newest">Newest</option>
                  <option value="priceLow">Price: Low to High</option>
                  <option value="priceHigh">Price: High to Low</option>
                  <option value="rating">Top rated</option>
                  <option value="name">Alphabetical</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8">
          <aside className="hidden lg:block">
            <div className="lg:sticky lg:top-24">
              {renderFilterContent()}
            </div>
          </aside>

          <section>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse rounded-3xl bg-white p-4 shadow-sm">
                    <div className="h-48 bg-gray-200 rounded-2xl mb-4" />
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : sortedProducts.length === 0 ? (
              <div className="rounded-3xl bg-white p-10 text-center text-gray-600 shadow-sm">
                No products match your filters.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {sortedProducts.map((product) => {
                  const price = getProductPrice(product);
                  const compareAt = getProductCompare(product);
                  const discount = getDiscount(product);
                  const backImage = showSecondImage
                    ? product.images?.find((img) => img && img !== product.image_url) || product.image_url
                    : product.image_url;
                  const category = (product.category_id as any)?.name;
                  const rating = product.rating ?? 0;
                  const stock = product.stock ?? 0;

                  return (
                    <div
                      key={product.id}
                      className="group rounded-3xl bg-white p-4 shadow-sm hover:shadow-md transition cursor-pointer"
                      onClick={() => handleCardClick(product)}
                    >
                      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#f3f3f3] flex items-center justify-center [perspective:1000px]">
                        <div className="relative h-full w-full transition-transform duration-700 [transform-style:preserve-3d] [transform:rotateY(0deg)_scale(1)] group-hover:[transform:rotateY(180deg)_scale(0.95)]">
                          <img
                            src={product.image_url || ''}
                            alt={product.name}
                            className="absolute inset-0 h-full w-full object-contain [backface-visibility:hidden]"
                          />
                          <img
                            src={backImage || ''}
                            alt={product.name}
                            className="absolute inset-0 h-full w-full object-contain [backface-visibility:hidden] [transform:rotateY(180deg)]"
                          />
                        </div>
                        {showSoldOutBadge && stock === 0 && (
                          <span className="absolute left-3 top-3 rounded-full bg-gray-900 px-3 py-1 text-xs text-white">
                            Out of stock
                          </span>
                        )}
                        {discount > 0 && (
                          <span className="absolute left-3 top-12 rounded-full bg-emerald-600 px-3 py-1 text-xs text-white">
                            -{discount}%
                          </span>
                        )}
                        <button
                          className="absolute right-3 top-3 rounded-full bg-white p-2 shadow hover:bg-gray-100"
                          onClick={(event) => handleWishlistToggle(product, event)}
                        >
                          <Heart
                            className={isWishlisted(product.id) ? 'h-4 w-4 text-pink-500' : 'h-4 w-4 text-gray-400'}
                            fill={isWishlisted(product.id) ? 'currentColor' : 'none'}
                          />
                        </button>
                        {showQuickView && (
                          <button
                            className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-4 py-2 text-xs font-semibold text-gray-800 opacity-0 transition group-hover:opacity-100"
                            onClick={(event) => {
                              event.stopPropagation();
                              setQuickViewProduct(product);
                            }}
                          >
                            Quick view
                          </button>
                        )}
                      </div>
                      <div className="mt-4 space-y-2">
                        {showCategoryLabel && category && (
                          <p className="text-xs uppercase tracking-[0.2em] text-gray-400">{category}</p>
                        )}
                        <h3 className="text-base font-semibold text-gray-900 line-clamp-2">{product.name}</h3>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-semibold text-gray-900">{formatNaira(price)}</span>
                          {compareAt && compareAt > price && (
                            <span className="text-gray-400 line-through">{formatNaira(compareAt)}</span>
                          )}
                        </div>
                        <StarRating
                          className="mt-1"
                          rating={rating}
                          count={product.rating_count}
                          emptyLabel="Be the first to rate"
                        />
                        {product.colors && product.colors.length > 0 && (
                          <div className="flex items-center gap-2">
                            {product.colors.slice(0, swatchLimit).map((color) => (
                              <span
                                key={color}
                                className="h-4 w-4 rounded-full border border-gray-200"
                                style={{ backgroundColor: color }}
                                title={color}
                              />
                            ))}
                            {product.colors.length > swatchLimit && (
                              <span className="text-xs text-gray-400">+{product.colors.length - swatchLimit}</span>
                            )}
                          </div>
                        )}
                        {showQuickAdd && (
                          <button
                            onClick={(event) => handleQuickAdd(product, event)}
                            className="mt-2 w-full rounded-full border border-gray-900 py-2 text-xs font-semibold text-gray-900 hover:bg-gray-900 hover:text-white transition"
                          >
                            {user ? 'Add to cart' : 'Sign in to add'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      {filterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-[rgba(17,24,39,0.38)] backdrop-blur-md"
            onClick={() => setFilterOpen(false)}
            aria-label="Close filters"
          />
          <div className="absolute inset-0 p-3">
            {renderFilterContent(true)}
          </div>
        </div>
      )}

      {quickViewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-3xl rounded-3xl bg-white p-6 relative">
            <button className="absolute right-4 top-4" onClick={() => setQuickViewProduct(null)}>
              <X className="h-5 w-5" />
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-2xl bg-[#f3f3f3] p-6 flex items-center justify-center">
                <img
                  src={quickViewProduct.image_url || ''}
                  alt={quickViewProduct.name}
                  className="max-h-72 object-contain"
                />
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Quick view</p>
                  <h3 className="text-2xl font-semibold">{quickViewProduct.name}</h3>
                </div>
                <div className="flex items-center gap-2 text-lg">
                  <span className="font-semibold text-gray-900">{formatNaira(getProductPrice(quickViewProduct))}</span>
                  {getProductCompare(quickViewProduct) &&
                    (getProductCompare(quickViewProduct) || 0) > getProductPrice(quickViewProduct) && (
                      <span className="text-gray-400 line-through">
                        {formatNaira(getProductCompare(quickViewProduct) || 0)}
                      </span>
                    )}
                </div>
                <p className="text-sm text-gray-600">{quickViewProduct.description}</p>
                {showQuickAdd && (
                  <button
                    className="w-full rounded-full bg-gray-900 py-2 text-sm font-semibold text-white"
                    onClick={(event) => {
                      handleQuickAdd(quickViewProduct, event);
                    }}
                  >
                    {user ? 'Add to cart' : 'Sign in to add'}
                  </button>
                )}
                <button
                  className="w-full rounded-full border border-gray-900 py-2 text-sm font-semibold text-gray-900"
                  onClick={() => navigate(`/product/${quickViewProduct.id}`)}
                >
                  View full details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

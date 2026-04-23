import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getProductCompareAtPrice,
  getProductDisplayPrice,
  productsAPI,
  reviewsAPI,
  Review,
  Product as ApiProduct,
} from './lib/api';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import StarRating from '../components/ratings/StarRating';

const formatNaira = (value: number) => `₦${value.toFixed(2)}`;

type Product = ApiProduct & {
  id?: string;
  _id?: string;
  images?: string[];
  compareAtPrice?: number | null;
  tags?: string[];
};

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

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
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await productsAPI.getById(id);
        const data = res?.data as Product | undefined;
        if (!data || !(data.id || data._id)) {
          throw new Error('Product not found');
        }
        const normalized: Product = {
          ...data,
          image_url: toImageUrl(data.image_url),
          images: (data.images || []).map((img) => toImageUrl(img)).filter(Boolean),
        };
        const gallery = Array.from(
          new Set([normalized.image_url, ...(normalized.images || [])].filter(Boolean) as string[])
        );
        if (mounted) {
          setProduct(normalized);
          setSelectedImage(gallery[0] || '');
          setSelectedColor(normalized.colors?.[0] || null);
          setSelectedSize(normalized.sizes?.[0] || null);
        }
      } catch (err: any) {
        if (mounted) setError(err.message || 'Failed to load product');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [id, apiOrigin]);

  useEffect(() => {
    let mounted = true;

    const loadReviews = async () => {
      if (!id) return;
      try {
        const response = await reviewsAPI.listProductReviews(id);
        if (mounted) {
          setReviews(Array.isArray(response?.reviews) ? response.reviews : []);
        }
      } catch {
        if (mounted) setReviews([]);
      }
    };

    loadReviews();

    return () => {
      mounted = false;
    };
  }, [id]);

  const price = useMemo(() => {
    if (!product) return 0;
    return getProductDisplayPrice(product);
  }, [product]);

  const gallery = useMemo(() => {
    if (!product) return [];
    const imgs = Array.from(
      new Set([product.image_url, ...(product.images || [])].filter(Boolean) as string[])
    );
    return imgs.length ? imgs : [''];
  }, [product]);

  useEffect(() => {
    let mounted = true;
    const loadRelated = async () => {
      if (!product) return;
      try {
        const res = await productsAPI.getAll();
        const list = Array.isArray(res?.data) ? (res.data as Product[]) : [];
        const normalized = list
          .map((p) => ({
            ...p,
            image_url: toImageUrl(p.image_url),
            images: (p.images || []).map((img) => toImageUrl(img)).filter(Boolean),
          }))
          .filter((p) => (p.id || p._id) && String(p.id || p._id) !== String(product.id || product._id));
        if (mounted) setRelatedProducts(normalized.slice(0, 4));
      } catch {
        if (mounted) setRelatedProducts([]);
      }
    };
    loadRelated();
    return () => {
      mounted = false;
    };
  }, [product]);

  const handleAddToCart = async () => {
    if (!product) return;
    if ((product.stock ?? 0) <= 0) {
      toast.error('This product is out of stock');
      return;
    }
    if (!user) {
      toast.error('Please sign in first before adding item to cart');
      navigate('/auth');
      return;
    }
    const productId = String(product.id || product._id || '');
    if (!productId) return;
    try {
      await addToCart(productId, quantity, {
        selectedSize,
        selectedColor,
      });
      toast.success('Added to cart');
    } catch {
      toast.error('Failed to add to cart');
    }
  };

  const handleBuyNow = async () => {
    if ((product?.stock ?? 0) <= 0) {
      toast.error('This product is out of stock');
      return;
    }
    await handleAddToCart();
    if (user) navigate('/checkout');
  };

  if (loading) {
    return <div className="py-20 text-center">Loading product...</div>;
  }

  if (error || !product) {
    return (
      <div className="py-20 text-center">
        <p className="text-red-600">{error || 'Product not found'}</p>
      </div>
    );
  }

  const stockValue = product.stock ?? 0;

  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-sm text-gray-500 mb-6">
          Home / Products / <span className="text-gray-900 font-medium">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div>
            <div className="bg-gray-100 rounded-3xl p-6 flex items-center justify-center min-h-[420px]">
              {selectedImage ? (
                <img src={selectedImage} alt={product.name} className="max-h-[360px] object-contain" />
              ) : (
                <div className="text-gray-400">No image</div>
              )}
            </div>

            {gallery.length > 1 && (
              <div className="mt-4 flex gap-3">
                {gallery.map((img, idx) => (
                  <button
                    key={`${img}-${idx}`}
                    onClick={() => setSelectedImage(img)}
                    className={`w-20 h-20 rounded-2xl border ${selectedImage === img ? 'border-black' : 'border-gray-200'} bg-white flex items-center justify-center`}
                  >
                    <img src={img} alt={`${product.name} ${idx + 1}`} className="max-h-14 object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
            <StarRating
              className="mb-3"
              rating={product.rating}
              count={product.rating_count}
              emptyLabel="No customer ratings yet"
            />
            <p className="text-gray-600 mb-4">{product.description || 'Premium quality product built for everyday comfort.'}</p>

            <div className="flex items-center gap-4 mb-6">
              <div className="text-2xl font-semibold text-gray-900">{formatNaira(price)}</div>
              {getProductCompareAtPrice(product) ? (
                <div className="text-gray-400 line-through">{formatNaira(getProductCompareAtPrice(product) || 0)}</div>
              ) : null}
              <div className="text-sm text-green-600">In stock: {stockValue}</div>
            </div>

            {product.colors && product.colors.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-2">Choose a Color</p>
                <div className="flex items-center gap-3">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-8 h-8 rounded-full border-2 ${selectedColor === color ? 'border-black' : 'border-gray-200'}`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}

            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-2">Choose a Size</p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 rounded-full border ${selectedSize === size ? 'border-black bg-black text-white' : 'border-gray-200 text-gray-700'}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center bg-gray-100 rounded-full px-4 py-2">
                <button
                  className="px-2 text-lg"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  -
                </button>
                <span className="px-3">{quantity}</span>
                <button
                  className="px-2 text-lg"
                  onClick={() => setQuantity((q) => Math.min(Math.max(stockValue, 1), q + 1))}
                >
                  +
                </button>
              </div>
              <div className="text-sm text-orange-600">
                {stockValue <= 5 ? `Only ${stockValue} items left!` : 'In stock'}
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mb-6">
              <button
                onClick={handleBuyNow}
                className="px-8 py-3 rounded-full bg-black text-white font-semibold"
              >
                Buy Now
              </button>
              <button
                onClick={handleAddToCart}
                className="px-8 py-3 rounded-full border border-black text-black font-semibold"
              >
                Add to Cart
              </button>
            </div>
{/* 
            <div className="space-y-3">
              <div className="border rounded-xl p-4">
                <p className="text-sm font-semibold text-gray-900">Free Delivery</p>
                <p className="text-xs text-gray-500">Enter your postal code for delivery availability</p>
              </div>
              <div className="border rounded-xl p-4">
                <p className="text-sm font-semibold text-gray-900">Return Delivery</p>
                <p className="text-xs text-gray-500">Free 30 days delivery returns. Details</p>
              </div>
            </div> */}
          </div>
        </div>
      </div>

      <div className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="inline-flex items-center px-5 py-2 rounded-full bg-black text-white text-sm font-semibold mb-6">
            Description
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <p className="text-gray-700 mb-4">
              {product.description || 'Built with premium materials for everyday comfort and long-lasting performance.'}
            </p>
            <div className="text-sm font-semibold text-gray-900 mb-2">Introduction</div>
            <p className="text-gray-600 mb-4">
              {product.description || 'A refined staple designed to pair easily with your daily wardrobe.'}
            </p>
            <div className="text-sm font-semibold text-gray-900 mb-2">Features</div>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              {(product.tags && product.tags.length > 0
                ? product.tags.slice(0, 4)
                : ['Soft inner lining', 'Lightweight build', 'Everyday-ready design', 'Easy to maintain']
              ).map((feature: any) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-gray-500">Customer feedback</p>
              <h2 className="text-2xl font-semibold text-gray-900">Ratings & Reviews</h2>
            </div>
            <StarRating rating={product.rating} count={product.rating_count} emptyLabel="No reviews yet" />
          </div>

          {reviews.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-sm text-gray-500">
              No reviews yet. Customers who buy and receive this product can rate it from their dashboard.
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {reviews.map((review) => (
                <div key={review.id} className="rounded-2xl border border-gray-200 bg-white p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-gray-900">{review.user?.name || 'Verified Customer'}</p>
                      <p className="mt-1 text-xs text-gray-400">
                        {review.createdAt
                          ? new Date(review.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : ''}
                      </p>
                    </div>
                    <StarRating rating={review.rating} count={0} showCount={false} />
                  </div>
                  {review.title ? <p className="mt-4 font-medium text-gray-900">{review.title}</p> : null}
                  {review.comment ? <p className="mt-2 text-sm leading-6 text-gray-600">{review.comment}</p> : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Related Product</h2>
        {relatedProducts.length === 0 ? (
          <div className="text-gray-500">No related products yet.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((item) => {
              const itemPrice =
                typeof item.price_kobo === 'number' ? item.price_kobo / 100 : item.price || 0;
              const itemId = String(item.id || item._id || '');
              return (
                <button
                  key={itemId}
                  onClick={() => navigate(`/product/${itemId}`)}
                  className="text-left bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition"
                >
                  <div className="bg-gray-100 rounded-xl h-44 flex items-center justify-center mb-3 overflow-hidden">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="max-h-36 object-contain" />
                    ) : (
                      <div className="text-gray-400 text-sm">No image</div>
                    )}
                  </div>
                  <div className="font-semibold text-gray-900 mb-1">{item.name}</div>
                  <div className="text-sm text-gray-600">{formatNaira(itemPrice)}</div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

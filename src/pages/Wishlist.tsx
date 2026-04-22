import { useMemo } from 'react';
import { Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWishlist } from '../contexts/WishlistContext';
import { toast } from 'react-toastify';
import { useCart } from '../contexts/CartContext';
import { getProductCompareAtPrice, getProductDisplayPrice, Product } from './lib/api';
import emptyWishlist from '../assets/empty-wishlist.png'
import { useAuth } from '../contexts/AuthContext';
import { appendUserId, getUserId } from '../utils/navigation';
import f2 from '../assets/features/f2.png'

const formatNaira = (value: number) => `₦${value.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

const getProductPrice = (product: Product) => {
  return getProductDisplayPrice(product);
};

export default function Wishlist() {
  const { items, loading, remove } = useWishlist();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = getUserId(user);


  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] py-12">
        <div className="w-full max-w-md p-8">
          <div className="text-center py-8">

            <img
              src={f2}
              alt="Empty cart"
              className="mx-auto mb-6 w-full max-w-[440px] object-cover"
            />
            <h2 className="text-2xl font-bold mb-4">Sign in to view your wishlist</h2>
            <p className="text-gray-600 font-semibold">Please sign in to view your wishlist</p>
            <button
              onClick={() => navigate(appendUserId('/auth', userId))}
              className="mt-6 px-6 py-3 bg-[#12108b] text-white rounded-full hover:bg-[#12108b]/90 transition-colors"
            >
              Go to sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalValue = useMemo(() => {
    return items.reduce((sum, item) => sum + getProductPrice(item.product), 0);
  }, [items]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="h-6 w-32 bg-gray-200 rounded mb-6 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-3xl bg-white p-4 shadow-sm animate-pulse">
              <div className="h-48 bg-gray-200 rounded-2xl mb-4" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f2f0eb,_#ffffff_55%)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-gray-500">Saved picks</p>
            <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900">Wishlist</h1>
            <p className="text-sm text-gray-600 mt-2">Your curated list of items you love.</p>
          </div>
          <div className="rounded-3xl bg-white/90 shadow-sm px-6 py-4">
            <p className="text-xs uppercase text-gray-400">Total value</p>
            <p className="text-2xl font-semibold text-gray-900">{formatNaira(totalValue)}</p>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="rounded-3xl bg-white p-12 text-center shadow-sm">
            <img
              src={emptyWishlist}
              alt="Empty cart"
              className="mx-auto mb-6 w-full max-w-[440px] object-contain"
            />
            <h2 className="text-xl text-[#12108b] font-bold mb-2">Your wishlist is empty</h2>
            <p className="text-gray-500 font-semibold mb-6">Browse products and tap the heart icon to save them here.</p>
            <button
              className="rounded-full bg-[#12108b] px-6 py-2 text-sm font-semibold text-white hover:bg-gray-800"
              onClick={() => navigate('/products')}
            >
              Explore products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {items.map((item) => {
              const product = item.product;
              const price = getProductPrice(product);
              return (
                <div
                  key={item.id}
                  className="group rounded-3xl bg-white p-4 shadow-sm hover:shadow-md transition cursor-pointer"
                  onClick={() => navigate(`/product/${product.id || product._id}`)}
                >
                  <div className="relative aspect-[4/5] rounded-2xl bg-[#f3f3f3] overflow-hidden flex items-center justify-center">
                    <img src={product.image_url || ''} alt={product.name} className="h-full w-full object-contain" />
                    <button
                      className="absolute right-3 top-3 rounded-full bg-white p-2 shadow hover:bg-gray-100"
                      onClick={(event) => {
                        event.stopPropagation();
                        remove(product.id || product._id || '');
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                  <div className="mt-4 space-y-2">
                    <h3 className="text-base font-semibold text-gray-900 line-clamp-2">{product.name}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2">{product.description}</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-semibold text-gray-900">{formatNaira(price)}</span>
                        {getProductCompareAtPrice(product) && getProductCompareAtPrice(product)! > price && (
                          <p className="text-xs text-gray-400 line-through">{formatNaira(getProductCompareAtPrice(product) || 0)}</p>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">{product.category_id && typeof product.category_id !== 'string' ? product.category_id.name : ''}</span>
                    </div>
                    <button
                      className="mt-2 w-full rounded-full border border-gray-900 py-2 text-xs font-semibold text-gray-900 hover:bg-gray-900 hover:text-white transition"
                      onClick={(event) => {
                        event.stopPropagation();
                        if ((product.stock ?? 0) <= 0) {
                          toast.error('This product is out of stock');
                          return;
                        }
                        addToCart(product.id || product._id || '', 1);
                      }}
                    >
                      Add to cart
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

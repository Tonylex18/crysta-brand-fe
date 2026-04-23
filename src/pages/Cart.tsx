import { useNavigate } from 'react-router-dom';
import { Minus, Plus, X } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { formatNaira, resolveImageUrl } from './lib/api';
import { appendUserId, getUserId } from '../utils/navigation';
import emptyCartImage from '../assets/empty-cart2.png';
import f2 from '../assets/features/f2.png'

export default function CartPage() {
  const { cartItems, updateQuantity, removeFromCart, clearCart, cartSubtotalKobo } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
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
            <h2 className="text-2xl font-bold mb-4">Sign in to view your cart</h2>
            <p className="text-gray-600 font-semibold">Please sign in to add items and checkout</p>
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

  return (
    <div className=" bg-gray-50">
      <div className="max-w-6xl mx-auto py-10 px-4">
        {cartItems.length === 0 ? (
          <div className="text-center py-16">
            <img
              src={emptyCartImage}
              alt="Empty cart"
              className="mx-auto mb-6 w-full max-w-[440px] object-contain"
            />
            <h3 className="text-xl text-[#12108b] font-bold mb-2">Empty! Haven't any product on your <br /> shopping cart.</h3>
            <p className="text-gray-600 font-semibold mb-6">Looks like you haven't added anything to your cart yet. <br /> Start shopping and find something you love!</p>
            <button
              onClick={() => navigate(appendUserId('/', userId))}
              className="px-6 py-3 bg-[#12108b]  text-white rounded-full hover:bg-[#00CFFF]/90 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <h1 className="text-3xl font-bold">Shopping Cart</h1>
              {cartItems.map((item) => (
                <div key={item.id} className="bg-white rounded-lg border border-gray-200 p-4 flex gap-4">
                  <img
                    src={resolveImageUrl(item.image_url)}
                    alt={item.name}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                          {item.name}
                        </h3>
                        {(item.selected_color || item.selected_size) && (
                          <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-medium text-gray-600">
                            {item.selected_color ? (
                              <span className="rounded-full bg-gray-100 px-2.5 py-1">Color: {item.selected_color}</span>
                            ) : null}
                            {item.selected_size ? (
                              <span className="rounded-full bg-gray-100 px-2.5 py-1">Size: {item.selected_size}</span>
                            ) : null}
                          </div>
                        )}
                        <p className="text-xs text-gray-600 mt-1">Weight: {item.weight_grams}g</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1 hover:bg-red-50 rounded transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-6 h-6 bg-white border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center font-semibold text-sm">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 bg-white border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-blue-600 font-bold text-sm">
                          {formatNaira(item.price_kobo)}
                        </p>
                        <p className="text-xs text-gray-500">per item</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {/* Clear all items from cart */}
              <button
                onClick={() => clearCart()}
                className="p-1 rounded transition-colors"
              >
                <p className="text-gray-500 hover:text-[#12108b] hover:font-bold transition-all">Clear Cart</p>
              </button>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-8">
                <h3 className="font-semibold text-lg mb-4">Order Summary</h3>
                <div className="flex justify-between text-sm mb-3">
                  <span>Items subtotal</span>
                  <span>{formatNaira(cartSubtotalKobo)}</span>
                </div>
                <p className="text-xs text-gray-500">Shipping and taxes are calculated at checkout.</p>
                <button
                  onClick={() => navigate(appendUserId('/checkout', userId))}
                  className="mt-6 w-full bg-[#12108b] text-white py-3 rounded-full hover:bg-[#12108b]/90 transition-colors"
                >
                  Proceed to Checkout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

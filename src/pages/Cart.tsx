import { useNavigate } from 'react-router-dom';
import { Minus, Plus, X, ChevronDown, Tag } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { resolveImageUrl } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export default function CartPage() {
  const { cartItems, updateQuantity, removeFromCart, cartTotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
          <div className="text-center py-8">
            <h2 className="text-2xl font-bold mb-4">Sign in to view your cart</h2>
            <p className="text-gray-600">Please sign in to add items and checkout</p>
          </div>
        </div>
      </div>
    );
  }

  const subtotal = cartTotal;
  const delivery = subtotal > 100000 ? 0 : cartItems.length * 500;
  const total = subtotal + delivery;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4">
        {cartItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Your cart is empty</h3>
            <p className="text-gray-600 mb-6">Add some items to get started</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-[#00CFFF] text-white rounded-full hover:bg-[#00CFFF]/90 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Shopping Cart Items */}
            <div className="lg:col-span-2">
              <h1 className="text-3xl font-bold mb-4">Shopping Cart ({cartItems.length} item{cartItems.length !== 1 ? 's' : ''})</h1>
              <div className="space-y-6">
                {/* Group 1 */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">{cartItems.length} Item{cartItems.length !== 1 ? 's' : ''}</span>
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    </div>
                    <p className="text-sm text-gray-600">Arrives by Mon, Sep 11</p>
                  </div>

                  <div className="space-y-4">
                    {cartItems.map((item) => (
                      <div key={item._id} className="flex space-x-4 p-4 bg-gray-50 rounded-lg relative">
                        <button
                          onClick={() => {
                            console.log('Delete button clicked for item:', item._id);
                            removeFromCart(item._id);
                          }}
                          className="absolute top-2 right-2 p-1 hover:bg-red-50 rounded transition-colors"
                        >
                          <X className="w-4 h-4 text-gray-500" />
                        </button>

                        <img
                          src={resolveImageUrl(item.product_id.image_url)}
                          alt={item.product_id.name}
                          className="w-24 h-24 object-cover rounded-lg"
                        />

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                            {item.product_id.name}
                          </h3>
                          <p className="text-xs text-gray-600 mt-1">
                            Actual Color: {item.color}
                          </p>
                          <p className="text-xs text-gray-600">
                            Size: {item.size}
                          </p>
                          <p className="text-xs text-green-600 mt-1">
                            {subtotal > 100000
                              ? 'Eligible for FREE Shipping'
                              : `Delivery Fee: ₦${delivery.toFixed(2)}`}
                          </p>
                        </div>

                        <div className="flex flex-col justify-between items-end">
                          <div className="flex items-center space-x-2 mb-4 mt-4">
                            <button
                              onClick={() => {
                                console.log('Minus button clicked for item:', item._id, 'current quantity:', item.quantity);
                                updateQuantity(item._id, item.quantity - 1);
                              }}
                              className="w-6 h-6 bg-white border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50 transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center font-semibold text-sm">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => {
                                console.log('Plus button clicked for item:', item._id, 'current quantity:', item.quantity);
                                updateQuantity(item._id, item.quantity + 1);
                              }}
                              className="w-6 h-6 bg-white border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="text-right">
                            <p className="text-blue-600 font-bold text-sm">
                            ₦{((item.product_id.price || item.price || 0) * item.quantity).toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500 line-through">
                            ₦{((item.product_id.price || item.price || 0) * item.quantity * 1.1).toFixed(2)}
                            </p>
                            <p className="text-xs text-green-600">
                              You Save ₦{((item.product_id.price || item.price || 0) * item.quantity * 0.1).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <div className="bg-gray-100 rounded-lg p-6">
                  <h3 className="font-semibold text-lg mb-4">Order Summary</h3>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span>Sub Total ({cartItems.length} item{cartItems.length !== 1 ? 's' : ''})</span>
                      <span>₦{subtotal.toFixed(2)}</span>
                    </div>

                    {/* TODO: Implement discount/savings logic */}
                    {/* <div className="flex justify-between text-green-600">
                      <span>You Savings</span>
                      <span>${savings.toFixed(2)}</span>
                    </div> */}

                    <div className="flex justify-between">
                      <div className="flex items-center space-x-2">
                        <span>Delivery</span>
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Standard</span>
                      </div>
                      <span>₦{delivery.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span>Apply Coupon</span>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          placeholder="Enter code"
                          className="border border-gray-300 rounded px-2 py-1 text-xs w-24"
                        />
                        <Tag className="w-4 h-4 text-gray-500" />
                      </div>
                    </div>

                    <div className="border-t border-gray-300 pt-3">
                      <div className="flex justify-between">
                        <span>Estimated total</span>
                        <span>₦{(subtotal + delivery).toFixed(2)}</span>
                      </div>
                    </div>

                    {/* TODO: Implement free shipping logic */}
                    {/* <div className="flex justify-between text-green-600">
                      <span>Shipping</span>
                      <span>Free</span>
                    </div> */}

                    <div className="flex justify-between">
                      <span>Taxes</span>
                      <span>₦0.00</span>
                    </div>

                    <div className="border-t border-gray-300 pt-3">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span>₦{total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('/checkout')}
                    className="w-full mt-6 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Continue to checkout
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

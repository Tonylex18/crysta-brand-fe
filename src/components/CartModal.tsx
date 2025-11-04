import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import CheckoutModal from './CheckoutModal';

type CartModalProps = {
  onClose: () => void;
};

export default function CartModal({ onClose }: CartModalProps) {
  const { cartItems, updateQuantity, removeFromCart, cartTotal } = useCart();
  const { user } = useAuth();
  const [showCheckout, setShowCheckout] = useState(false);

  if (!user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 relative"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center py-8">
            <h2 className="text-2xl font-bold mb-4">Sign in to view your cart</h2>
            <p className="text-gray-600">Please sign in to add items and checkout</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          className="bg-white rounded-t-3xl sm:rounded-2xl shadow-xl w-full sm:max-w-md h-[90vh] sm:h-auto sm:max-h-[90vh] flex flex-col relative"
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Your Cart</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {cartItems.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Your cart is empty</h3>
                <p className="text-gray-600 mb-6">Add some items to get started</p>
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-[#00CFFF] text-white rounded-full hover:bg-[#00CFFF]/90 transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex space-x-4 p-4 bg-gray-50 rounded-xl"
                  >
                    <img
                      src={item.product?.image_url || ''}
                      alt={item.product?.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {item.product?.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {item.size} / {item.color}
                      </p>
                      <p className="text-lg font-bold text-gray-900 mt-1">
                        ${((item.product?.price || 0) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex flex-col justify-between items-end">
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-6 h-6 bg-white rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 bg-white rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 border-t border-gray-200 space-y-4">
                <div className="flex items-center justify-between text-xl font-bold">
                  <span>Total:</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                <button
                  onClick={() => setShowCheckout(true)}
                  className="w-full px-6 py-4 bg-[#00CFFF] text-white font-semibold rounded-full hover:bg-[#00CFFF]/90 transition-colors"
                >
                  Proceed to Checkout
                </button>
              </div>
            </>
          )}
        </motion.div>
      </div>

      {showCheckout && (
        <CheckoutModal
          onClose={() => {
            setShowCheckout(false);
            onClose();
          }}
        />
      )}
    </>
  );
}

import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { formatNaira } from '../pages/lib/api';
import { appendUserId, getUserId } from '../utils/navigation';
import { useAuth } from '../contexts/AuthContext';

type CheckoutModalProps = {
  onClose: () => void;
};

export default function CheckoutModal({ onClose }: CheckoutModalProps) {
  const { cartSubtotalKobo } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const userId = getUserId(user);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
        <h2 className="text-2xl font-bold mb-2">Ready to checkout?</h2>
        <p className="text-gray-600">Subtotal: {formatNaira(cartSubtotalKobo)}</p>
        <div className="mt-6 flex gap-3 justify-center">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 rounded-full"
          >
            Continue shopping
          </button>
          <button
            onClick={() => navigate(appendUserId('/checkout', userId))}
            className="px-6 py-3 bg-[#00CFFF] text-white rounded-full"
          >
            Go to checkout
          </button>
        </div>
      </div>
    </div>
  );
}

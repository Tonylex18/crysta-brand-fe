import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { appendUserId, getUserId } from '../utils/navigation';

export default function DeliveryFee() {
  const { user } = useAuth();
  const userId = getUserId(user);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Delivery Fee Calculator</h1>
          <button
            onClick={() => navigate(appendUserId('/', userId))}
            className="text-sm text-green-700 hover:underline"
          >
            Back to shop
          </button>
        </div>

        <div className="bg-white shadow-sm rounded-2xl p-6 border border-gray-100">
          <div className="space-y-3">
            <p className="text-gray-700">
              Shipping calculation is temporarily unavailable while we migrate to a new
              configuration-driven pricing model.
            </p>
            <p className="text-sm text-gray-500">
              You can continue shopping and check out as usual. Delivery fees will be
              calculated later.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

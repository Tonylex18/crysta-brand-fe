import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ordersAPI, paymentsAPI, formatNaira, Order } from './lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { appendUserId, getUserId } from '../utils/navigation';

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const reference = searchParams.get('reference');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { clearCart } = useCart();
  const navigate = useNavigate();
  const userId = getUserId(user);

  useEffect(() => {
    if (!reference) {
      setError('Missing payment reference.');
      setLoading(false);
      return;
    }

    let attempts = 0;
    const maxAttempts = 8;

    const verifyOnce = async () => {
      try {
        const verify = await paymentsAPI.verify(reference);
        if (verify?.order) {
          setOrder(verify.order);
          await clearCart();
          setLoading(false);
          return true;
        }
      } catch {
        // ignore verification errors and fall back to polling
      }
      return false;
    };

    const fetchOrder = async () => {
      try {
        const response = await ordersAPI.getByReference(reference);
        setOrder(response);
        await clearCart();
        setLoading(false);
      } catch (err: any) {
        attempts += 1;
        if (attempts >= maxAttempts) {
          const rawMessage = err?.response?.data?.message;
          const message =
            rawMessage === 'Order not found'
              ? 'We are still confirming your order.'
              : rawMessage || 'We are still confirming your order.';
          setError(message);
          setLoading(false);
          return;
        }
        setTimeout(fetchOrder, 2000);
      }
    };

    const run = async () => {
      const verified = await verifyOnce();
      if (!verified) {
        fetchOrder();
      }
    };

    run();
  }, [reference, clearCart]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Confirming your order...</h2>
          <p className="text-gray-600 mt-2">This can take a few seconds.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-md p-8 text-center max-w-md">
          <h2 className="text-xl font-semibold mb-3">Order confirmation pending</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate(appendUserId('/dashboard', userId))}
            className="px-6 py-3 bg-[#00CFFF] text-white rounded-full"
          >
            Go to dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-xl">
        <h2 className="text-2xl font-semibold mb-2">Payment Successful</h2>
        <p className="text-gray-600 mb-6">Your order has been confirmed.</p>

        <div className="border rounded-lg p-4 mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Order reference</span>
            <span className="font-medium">{order?.payment.reference}</span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span>Status</span>
            <span className="font-medium capitalize">{order?.status.replace('_', ' ')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Total</span>
            <span className="font-semibold">{formatNaira(order?.totals.grand_total_kobo || 0)}</span>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          <p>Delivery address:</p>
          <p className="mt-1">{order?.address.street}, {order?.address.city}, {order?.address.state}</p>
          <p className="mt-1">Phone: {order?.address.phone}</p>
        </div>

        <button
          onClick={() => navigate(appendUserId('/dashboard', userId))}
          className="mt-6 w-full bg-black text-white py-3 rounded-full"
        >
          View orders
        </button>
      </div>
    </div>
  );
}

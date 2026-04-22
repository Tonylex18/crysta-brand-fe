import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { paymentAPI } from './lib/api';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { appendUserId, getUserId } from '../utils/navigation';

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'success' | 'failed' | 'verifying'>('verifying');
  const [paymentDetails, setPaymentDetails] = useState<{
    status?: string;
    amount?: number;
    reference?: string;
  } | null>(null);
  const userIdFromParams = searchParams.get('userId');
  const userId = userIdFromParams || getUserId(user);
  const orderId = searchParams.get('orderId');

  useEffect(() => {
    const verifyPayment = async () => {
      const reference = searchParams.get('reference');
      
      if (!reference) {
        setStatus('failed');
        setLoading(false);
        toast.error('Payment reference not found');
        return;
      }

      try {
        const response = await paymentAPI.verify(reference);
        const status = response?.status || response?.data?.status;

        if (status === 'success') {
          setStatus('success');
          setPaymentDetails(response?.data || response);
          toast.success('Payment verified successfully!');

          try {
            await clearCart();
          } catch (err) {
            console.error('Failed to clear cart after payment:', err);
          }

          // Redirect to dashboard after 3 seconds
          setTimeout(() => {
            navigate(appendUserId('/dashboard', userId));
          }, 3000);
        } else {
          setStatus('failed');
          toast.error('Payment verification failed');
        }
      } catch (error: unknown) {
        console.error('Payment verification error:', error);
        setStatus('failed');
        const message =
          typeof error === 'object' && error && 'response' in error
            ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
            : error instanceof Error
              ? error.message
              : 'Failed to verify payment';
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams, navigate, clearCart, userId]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
        {loading ? (
          <>
            <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin text-green-600" />
            <h2 className="text-2xl font-bold mb-2">Verifying Payment</h2>
            <p className="text-gray-600">Please wait while we verify your payment...</p>
          </>
        ) : status === 'success' ? (
          <>
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600" />
            <h2 className="text-2xl font-bold mb-2 text-green-600">Payment Successful!</h2>
            <p className="text-gray-600 mb-4">
              Thank you for your purchase. Your payment has been confirmed.
            </p>
            {paymentDetails && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4 text-left">
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Amount:</span> ₦{paymentDetails.amount?.toFixed(2)}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Reference:</span> {paymentDetails.reference}
                </p>
                {orderId && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Order:</span> {orderId}
                  </p>
                )}
                {userId && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">User:</span> {userId}
                  </p>
                )}
              </div>
            )}
            <p className="text-sm text-gray-500">
              Redirecting to your dashboard...
            </p>
          </>
        ) : (
          <>
            <XCircle className="w-16 h-16 mx-auto mb-4 text-red-600" />
            <h2 className="text-2xl font-bold mb-2 text-red-600">Payment Failed</h2>
            <p className="text-gray-600 mb-6">
              We couldn't process your payment. Please try again or contact support.
            </p>
            <button
              onClick={() => navigate(appendUserId('/checkout', userId))}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors w-full"
            >
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  );
}

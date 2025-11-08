import { useState, useEffect } from 'react';
import { CreditCard } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { ordersAPI, deliveryAPI, paymentAPI, resolveImageUrl } from './lib/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { PaystackButton } from 'react-paystack';

export default function CheckoutPage() {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingDelivery, setLoadingDelivery] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [isReturningCustomer, setIsReturningCustomer] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    zipCode: '',
    mobile: '',
    email: '',
  });

  const public_key = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

  // Fetch delivery information if user is returning customer
  useEffect(() => {
    const fetchDeliveryInfo = async () => {
      if (isReturningCustomer && user) {
        setLoadingDelivery(true);
        try {
          const response = await deliveryAPI.getDeliveryInfo();
          if (response.success && response.data) {
            const data = response.data;
            setFormData(prev => ({
              ...prev,
              firstName: data.firstName,
              lastName: data.lastName,
              address: data.address,
              city: data.cityTown,
              zipCode: data.zipCode,
              mobile: data.mobile,
              email: data.email,
            }));
          }
        } catch (error) {
          console.error('Failed to fetch delivery info:', error);
          toast.error('Failed to load saved delivery information');
        } finally {
          setLoadingDelivery(false);
        }
      }
    };
    fetchDeliveryInfo();
  }, [isReturningCustomer, user]);

  // Set user email if available
  useEffect(() => {
    if (user?.email && !formData.email) {
      setFormData(prev => ({ ...prev, email: user.email }));
    }
  }, [user?.email]);

  // Validate form before payment
  const validateForm = () => {
    if (!formData.firstName || !formData.lastName) {
      toast.error('Please enter your full name');
      return false;
    }
    if (!formData.address || !formData.city || !formData.zipCode) {
      toast.error('Please complete your delivery address');
      return false;
    }
    if (!formData.mobile) {
      toast.error('Please enter your mobile number');
      return false;
    }
    if (!formData.email) {
      toast.error('Please enter your email address');
      return false;
    }
    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return false;
    }
    return true;
  };

  // Create order before payment
  const createPendingOrder = async () => {
    const deliveryFee = cartTotal > 100000 ? 0 : cartItems.length * 500;
    const totalAmount = cartTotal + deliveryFee;

    const orderData = {
      shippingAddress: {
        name: `${formData.firstName} ${formData.lastName}`,
        address: formData.address,
        city: formData.city,
        state: formData.city,
        zip: formData.zipCode,
        country: 'Nigeria'
      },
      phoneNumber: formData.mobile,
      paymentMethod: 'Credit/Debit Card',
      deliveryFee,
      totalAmount,
      paymentStatus: 'pending'
    };

    console.log('Creating order with data:', orderData);
    const orderResponse = await ordersAPI.create(orderData);
    console.log('Order response:', orderResponse);
    const createdOrderId = orderResponse.data?._id || orderResponse.data?.id;
    return createdOrderId;
  };

  // Paystack success callback
  const handlePaystackSuccess = async (reference: any) => {
    setLoading(true);
    try {
      // Verify payment on backend
      const verifyResponse = await paymentAPI.verifyPayment(reference.reference);
      if (verifyResponse.success && verifyResponse.data?.status === 'success') {
        await clearCart();
        toast.success('Payment successful! Order placed.');
        navigate('/dashboard');
      } else {
        toast.error('Payment verification failed');
      }
    } catch (error: any) {
      console.error('Payment verification error:', error);
      toast.error(error.response?.data?.message || 'Failed to verify payment');
    } finally {
      setLoading(false);
      setPendingOrderId(null);
    }
  };

  // Paystack close callback
  const handlePaystackClose = () => {
    toast.info('Payment cancelled');
    setLoading(false);
    setPendingOrderId(null);
  };

  const deliveryFee = cartTotal > 100000 ? 0 : cartItems.length * 500;
  const totalAmount = cartTotal + deliveryFee;

  // Generate unique reference that will be used for both Paystack and our backend
  const [paymentReference] = useState(() => 
    `ORDER_${Date.now()}_${Math.random().toString(36).substring(7)}`
  );

  // Paystack configuration
  const paystackConfig = {
    reference: paymentReference,
    email: formData.email || 'customer@example.com',
    amount: Math.round(totalAmount * 100), // Amount in kobo
    publicKey: public_key || '',
    metadata: {
      custom_fields: [
        {
          display_name: 'Customer Name',
          variable_name: 'customer_name',
          value: `${formData.firstName} ${formData.lastName}` || 'Customer'
        },
        {
          display_name: 'Order ID',
          variable_name: 'order_id',
          value: pendingOrderId || ''
        }
      ]
    }
  };

  // Handle payment initialization - called when Paystack button is clicked
  const handlePaystackClick = async () => {
    if (!validateForm()) {
      return;
    }

    if (!public_key) {
      toast.error('Payment gateway not configured. Please contact support.');
      return;
    }

    setLoading(true);
    try {
      // Step 1: Create the order
      const orderId = await createPendingOrder();
      setPendingOrderId(orderId);

      // Step 2: Initialize payment record in backend
      const deliveryFee = cartTotal > 100000 ? 0 : cartItems.length * 500;
      const totalAmount = cartTotal + deliveryFee;
      
      await paymentAPI.initializePayment({
        amount: totalAmount,
        email: formData.email,
        orderId: orderId,
        reference: paymentReference,
        metadata: {
          customerName: `${formData.firstName} ${formData.lastName}`,
          phoneNumber: formData.mobile
        }
      });

      console.log('Order and payment initialized successfully with reference:', paymentReference);
      // Paystack popup will open after this completes
    } catch (error: any) {
      console.error('Order/Payment initialization error:', error);
      toast.error(error.response?.data?.message || 'Failed to initialize payment. Please try again.');
      setLoading(false);
    }
  };

  const componentProps = {
    ...paystackConfig,
    text: loading ? 'Processing...' : 'Proceed to Payment',
    onSuccess: handlePaystackSuccess,
    onClose: handlePaystackClose,
  };

  return (
    <div className="min-h-screen bg-yellow-50">
      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <p className="text-sm text-gray-600">Home / Checkout</p>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Review Item And Shipping */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Review Item And Shipping</h3>
              {cartItems.map((item) => (
                <div key={item._id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg mb-4">
                  <img
                    src={resolveImageUrl(item.product_id?.image_url)}
                    alt={item.product_id?.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold">{item.product_id?.name}</h4>
                    <p className="text-sm text-gray-600">Color: {item.color}</p>
                    <p className="text-lg font-bold text-green-600">
                      ₦{((item.product_id?.price || item.price || 0) * item.quantity).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">Quantity: {item.quantity.toString().padStart(2, '0')}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Returning Customer */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded cursor-pointer"
                  checked={isReturningCustomer}
                  onChange={(e) => setIsReturningCustomer(e.target.checked)}
                  disabled={loadingDelivery}
                />
                <span className="font-medium">
                  Returning Customer?
                  {loadingDelivery && <span className="text-gray-500"> (Loading...)</span>}
                </span>
              </label>
            </div>

            {/* Delivery Information */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Delivery Information</h3>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await deliveryAPI.addDeliveryInfo({
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        address: formData.address,
                        cityTown: formData.city,
                        zipCode: formData.zipCode,
                        mobile: formData.mobile,
                        email: formData.email,
                      });
                      toast.success('Delivery information saved successfully!');
                    } catch (error: any) {
                      toast.error(error.response?.data?.message || 'Failed to save delivery information');
                    }
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                  disabled={loading}
                >
                  Save Information
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Type here..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Type here..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Type here..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City/Town<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Type here..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zip Code<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Type here..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Type here..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Type here..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
              <div className="flex space-x-2 mb-4">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Enter Coupon Code"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700">
                  Apply coupon
                </button>
              </div>
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₦{cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>
                    {deliveryFee === 0
                      ? 'Free'
                      : `₦${deliveryFee.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold mt-4 pt-4 border-t">
                  <span>Total</span>
                  <span>₦{totalAmount.toFixed(2)}</span>
                </div>
              </div>
              
              {public_key ? (
                <div onClick={handlePaystackClick}>
                  <PaystackButton
                    {...componentProps}
                    className="w-full mt-6 px-6 py-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                    disabled={loading || !formData.email}
                  />
                </div>
              ) : (
                <button
                  type="button"
                  disabled
                  className="w-full mt-6 px-6 py-4 bg-gray-400 text-white font-semibold rounded-lg cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <CreditCard className="w-5 h-5" />
                  <span>Payment Gateway Not Configured</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
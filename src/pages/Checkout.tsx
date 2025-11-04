import { useState, useEffect } from 'react';
import { CreditCard, Search, User, ShoppingCart, ChevronDown, MapPin } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { ordersAPI, deliveryAPI, paymentAPI, resolveImageUrl } from '../lib/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

export default function CheckoutPage() {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingDelivery, setLoadingDelivery] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');
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
    cardHolderName: '',
    cardNumber: '',
    expiry: '',
    cvc: '',
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Place Order button clicked');
    
    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setLoading(true);
    console.log('Starting order process...');

    try {
      const shippingAddress = {
        name: `${formData.firstName} ${formData.lastName}`,
        address: formData.address,
        city: formData.city,
        state: formData.city,
        zip: formData.zipCode,
        country: 'Nigeria'
      };

      // Delivery fee calculation
      const deliveryFee = cartTotal > 100000 ? 0 : cartItems.length * 500;
      const totalAmount = cartTotal + deliveryFee;

      // If payment method is COD or Transfer, create order directly
      if (paymentMethod === 'cod' || paymentMethod === 'transfer') {
        const orderData = {
          shippingAddress,
          phoneNumber: formData.mobile,
          paymentMethod: paymentMethod === 'cod' ? 'Cash on Delivery' : 'Bank Transfer',
          deliveryFee,
          totalAmount
        };

        await ordersAPI.create(orderData);
        await clearCart();
        toast.success('Order placed successfully!');
        navigate('/dashboard');
        return;
      }

      // For credit card payment, initialize Paystack payment
      if (paymentMethod === 'credit') {
        if (!formData.cardHolderName || !formData.cardNumber) {
          toast.error('Please fill in card details');
          setLoading(false);
          return;
        }

        // First create the order
        const orderData = {
          shippingAddress,
          phoneNumber: formData.mobile,
          paymentMethod: 'Credit/Debit Card'
        };

        const orderResponse = await ordersAPI.create(orderData);
        const orderId = orderResponse.data?._id || orderResponse.data?.id;

        // Initialize payment with Paystack
        const amountInNaira = totalAmount; // Use totalAmount including delivery
        
        const paymentResponse = await paymentAPI.initializePayment({
          amount: amountInNaira,
          email: formData.email,
          orderId: orderId,
          metadata: {
            orderId,
            items: cartItems.map(item => ({
              name: item.product_id?.name,
              quantity: item.quantity
            }))
          }
        });

        if (paymentResponse.success && paymentResponse.data.authorizationUrl) {
          // Redirect to Paystack payment page
          window.location.href = paymentResponse.data.authorizationUrl;
        } else {
          toast.error('Failed to initialize payment');
        }
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const deliveryFee = cartTotal > 100000 ? 0 : cartItems.length * 500;
  const totalAmount = cartTotal + deliveryFee;

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
                <div key={item._id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
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

              <form onSubmit={handleSubmit} className="space-y-4">
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
              </form>
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
                <button className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium">
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
            </div>

            {/* Payment Details */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Payment Details</h3>

              <div className="space-y-3 mb-6">
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="text-green-600"
                  />
                  <span>Cash on Delivery</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="payment"
                    value="transfer"
                    checked={paymentMethod === 'transfer'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="text-green-600"
                  />
                  <span>Transfer</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="payment"
                    value="credit"
                    checked={paymentMethod === 'credit'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="text-green-600"
                  />
                  <span>Credit or Debit card</span>
                </label>
              </div>

              {paymentMethod === 'credit' && (
                <div className="space-y-4">
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Card Holder Name<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.cardHolderName}
                      onChange={(e) => setFormData({ ...formData, cardHolderName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Type here..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Card Number<span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={formData.cardNumber}
                        onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                        className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="0000*****1245"
                      />
                      <CreditCard className="w-4 h-4 absolute right-3 top-4 text-gray-400" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expiry
                      </label>
                      <input
                        type="text"
                        value={formData.expiry}
                        onChange={(e) => setFormData({ ...formData, expiry: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="MM/YY"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CVC
                      </label>
                      <input
                        type="text"
                        value={formData.cvc}
                        onChange={(e) => setFormData({ ...formData, cvc: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="123"
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={(e) => handleSubmit(e as any)}
                disabled={loading}
                className="w-full mt-6 px-6 py-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <CreditCard className="w-5 h-5" />
                <span>{loading ? 'Processing...' : 'Place Order'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

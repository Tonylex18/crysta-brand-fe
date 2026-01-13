import { useState, useEffect, useRef } from 'react';
import { CreditCard } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import {
  ordersAPI,
  deliveryAPI,
  paymentAPI,
  resolveImageUrl,
  deliveryPricingAPI,
  DeliveryQuoteResponse,
  DeliveryStateMeta,
} from './lib/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { PaystackButton } from 'react-paystack';
import { appendUserId, getUserId } from '../utils/navigation';

type GoogleMapsLatLng = { lat: () => number; lng: () => number };
type GoogleMapsPlace = { formatted_address?: string; geometry?: { location?: GoogleMapsLatLng } };
type GoogleMapsAutocomplete = { addListener: (event: string, handler: () => void) => void; getPlace: () => GoogleMapsPlace };
type GoogleMapsGeocoder = {
  geocode: (
    request: { address: string; componentRestrictions?: { country: string | string[] } },
    callback: (results: Array<{ geometry?: { location?: GoogleMapsLatLng } }> | null, status: string) => void
  ) => void;
};
type GoogleMapsMap = { setCenter: (coords: { lat: number; lng: number }) => void };
type GoogleMapsMarker = { setPosition: (coords: { lat: number; lng: number }) => void };
type GoogleMaps = {
  maps: {
    places: {
      Autocomplete: new (
        input: HTMLInputElement,
        opts: { componentRestrictions?: { country: string[] }; fields?: string[] }
      ) => GoogleMapsAutocomplete;
    };
    Geocoder: new () => GoogleMapsGeocoder;
    Map: new (element: HTMLElement, opts: { center: { lat: number; lng: number }; zoom: number }) => GoogleMapsMap;
    Marker: new (opts: { map: GoogleMapsMap }) => GoogleMapsMarker;
  };
};
type PaystackSuccessResponse = { reference?: string };

export default function CheckoutPage() {
  const { cartItems, cartTotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const userId = getUserId(user);
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
  const [deliveryStates, setDeliveryStates] = useState<DeliveryStateMeta[]>([]);
  const [statesLoading, setStatesLoading] = useState(false);
  const [statesError, setStatesError] = useState<string | null>(null);
  const [selectedStateCode, setSelectedStateCode] = useState('');
  const [packageWeightKg, setPackageWeightKg] = useState<number | ''>('');
  const [deliveryError, setDeliveryError] = useState<string | null>(null);

  const public_key = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const addressInputRef = useRef<HTMLInputElement | null>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<GoogleMapsMap | null>(null);
  const mapMarkerRef = useRef<GoogleMapsMarker | null>(null);
  const geocoderRef = useRef<GoogleMapsGeocoder | null>(null);
  const autocompleteRef = useRef<GoogleMapsAutocomplete | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapPosition, setMapPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [deliveryQuote, setDeliveryQuote] = useState<DeliveryQuoteResponse | null>(null);
  const [paymentReference] = useState(() =>
    `ORDER_${Date.now()}_${Math.random().toString(36).substring(7)}`
  );
  const selectedState = deliveryStates.find((state) => state.stateCode === selectedStateCode);
  const requiresCoordinates = selectedState?.requiresCoordinates ?? selectedState?.pricingType === 'distance';
  const requiresWeight = selectedState?.requiresWeight ?? selectedState?.pricingType === 'weight_tier';
  const minWeightKg = selectedState?.minWeightKg;
  const maxWeightKg = selectedState?.maxWeightKg;
  const parsedWeight = typeof packageWeightKg === 'number' ? packageWeightKg : undefined;
  const weightWithinLimits =
    typeof parsedWeight === 'number' &&
    (minWeightKg === undefined || parsedWeight >= minWeightKg) &&
    (maxWeightKg === undefined || parsedWeight <= maxWeightKg);
  const readyForQuote =
    Boolean(selectedStateCode) &&
    (!requiresCoordinates || Boolean(mapPosition)) &&
    (!requiresWeight || weightWithinLimits);

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

  useEffect(() => {
    const fetchDeliveryStates = async () => {
      setStatesLoading(true);
      setStatesError(null);
      try {
        const states = await deliveryPricingAPI.getStates();
        setDeliveryStates(states);
      } catch {
        setStatesError('Failed to load delivery states.');
      } finally {
        setStatesLoading(false);
      }
    };
    fetchDeliveryStates();
  }, []);

  // Set user email if available
  useEffect(() => {
    if (user?.email && !formData.email) {
      setFormData(prev => ({ ...prev, email: user.email }));
    }
  }, [user?.email, formData.email]);

  // Load Google Maps script for autocomplete/map
  useEffect(() => {
    if (!mapsApiKey) return;
    const existing = document.querySelector<HTMLScriptElement>('script[data-google-maps]');
    if (existing) {
      setMapReady(true);
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${mapsApiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.setAttribute('loading', 'async');
    script.dataset.googleMaps = 'loaded';
    script.onload = () => setMapReady(true);
    script.onerror = () => toast.error('Failed to load Google Maps. Autocomplete and map will be disabled.');
    document.head.appendChild(script);
  }, [mapsApiKey]);

  // Setup autocomplete once maps is ready
  useEffect(() => {
    if (!mapReady || !addressInputRef.current) return;
    const g = (window as Window & { google?: GoogleMaps }).google;
    if (!g?.maps?.places) return;
    if (autocompleteRef.current) return;
    const autocomplete = new g.maps.places.Autocomplete(addressInputRef.current, {
      componentRestrictions: { country: ['ng'] },
      fields: ['formatted_address', 'geometry'],
    });
    autocompleteRef.current = autocomplete;
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      const formattedAddress = place?.formatted_address;
      if (formattedAddress) {
        setFormData(prev => ({ ...prev, address: formattedAddress }));
      }
      if (place?.geometry?.location) {
        setMapPosition({
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        });
      }
    });
  }, [mapReady]);

  useEffect(() => {
    setDeliveryQuote(null);
    setDeliveryError(null);
    setMapPosition(null);
    setPackageWeightKg('');
  }, [selectedStateCode]);

  const fullAddress = [
    formData.address,
    formData.city,
    selectedState?.stateName,
    formData.zipCode,
  ]
    .filter(Boolean)
    .join(', ')
    .trim();

  // Geocode address to coordinates only for distance-based delivery
  useEffect(() => {
    if (!requiresCoordinates) {
      return;
    }
    if (!formData.address?.trim()) {
      setMapPosition(null);
      return;
    }

    setMapPosition(null);

    const timer = setTimeout(() => {
      if (!mapReady) return;
      try {
        const g = (window as Window & { google?: GoogleMaps }).google;
        if (g?.maps) {
          const geocoder = geocoderRef.current || new g.maps.Geocoder();
          geocoderRef.current = geocoder;
          geocoder.geocode(
            { address: fullAddress, componentRestrictions: { country: 'NG' } },
            (results, status) => {
              if (status === 'OK' && results?.[0]?.geometry?.location) {
                const loc = results[0].geometry.location;
                setMapPosition({ lat: loc.lat(), lng: loc.lng() });
              }
            }
          );
        }
      } catch {
        // non-fatal
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [fullAddress, mapReady, requiresCoordinates, formData.address]);

  useEffect(() => {
    if (!readyForQuote) {
      setQuoteLoading(false);
      setDeliveryQuote(null);
      setDeliveryError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setQuoteLoading(true);
      setDeliveryError(null);
      setDeliveryQuote(null);
      try {
        const payload = {
          customerState: selectedStateCode,
          customerCity: formData.city?.trim() || undefined,
          ...(requiresCoordinates && mapPosition ? { coordinates: mapPosition } : {}),
          ...(typeof parsedWeight === 'number' ? { packageWeightKg: parsedWeight } : {}),
        };
        const quote = await deliveryPricingAPI.getQuote(payload);
        if (!quote.success) {
          throw new Error(quote.message || 'Could not calculate delivery fee');
        }
        setDeliveryQuote(quote);
      } catch (error: unknown) {
        setDeliveryQuote(null);
        const status =
          typeof error === 'object' && error && 'response' in error
            ? (error as { response?: { status?: number } }).response?.status
            : undefined;
        const baseMessage =
          typeof error === 'object' && error && 'response' in error
            ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
            : error instanceof Error
              ? error.message
              : 'Failed to calculate delivery fee';
        const message =
          status === 429
            ? 'Too many delivery quote requests. Please wait a moment and try again.'
            : status && status >= 500
              ? 'Delivery quote is temporarily unavailable. Please try again later.'
              : baseMessage;
        setDeliveryError(message ?? 'An unknown error occurred');
        toast.error(message);
      } finally {
        setQuoteLoading(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [
    readyForQuote,
    selectedStateCode,
    formData.city,
    mapPosition,
    requiresCoordinates,
    parsedWeight,
  ]);

  // Update map when position changes
  useEffect(() => {
    if (!mapReady || !mapRef.current || !mapPosition) return;
    const g = (window as Window & { google?: GoogleMaps }).google;
    if (!g?.maps) return;

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new g.maps.Map(mapRef.current, {
        center: mapPosition,
        zoom: 13,
      });
    }

    mapInstanceRef.current.setCenter(mapPosition);

    if (!mapMarkerRef.current) {
      mapMarkerRef.current = new g.maps.Marker({
        map: mapInstanceRef.current,
      });
    }
    mapMarkerRef.current.setPosition(mapPosition);
  }, [mapReady, mapPosition]);

  const deliveryFee = deliveryQuote?.fee;
  const hasQuote = typeof deliveryFee === 'number';

  // Validate form before payment
  const validateForm = () => {
    if (!formData.firstName || !formData.lastName) {
      toast.error('Please enter your full name');
      return false;
    }
    if (!selectedStateCode) {
      toast.error('Please select a delivery state');
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
    if (requiresWeight) {
      if (typeof parsedWeight !== 'number') {
        toast.error('Please enter the package weight');
        return false;
      }
      if (!weightWithinLimits) {
        const limitText = [
          minWeightKg !== undefined ? `min ${minWeightKg}kg` : null,
          maxWeightKg !== undefined ? `max ${maxWeightKg}kg` : null,
        ]
          .filter(Boolean)
          .join(', ');
        toast.error(
          limitText
            ? `Package weight must be within ${limitText}`
            : 'Package weight is outside the allowed range'
        );
        return false;
      }
    }
    if (requiresCoordinates && !mapPosition) {
      toast.error('Please provide a valid delivery address for distance-based delivery');
      return false;
    }
    if (!deliveryQuote) {
      toast.error('Delivery fee has not been calculated yet');
      return false;
    }
    return true;
  };

  // Create order before payment
  const createPendingOrder = async () => {
    if (deliveryFee == null) {
      throw new Error('Delivery fee is not available');
    }
    const totalAmount = cartTotal + deliveryFee;

    const orderData = {
      shippingAddress: {
        name: `${formData.firstName} ${formData.lastName}`,
        address: formData.address,
        city: formData.city,
        state: selectedState?.stateName || selectedStateCode || formData.city,
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
  const handlePaystackSuccess = async (reference: PaystackSuccessResponse) => {
    const referenceCode = reference.reference || paymentReference;
    const params = new URLSearchParams({ reference: referenceCode });
    if (pendingOrderId) params.set('orderId', pendingOrderId);

    setLoading(false);
    setPendingOrderId(null);
    navigate(appendUserId(`/payment/callback?${params.toString()}`, userId));
  };

  // Paystack close callback
  const handlePaystackClose = () => {
    toast.info('Payment cancelled');
    setLoading(false);
    setPendingOrderId(null);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-yellow-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center space-y-4">
          <h2 className="text-2xl font-bold">Sign in required</h2>
          <p className="text-gray-600">Please sign in to complete your checkout.</p>
          <button
            onClick={() => navigate(appendUserId('/auth', userId))}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Go to sign in
          </button>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-yellow-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center space-y-4">
          <h2 className="text-2xl font-bold">Your cart is empty</h2>
          <p className="text-gray-600">Add items to your cart before checking out.</p>
          <button
            onClick={() => navigate(appendUserId('/', userId))}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Continue shopping
          </button>
        </div>
      </div>
    );
  }

  const totalAmount = hasQuote ? cartTotal + (deliveryFee as number) : cartTotal;
  const customerName = [formData.firstName, formData.lastName].filter(Boolean).join(' ').trim() || 'Customer';

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
          value: customerName
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

    if (deliveryFee == null) {
      toast.error('Please calculate the delivery fee before payment.');
      return;
    }

    setLoading(true);
    try {
      // Step 1: Create the order
      const orderId = await createPendingOrder();
      setPendingOrderId(orderId);

      // Step 2: Initialize payment record in backend
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
    } catch (error: unknown) {
      console.error('Order/Payment initialization error:', error);
      const message =
        typeof error === 'object' && error && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : error instanceof Error
            ? error.message
            : 'Failed to initialize payment. Please try again.';
      toast.error(message);
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
                    } catch (error: unknown) {
                      const message =
                        typeof error === 'object' && error && 'response' in error
                          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
                          : error instanceof Error
                            ? error.message
                            : 'Failed to save delivery information';
                      toast.error(message);
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
                    ref={addressInputRef}
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
                    State<span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={selectedStateCode}
                    onChange={(e) => setSelectedStateCode(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                    disabled={statesLoading}
                  >
                    <option value="">
                      {statesLoading ? 'Loading states...' : 'Select a state'}
                    </option>
                    {deliveryStates.map((state) => (
                      <option key={state.stateCode} value={state.stateCode}>
                        {state.stateName}
                      </option>
                    ))}
                  </select>
                  {statesError && (
                    <p className="text-xs text-red-600 mt-2">{statesError}</p>
                  )}
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

                {requiresWeight && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Package Weight (kg)<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={minWeightKg ?? 0}
                      max={maxWeightKg}
                      step="0.1"
                      value={packageWeightKg}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const parsed = Number(raw);
                        setPackageWeightKg(raw === '' || Number.isNaN(parsed) ? '' : parsed);
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="e.g., 2.5"
                    />
                    {(minWeightKg !== undefined || maxWeightKg !== undefined) && (
                      <p className="text-xs text-gray-500 mt-2">
                        {minWeightKg !== undefined ? `Min: ${minWeightKg}kg` : null}
                        {minWeightKg !== undefined && maxWeightKg !== undefined ? ' · ' : null}
                        {maxWeightKg !== undefined ? `Max: ${maxWeightKg}kg` : null}
                      </p>
                    )}
                  </div>
                )}

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

            {/* Delivery Map & Fee */}
            <div className="bg-white rounded-lg p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Delivery Fee</h3>
                <div className="text-sm text-gray-600">
                  {statesLoading
                    ? 'Loading delivery states...'
                    : !selectedState
                      ? 'Select a state to calculate'
                      : quoteLoading
                        ? 'Calculating delivery fee...'
                        : deliveryQuote
                          ? 'Quote ready'
                          : 'Complete required fields to calculate'}
                </div>
              </div>
              {deliveryError && (
                <div className="text-sm text-red-600">{deliveryError}</div>
              )}
              <div className="p-4 bg-green-50 border border-green-100 rounded-lg">
                <div className="text-sm text-gray-700">
                  Fee:{' '}
                  <span className="font-semibold text-green-700">
                    {deliveryQuote ? `₦${deliveryQuote.fee.toLocaleString()}` : '—'}
                  </span>
                </div>
                {deliveryQuote?.distanceKm !== undefined && (
                  <div className="text-sm text-gray-700">
                    Distance: {deliveryQuote.distanceKm.toFixed(2)} km
                  </div>
                )}
                {deliveryQuote?.breakdown && (
                  <div className="text-xs text-gray-500 mt-2 space-y-1">
                    <div>Base: ₦{deliveryQuote.breakdown.baseFee.toLocaleString()}</div>
                    {deliveryQuote.breakdown.distanceFee !== undefined && (
                      <div>Distance: ₦{Math.round(deliveryQuote.breakdown.distanceFee).toLocaleString()}</div>
                    )}
                    {deliveryQuote.breakdown.weightFee !== undefined && (
                      <div>Weight: ₦{Math.round(deliveryQuote.breakdown.weightFee).toLocaleString()}</div>
                    )}
                  </div>
                )}
              </div>
              {requiresCoordinates ? (
                <div className="h-64 w-full border border-gray-200 rounded-lg overflow-hidden">
                  {mapsApiKey ? (
                    <div ref={mapRef} className="h-full w-full" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-500 text-sm px-4 text-center">
                      Add VITE_GOOGLE_MAPS_API_KEY to enable map & autocomplete.
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-24 w-full border border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-500 text-sm px-4 text-center">
                  Map is available only for distance-based delivery states.
                </div>
              )}
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
                    {quoteLoading
                      ? 'Calculating...'
                      : !deliveryQuote
                        ? 'Pending'
                        : deliveryQuote.fee === 0
                          ? 'Free'
                          : `₦${deliveryQuote.fee.toFixed(2)}`}
                    {deliveryQuote?.distanceKm !== undefined
                      ? ` (${deliveryQuote.distanceKm.toFixed(1)} km)`
                      : null}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold mt-4 pt-4 border-t">
                  <span>Total</span>
                  <span>{hasQuote ? `₦${totalAmount.toFixed(2)}` : '—'}</span>
                </div>
              </div>
              
              {public_key ? (
                <div onClick={handlePaystackClick}>
                  <PaystackButton
                    {...componentProps}
                    className="w-full mt-6 px-6 py-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                    disabled={loading || !formData.email || !hasQuote}
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

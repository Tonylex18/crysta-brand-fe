import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import {
  checkoutAPI,
  deliveryAPI,
  DeliveryInfoPayload,
  formatNaira,
  locationsAPI,
  LocationCity,
  LocationState,
  ShippingOption,
  PricingSnapshot,
  userAPI,
  SavedAddress,
} from './lib/api';
import { appendUserId, getUserId } from '../utils/navigation';

export default function CheckoutPage() {
  const { user } = useAuth();
  const { cartItems, cartSubtotalKobo, cartUpdatedAt } = useCart();
  const navigate = useNavigate();
  const userId = getUserId(user);

  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [pricingSnapshot, setPricingSnapshot] = useState<PricingSnapshot | null>(null);
  const [snapshotVersion, setSnapshotVersion] = useState<number | null>(null);
  const [checkoutStatus, setCheckoutStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [addressSubmitting, setAddressSubmitting] = useState(false);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [states, setStates] = useState<LocationState[]>([]);
  const [statesLoading, setStatesLoading] = useState(false);
  const [cities, setCities] = useState<LocationCity[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(false);

  const [address, setAddress] = useState({
    state: '',
    city: '',
    street: '',
    landmark: '',
    phone: '',
    zipCode: '',
  });
  const [hasDashboardDeliveryInfo, setHasDashboardDeliveryInfo] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (cartItems.length === 0) return;

    const start = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await checkoutAPI.start();
        setCheckoutId(response.checkout_id);
        setPricingSnapshot(response.pricing_snapshot);
        setSnapshotVersion(response.snapshot_version);
        setCheckoutStatus(response.checkout_status);
        setShippingOptions([]);
        setSelectedOptionId('');
      } catch (err: any) {
        setError(err?.response?.data?.error || err?.response?.data?.message || 'Failed to start checkout');
      } finally {
        setLoading(false);
      }
    };

    start();
  }, [user, cartItems.length, cartUpdatedAt]);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    const loadAddressData = async () => {
      setSavedLoading(true);
      try {
        const [savedResponse, deliveryResponse] = await Promise.allSettled([
          userAPI.getAddresses(),
          deliveryAPI.getDeliveryInfo(),
        ]);

        if (!isMounted) return;

        if (savedResponse.status === 'fulfilled') {
          setSavedAddresses(savedResponse.value.addresses || []);
        } else {
          setSavedAddresses([]);
        }

        if (deliveryResponse.status === 'fulfilled' && deliveryResponse.value?.data) {
          const delivery = deliveryResponse.value.data;
          setHasDashboardDeliveryInfo(true);
          setAddress((prev) => {
            const hasUserInput = Boolean(
              prev.state ||
              prev.city ||
              prev.street ||
              prev.landmark ||
              prev.phone ||
              prev.zipCode
            );

            if (hasUserInput) {
              return prev;
            }

            return {
              state: delivery.state || '',
              city: delivery.cityTown || '',
              street: delivery.address || '',
              landmark: '',
              phone: delivery.mobile || '',
              zipCode: delivery.zipCode || '',
            };
          });
        } else {
          setHasDashboardDeliveryInfo(false);
        }
      } finally {
        if (isMounted) {
          setSavedLoading(false);
        }
      }
    };

    loadAddressData();

    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    let isMounted = true;
    const loadStates = async () => {
      try {
        setStatesLoading(true);
        const res = await locationsAPI.getStates();
        if (!isMounted) return;
        setStates(res.states || []);
      } catch {
        if (!isMounted) return;
        setStates([]);
      } finally {
        if (isMounted) {
          setStatesLoading(false);
        }
      }
    };
    loadStates();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadCities = async () => {
      if (!address.state) {
        setCities([]);
        return;
      }
      const selected = states.find((state) => state.name === address.state);
      if (!selected) {
        setCities([]);
        return;
      }
      try {
        setCitiesLoading(true);
        const res = await locationsAPI.getCitiesByStateId(selected.id);
        if (!isMounted) return;
        const nextCities = res.cities || [];
        setCities(nextCities);
        if (address.city && !nextCities.some((city) => city.name === address.city)) {
          setAddress((prev) => ({ ...prev, city: '' }));
        }
      } catch {
        if (!isMounted) return;
        setCities([]);
      } finally {
        if (isMounted) {
          setCitiesLoading(false);
        }
      }
    };
    loadCities();
    return () => {
      isMounted = false;
    };
  }, [address.state, address.city, states]);

  const canSubmitAddress = useMemo(() => {
    return Boolean(address.state && address.city && address.street && address.phone && address.zipCode);
  }, [address]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
          <div className="text-center py-8">
            <h2 className="text-2xl font-bold mb-4">Sign in to checkout</h2>
            <p className="text-gray-600">Please sign in to continue</p>
            <button
              onClick={() => navigate(appendUserId('/auth', userId))}
              className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
            >
              Go to sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <h2 className="text-2xl font-bold">Your cart is empty</h2>
        <p className="text-gray-600 mt-2">Add items to continue checkout.</p>
        <button
          onClick={() => navigate(appendUserId('/', userId))}
          className="mt-6 px-6 py-3 bg-[#00CFFF] text-white rounded-full"
        >
          Shop products
        </button>
      </div>
    );
  }

  const handleAddressSubmit = async () => {
    if (!checkoutId) return;
    setAddressSubmitting(true);
    setError(null);
    try {
      const response = await checkoutAPI.setAddress(checkoutId, {
        state: address.state,
        city: address.city,
        street: address.street,
        landmark: address.landmark || undefined,
        phone: address.phone,
      });
      setShippingOptions(response.available_shipping_options);
      setSelectedOptionId('');
      setPricingSnapshot(response.checkout.pricing_snapshot);
      setSnapshotVersion(response.checkout.snapshot_version);
      setCheckoutStatus(response.checkout.status);

      const checkoutDeliveryPayload: DeliveryInfoPayload = {
        firstName: user?.name?.split(' ')[0] || '',
        lastName: user?.name?.split(' ').slice(1).join(' ') || '',
        email: user?.email || '',
        address: address.street,
        state: address.state,
        cityTown: address.city,
        zipCode: address.zipCode,
        mobile: address.phone,
      };

      try {
        if (hasDashboardDeliveryInfo) {
          await deliveryAPI.updateDeliveryInfo(checkoutDeliveryPayload);
        } else {
          await deliveryAPI.addDeliveryInfo(checkoutDeliveryPayload);
          setHasDashboardDeliveryInfo(true);
        }
      } catch (deliveryError: any) {
        toast.error(
          deliveryError?.response?.data?.message ||
          'Checkout address was saved, but dashboard delivery information could not be updated.'
        );
      }

      try {
        const refreshed = await userAPI.getAddresses();
        setSavedAddresses(refreshed.addresses || []);
      } catch {
        // ignore address refresh errors
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.response?.data?.message || 'Failed to save address');
    } finally {
      setAddressSubmitting(false);
    }
  };

  const handleUseSavedAddress = (saved: SavedAddress) => {
    setAddress((prev) => ({
      state: saved.state || '',
      city: saved.city || '',
      street: saved.street || '',
      landmark: saved.landmark || '',
      phone: saved.phone || '',
      zipCode: prev.zipCode || '',
    }));
  };

  const handleSelectShipping = async (optionId: string) => {
    if (!checkoutId) return;
    setError(null);
    try {
      const response = await checkoutAPI.selectShipping(checkoutId, optionId);
      setSelectedOptionId(optionId);
      setPricingSnapshot(response.checkout.pricing_snapshot);
      setSnapshotVersion(response.checkout.snapshot_version);
      setCheckoutStatus(response.checkout.status);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.response?.data?.message || 'Failed to select shipping');
    }
  };

  const handlePay = async () => {
    if (!checkoutId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await checkoutAPI.initPayment(checkoutId);
      window.location.href = response.authorization_url;
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to initialize payment');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-10 px-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {savedAddresses.length > 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">Saved Addresses</h2>
              <div className="space-y-3">
                {savedAddresses.map((saved, index) => (
                  <div key={saved._id || `${saved.street}-${index}`} className="border rounded-lg p-4 flex items-start justify-between gap-4">
                    <div className="text-sm text-gray-700">
                      <div className="font-medium">
                        {saved.street}, {saved.city}, {saved.state}
                      </div>
                      <div className="text-xs text-gray-500">Phone: {saved.phone}</div>
                      {saved.landmark ? (
                        <div className="text-xs text-gray-500">Landmark: {saved.landmark}</div>
                      ) : null}
                      {saved.is_default ? (
                        <div className="text-xs text-green-600 mt-1">Default address</div>
                      ) : null}
                    </div>
                    <button
                      onClick={() => handleUseSavedAddress(saved)}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Use this address
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : savedLoading ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6 text-sm text-gray-500">
              Loading saved addresses...
            </div>
          ) : null}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4">Step A: Delivery Address</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">State</label>
                <select
                  className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
                  value={address.state}
                  onChange={(event) =>
                    setAddress((prev) => ({ ...prev, state: event.target.value, city: '' }))
                  }
                >
                  <option value="">
                    {statesLoading ? 'Loading states...' : 'Select state'}
                  </option>
                  {states.map((state) => (
                    <option key={state.id} value={state.name}>
                      {state.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">City</label>
                <select
                  className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
                  value={address.city}
                  onChange={(event) => setAddress((prev) => ({ ...prev, city: event.target.value }))}
                  disabled={!address.state || citiesLoading || cities.length === 0}
                >
                  <option value="">
                    {!address.state
                      ? 'Select state first'
                      : citiesLoading
                      ? 'Loading cities...'
                      : 'Select city'}
                  </option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.name}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-600">Street Address</label>
                <input
                  className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
                  value={address.street}
                  onChange={(event) => setAddress((prev) => ({ ...prev, street: event.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Landmark (optional)</label>
                <input
                  className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
                  value={address.landmark}
                  onChange={(event) => setAddress((prev) => ({ ...prev, landmark: event.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Phone</label>
                <input
                  className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
                  value={address.phone}
                  onChange={(event) => setAddress((prev) => ({ ...prev, phone: event.target.value }))}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-600">Zip Code</label>
                <input
                  className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
                  value={address.zipCode}
                  onChange={(event) => setAddress((prev) => ({ ...prev, zipCode: event.target.value }))}
                />
              </div>
            </div>
            <button
              onClick={handleAddressSubmit}
              disabled={!canSubmitAddress || addressSubmitting}
              className="mt-4 px-5 py-2 bg-[#00CFFF] text-white rounded-full disabled:opacity-50"
            >
              {addressSubmitting ? 'Saving...' : 'Save address & get shipping options'}
            </button>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4">Step B: Choose Shipping</h2>
            {shippingOptions.length === 0 ? (
              <p className="text-gray-500 text-sm">
                {checkoutStatus === 'awaiting_payment'
                  ? 'Shipping will be calculated later. You can proceed to payment.'
                  : 'Enter your address to see shipping options.'}
              </p>
            ) : (
              <div className="space-y-3">
                {shippingOptions.map((option) => (
                  <label key={option.option_id} className="flex items-center gap-3 border rounded-lg p-3 cursor-pointer">
                    <input
                      type="radio"
                      name="shipping"
                      checked={selectedOptionId === option.option_id}
                      onChange={() => handleSelectShipping(option.option_id)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium capitalize">{option.service_type}</p>
                          <p className="text-xs text-gray-500">ETA {option.eta_min_days}-{option.eta_max_days} days</p>
                        </div>
                        <p className="font-semibold">{formatNaira(option.price_kobo)}</p>
                      </div>
                      {option.service_type === 'pickup' && option.pickup_hubs?.length ? (
                        <p className="text-xs text-gray-600 mt-1">Pickup: {option.pickup_hubs[0].name}</p>
                      ) : null}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4">Step C: Pay Online</h2>
            <button
              onClick={handlePay}
              disabled={!checkoutId || checkoutStatus !== 'awaiting_payment' || loading}
              className="px-6 py-3 bg-black text-white rounded-full disabled:opacity-50"
            >
              {loading ? 'Redirecting...' : 'Pay with Paystack'}
            </button>
          </div>

          {error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
              {error}
            </div>
          ) : null}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-8">
            <h3 className="font-semibold text-lg mb-4">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Items subtotal</span>
                <span>{formatNaira(pricingSnapshot?.items_subtotal_kobo || cartSubtotalKobo)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>
                  {pricingSnapshot?.shipping_fee_kobo === null || pricingSnapshot?.shipping_fee_kobo === undefined
                    ? '--'
                    : formatNaira(pricingSnapshot.shipping_fee_kobo)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>{formatNaira(pricingSnapshot?.tax_kobo || 0)}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatNaira(pricingSnapshot?.grand_total_kobo || cartSubtotalKobo)}</span>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              Checkout version: {snapshotVersion ?? '--'} • Status: {checkoutStatus || '--'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { deliveryPricingAPI, DeliveryQuoteResponse, DeliveryStateMeta } from './lib/api';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { appendUserId, getUserId } from '../utils/navigation';
import { useNavigate } from 'react-router-dom';

export default function DeliveryFee() {
  const [deliveryStates, setDeliveryStates] = useState<DeliveryStateMeta[]>([]);
  const [statesLoading, setStatesLoading] = useState(false);
  const [statesError, setStatesError] = useState<string | null>(null);
  const [selectedStateCode, setSelectedStateCode] = useState('');
  const [city, setCity] = useState('');
  const [coordinates, setCoordinates] = useState({ lat: '', lng: '' });
  const [packageWeightKg, setPackageWeightKg] = useState<number | ''>('');
  const [includeBreakdown, setIncludeBreakdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DeliveryQuoteResponse | null>(null);
  const { user } = useAuth();
  const userId = getUserId(user);
  const navigate = useNavigate();

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

  useEffect(() => {
    const fetchStates = async () => {
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
    fetchStates();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStateCode) {
      toast.error('Please select a delivery state');
      return;
    }

    let parsedCoordinates: { lat: number; lng: number } | undefined;
    if (requiresCoordinates) {
      const latRaw = coordinates.lat.trim();
      const lngRaw = coordinates.lng.trim();
      if (!latRaw || !lngRaw) {
        toast.error('Please enter valid coordinates');
        return;
      }
      const lat = Number(latRaw);
      const lng = Number(lngRaw);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        toast.error('Please enter valid coordinates');
        return;
      }
      parsedCoordinates = { lat, lng };
    }

    if (requiresWeight) {
      if (typeof parsedWeight !== 'number') {
        toast.error('Please enter the package weight');
        return;
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
        return;
      }
    }

    setLoading(true);
    setResult(null);
    try {
      const res = await deliveryPricingAPI.getQuote({
        customerState: selectedStateCode,
        customerCity: city.trim() || undefined,
        ...(parsedCoordinates ? { coordinates: parsedCoordinates } : {}),
        ...(typeof parsedWeight === 'number' ? { packageWeightKg: parsedWeight } : {}),
        includeBreakdown,
      });
      if (!res.success) throw new Error(res.message || 'Failed to calculate delivery fee');
      setResult(res);
    } catch (err: unknown) {
      const status =
        typeof err === 'object' && err && 'response' in err
          ? (err as { response?: { status?: number } }).response?.status
          : undefined;
      const baseMessage =
        typeof err === 'object' && err && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : err instanceof Error
            ? err.message
            : 'Failed to calculate delivery fee';
      const message =
        status === 429
          ? 'Too many delivery quote requests. Please wait a moment and try again.'
          : status && status >= 500
            ? 'Delivery quote is temporarily unavailable. Please try again later.'
            : baseMessage;
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

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
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State
              </label>
              <select
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
                City (optional)
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Type here..."
              />
            </div>

            {requiresCoordinates && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={coordinates.lat}
                    onChange={(e) => setCoordinates({ ...coordinates, lat: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="9.05785"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={coordinates.lng}
                    onChange={(e) => setCoordinates({ ...coordinates, lng: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="7.49508"
                  />
                </div>
              </div>
            )}

            {requiresWeight && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Package Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min={minWeightKg ?? 0}
                  max={maxWeightKg}
                  value={packageWeightKg}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const parsed = Number(raw);
                    setPackageWeightKg(raw === '' || Number.isNaN(parsed) ? '' : parsed);
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="2.5"
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

            <label className="inline-flex items-center space-x-2 text-sm text-gray-700">
              <input
                type="checkbox"
                className="rounded"
                checked={includeBreakdown}
                onChange={(e) => setIncludeBreakdown(e.target.checked)}
              />
              <span>Include breakdown</span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-70"
            >
              {loading ? 'Calculating...' : 'Calculate Delivery Fee'}
            </button>
          </form>

          {result && result.success && (
            <div className="mt-6 space-y-3">
              <div className="p-4 bg-green-50 border border-green-100 rounded-lg">
                <div className="font-semibold text-gray-800">
                  Fee: ₦{result.fee.toLocaleString()}
                </div>
                {result.distanceKm !== undefined && (
                  <div className="text-gray-700">
                    Distance: {result.distanceKm.toFixed(2)} km
                  </div>
                )}
                {result.breakdown && (
                  <div className="text-xs text-gray-500 mt-2 space-y-1">
                    <div>Base: ₦{result.breakdown.baseFee.toLocaleString()}</div>
                    {result.breakdown.distanceFee !== undefined && (
                      <div>Distance: ₦{Math.round(result.breakdown.distanceFee).toLocaleString()}</div>
                    )}
                    {result.breakdown.weightFee !== undefined && (
                      <div>Weight: ₦{Math.round(result.breakdown.weightFee).toLocaleString()}</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

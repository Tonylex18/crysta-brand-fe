import { useEffect, useMemo, useState } from 'react';
import SectionCard from './SectionCard';
import { toast } from 'react-toastify';
import { deliveryAPI, DeliveryInfo, LocationCity, LocationState, locationsAPI } from '../../pages/lib/api';
import { useAuth } from '../../contexts/AuthContext';

const splitAccountName = (name?: string | null) => {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  const firstName = parts.shift() ?? '';

  return {
    firstName,
    lastName: parts.join(' '),
    fullName: (name || '').trim(),
  };
};

const createEmptyForm = (account: { firstName: string; lastName: string; email: string }): DeliveryInfo => {
  return {
    firstName: account.firstName,
    lastName: account.lastName,
    address: '',
    state: '',
    cityTown: '',
    zipCode: '',
    mobile: '',
    email: account.email,
  };
};

export default function DeliveryAddress() {
  const { user } = useAuth();
  const accountProfile = useMemo(() => {
    const nameParts = splitAccountName(user?.name);

    return {
      ...nameParts,
      email: user?.email || '',
    };
  }, [user?.email, user?.name]);
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | null>(null);
  const [form, setForm] = useState<DeliveryInfo>(() => createEmptyForm(accountProfile));
  const [mode, setMode] = useState<'view' | 'edit' | 'add'>('view');
  const [states, setStates] = useState<LocationState[]>([]);
  const [statesLoading, setStatesLoading] = useState(false);
  const [cities, setCities] = useState<LocationCity[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(false);

  const applyAccountProfile = (value?: Partial<DeliveryInfo> | null): DeliveryInfo => ({
    ...createEmptyForm(accountProfile),
    ...value,
    firstName: accountProfile.firstName,
    lastName: accountProfile.lastName,
    email: accountProfile.email,
    state: value?.state ?? '',
  });

  useEffect(() => {
    deliveryAPI.getDeliveryInfo().then((res) => {
      if (res?.data) {
        const nextForm = applyAccountProfile(res.data);
        setDeliveryInfo(nextForm);
        setForm(nextForm);
        setMode('view');
      } else {
        setDeliveryInfo(null);
        setForm(applyAccountProfile());
        setMode('add');
      }
    }).catch(() => {
      setDeliveryInfo(null);
      setForm(applyAccountProfile());
      setMode('add');
    });
  }, [accountProfile.email, accountProfile.firstName, accountProfile.lastName]);

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
      if (!form.state) {
        setCities([]);
        return;
      }

      const selectedState = states.find((state) => state.name === form.state);
      if (!selectedState) {
        setCities([]);
        return;
      }

      try {
        setCitiesLoading(true);
        const res = await locationsAPI.getCitiesByStateId(selectedState.id);
        if (!isMounted) return;

        const nextCities = res.cities || [];
        setCities(nextCities);

        if (form.cityTown && !nextCities.some((city) => city.name === form.cityTown)) {
          setForm((prev) => ({ ...prev, cityTown: '' }));
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
  }, [form.state, form.cityTown, states]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm((prev) => ({
      ...prev,
      state: e.target.value,
      cityTown: '',
    }));
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm((prev) => ({
      ...prev,
      cityTown: e.target.value,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    let res;
    try {
      if (mode === 'edit') {
        res = await deliveryAPI.updateDeliveryInfo(form);
        if (res?.data) {
          const nextForm = applyAccountProfile(res.data);
          setDeliveryInfo(nextForm);
          setForm(nextForm);
          setMode('view');
          toast.success('Delivery address updated successfully!');
        } else {
          toast.error('Failed to update delivery address.');
        }
      } else {
        res = await deliveryAPI.addDeliveryInfo(form);
        if (res?.data) {
          const nextForm = applyAccountProfile(res.data);
          setDeliveryInfo(nextForm);
          setForm(nextForm);
          setMode('view');
          toast.success('Delivery address added successfully!');
        } else {
          toast.error('Failed to add delivery address.');
        }
      }
    } catch (error: unknown) {
      const message =
        typeof error === 'object' && error && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : error instanceof Error
            ? error.message
            : undefined;
      toast.error(message || 'An error occurred.');
    }
  };

  const handleEdit = () => setMode('edit');
  const handleAddNew = () => {
    setForm(applyAccountProfile());
    setMode('add');
  };
  const handleCancel = () => {
    if (deliveryInfo) {
      setForm(applyAccountProfile(deliveryInfo));
      setMode('view');
    } else {
      setForm(applyAccountProfile());
      setMode('add');
    }
  };

  const isReadOnly = mode === 'view';
  const canSave = Boolean(
    form.mobile &&
    form.address &&
    form.state &&
    form.cityTown &&
    form.zipCode &&
    accountProfile.firstName &&
    accountProfile.email
  );
  const selectClassName = 'w-full px-4 py-3 border border-gray-300 rounded-lg bg-white disabled:bg-gray-100 disabled:text-gray-500';
  const readOnlyClassName = 'w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-lg text-gray-700';

  return (
    <SectionCard
      title="Delivery Address"
      actions={
        deliveryInfo && mode === 'view' ? (
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm" onClick={handleEdit}>Edit</button>
            <button className="px-4 py-2 bg-pink-600 text-white rounded-lg text-sm" onClick={handleAddNew}>Add New Address</button>
          </div>
        ) : null
      }
    >
      <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSave}>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
          <input value={accountProfile.fullName} className={readOnlyClassName} placeholder="Name from your account" readOnly />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
          <input name="mobile" value={form.mobile} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Mobile Number" readOnly={isReadOnly} />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
          <input name="address" value={form.address} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Enter delivery address" readOnly={isReadOnly} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
          <select
            name="state"
            value={form.state ?? ''}
            onChange={handleStateChange}
            className={selectClassName}
            disabled={isReadOnly || statesLoading}
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
          <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
          <select
            name="cityTown"
            value={form.cityTown}
            onChange={handleCityChange}
            className={selectClassName}
            disabled={isReadOnly || !form.state || citiesLoading || cities.length === 0}
          >
            <option value="">
              {!form.state
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Zip Code</label>
          <input name="zipCode" value={form.zipCode} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Zip Code" readOnly={isReadOnly} />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input value={accountProfile.email} className={readOnlyClassName} placeholder="Email from your account" readOnly />
        </div>
        {(mode === 'edit' || mode === 'add') && (
          <div className="md:col-span-2 mt-6 flex gap-2">
            <button type="submit" disabled={!canSave} className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60">Save</button>
            <button type="button" className="px-6 py-3 bg-gray-300 text-gray-700 font-semibold rounded-lg" onClick={handleCancel}>Cancel</button>
          </div>
        )}
      </form>
      {!deliveryInfo && mode === 'add' && (
        <div className="text-gray-500 text-center py-8">No delivery address found. Please add your address.</div>
      )}
    </SectionCard>
  );
}

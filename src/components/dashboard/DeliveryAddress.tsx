import { useEffect, useState } from 'react';
import SectionCard from './SectionCard';
import { deliveryAPI } from '../../lib/api';
import { toast } from 'react-toastify';

type DeliveryInfo = {
  firstName: string;
  lastName: string;
  address: string;
  cityTown: string;
  zipCode: string;
  mobile: string;
  email: string;
};

export default function DeliveryAddress() {
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | null>(null);
  const [form, setForm] = useState<DeliveryInfo>({
    firstName: '',
    lastName: '',
    address: '',
    cityTown: '',
    zipCode: '',
    mobile: '',
    email: '',
  });
  const [mode, setMode] = useState<'view' | 'edit' | 'add'>('view');

  useEffect(() => {
    deliveryAPI.getDeliveryInfo().then((res) => {
      if (res?.data) {
        setDeliveryInfo(res.data);
        setForm(res.data);
        setMode('view');
      } else {
        setDeliveryInfo(null);
        setForm({
          firstName: '',
          lastName: '',
          address: '',
          cityTown: '',
          zipCode: '',
          mobile: '',
          email: '',
        });
        setMode('add');
      }
    }).catch(() => {
      setDeliveryInfo(null);
      setMode('add');
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    let res;
    try {
      if (mode === 'edit') {
        res = await deliveryAPI.updateDeliveryInfo(form);
        if (res?.data) {
          setDeliveryInfo(res.data);
          setForm(res.data);
          setMode('view');
          toast.success('Delivery address updated successfully!');
        } else {
          toast.error('Failed to update delivery address.');
        }
      } else {
        res = await deliveryAPI.addDeliveryInfo(form);
        if (res?.data) {
          setDeliveryInfo(res.data);
          setForm(res.data);
          setMode('view');
          toast.success('Delivery address added successfully!');
        } else {
          toast.error('Failed to add delivery address.');
        }
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'An error occurred.');
    }
  };

  const handleEdit = () => setMode('edit');
  const handleAddNew = () => {
    setForm({
      firstName: '',
      lastName: '',
      address: '',
      cityTown: '',
      zipCode: '',
      mobile: '',
      email: '',
    });
    setMode('add');
  };
  const handleCancel = () => {
    if (deliveryInfo) {
      setForm(deliveryInfo);
      setMode('view');
    } else {
      setMode('add');
    }
  };

  const isReadOnly = mode === 'view';

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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
          <input name="firstName" value={form.firstName} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="First Name" readOnly={isReadOnly} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
          <input name="lastName" value={form.lastName} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Last Name" readOnly={isReadOnly} />
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
          <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
          <input name="cityTown" value={form.cityTown} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="City" readOnly={isReadOnly} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Zip Code</label>
          <input name="zipCode" value={form.zipCode} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Zip Code" readOnly={isReadOnly} />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input name="email" value={form.email} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Email" readOnly={isReadOnly} />
        </div>
        {(mode === 'edit' || mode === 'add') && (
          <div className="md:col-span-2 mt-6 flex gap-2">
            <button type="submit" className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700">Save</button>
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



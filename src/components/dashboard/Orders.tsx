import SectionCard from './SectionCard';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { ordersAPI, formatNaira, Order } from '../../pages/lib/api';

export default function Orders() {
  const [tab, setTab] = useState<'ongoing' | 'cancelled'>('ongoing');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await ordersAPI.list();
      const data = Array.isArray(response?.orders) ? response.orders : [];
      const filteredOrders = tab === 'cancelled'
        ? data.filter((order) => order.status === 'cancelled')
        : data.filter((order) => order.status !== 'cancelled');
      setOrders(filteredOrders);
    } catch (error: unknown) {
      console.error('Failed to fetch orders:', error);
      toast.error('Failed to load orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending_fulfillment':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusBadge = (status?: string) => {
    if (!status) return null;
    
    const colors = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-emerald-100 text-emerald-800',
      refund_pending: 'bg-yellow-100 text-yellow-800',
      refund_failed: 'bg-red-100 text-red-800',
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || ''}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const getRefundMessage = (status?: string) => {
    if (status === 'refund_pending') {
      return 'Your refund is being processed. This may take a few business days.';
    }
    if (status === 'refunded') {
      return 'Your refund has been completed.';
    }
    if (status === 'refund_failed') {
      return 'There was an issue processing your refund. Please contact support.';
    }
    return null;
  };

  // const ongoingCount = orders.filter(order => order.status !== 'cancelled').length;
  // const cancelledCount = orders.filter(order => order.status === 'cancelled').length;

  return (
    <SectionCard title="My Orders">
      <div className="flex items-center space-x-8 border-b">
        <button
          className={`pb-2 -mb-px ${tab === 'ongoing' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-500'}`}
          onClick={() => setTab('ongoing')}
        >
          ONGOING / DELIVERED
        </button>
        <button
          className={`pb-2 -mb-px ${tab === 'cancelled' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-500'}`}
          onClick={() => setTab('cancelled')}
        >
          CANCELLED
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-600">
          <div className="text-lg font-medium mb-2">Loading orders...</div>
        </div>
      ) : orders.length === 0 ? (
        <div className="py-16 text-center text-gray-600">
          <div className="text-lg font-medium mb-2">No transaction history.</div>
          <div>You have not made any purchase recently.</div>
        </div>
      ) : (
        <div className="space-y-6 mt-6">
          {orders.map((order) => (
            <div key={order._id} className="border rounded-lg p-6 bg-white">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">
                      Order #{order._id.slice(-8).toUpperCase()}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(order.status)}`}>
                      {order.status.replace('_', ' ').toUpperCase()}
                    </span>
                    {getPaymentStatusBadge(order.payment?.status || order.payment_status)}
                  </div>
                  <p className="text-sm text-gray-600">
                    Placed on {new Date(order.createdAt || Date.now()).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  {getRefundMessage(order.payment?.status || order.payment_status) ? (
                    <p className="text-xs text-gray-600 mt-1">
                      {getRefundMessage(order.payment?.status || order.payment_status)}
                    </p>
                  ) : null}
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{formatNaira(order.totals?.grand_total_kobo || 0)}</p>
                </div>
              </div>

	              <div className="border-t pt-4 space-y-3">
	                {order.items?.map((item) => (
	                  <div
	                    key={`${order._id}-${item.id || item._id || item.product_id}-${item.selected_size || 'na'}-${item.selected_color || 'na'}`}
	                    className="flex items-center gap-4"
	                  >
	                    <div className="flex-1">
	                      <h4 className="font-medium">{item.name}</h4>
	                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
	                      {(item.selected_color || item.selected_size) ? (
	                        <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-medium text-gray-600">
	                          {item.selected_color ? (
	                            <span className="rounded-full bg-gray-100 px-2.5 py-1">Color: {item.selected_color}</span>
	                          ) : null}
	                          {item.selected_size ? (
	                            <span className="rounded-full bg-gray-100 px-2.5 py-1">Size: {item.selected_size}</span>
	                          ) : null}
	                        </div>
	                      ) : null}
	                    </div>
	                    <div className="text-right">
	                      <p className="font-medium">{formatNaira((item.price_kobo || 0) * item.quantity)}</p>
	                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 mt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 mb-1">Shipping Address</p>
                    <p className="font-medium">
                      {order.address?.street}
                    </p>
                    <p className="text-gray-600">
                      {order.address?.city}, {order.address?.state}
                    </p>
                    <p className="text-gray-600">
                      Phone: {order.address?.phone}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

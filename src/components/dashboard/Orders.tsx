import SectionCard from './SectionCard';
import { useState, useEffect } from 'react';
import { ordersAPI, resolveImageUrl } from '../../lib/api';
import { toast } from 'react-toastify';

interface OrderItem {
  _id: string;
  product_id: {
    _id: string;
    name: string;
    image_url: string;
    price: number;
  };
  quantity: number;
  color?: string;
  size?: string;
  price: number;
  subtotal: number;
}

interface Order {
  _id: string;
  orderNumber?: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  totalAmount?: number;
  total: number;
  shipping_address: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod?: string;
  items: OrderItem[];
  createdAt: string;
}

export default function Orders() {
  const [tab, setTab] = useState<'ongoing' | 'cancelled'>('ongoing');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, [tab]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await ordersAPI.getOrders();
      if (response.success && response.data) {
        // Filter orders based on tab
        const filteredOrders = tab === 'cancelled'
          ? response.data.filter((order: Order) => order.status === 'cancelled')
          : response.data.filter((order: Order) => order.status !== 'cancelled');
        setOrders(filteredOrders);
      }
    } catch (error: any) {
      console.error('Failed to fetch orders:', error);
      toast.error('Failed to load orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (orderId: string) => {
    try {
      await ordersAPI.cancelOrder(orderId);
      toast.success('Order cancelled successfully');
      fetchOrders();
    } catch (error) {
      console.error('Failed to cancel order:', error);
      toast.error('Failed to cancel order');
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
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
      refunded: 'bg-gray-100 text-gray-800',
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || ''}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const ongoingCount = orders.filter(order => order.status !== 'cancelled').length;
  const cancelledCount = orders.filter(order => order.status === 'cancelled').length;

  return (
    <SectionCard title="My Orders">
      <div className="flex items-center space-x-8 border-b">
        <button
          className={`pb-2 -mb-px ${tab === 'ongoing' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-500'}`}
          onClick={() => setTab('ongoing')}
        >
          ONGOING / DELIVERED ({ongoingCount})
        </button>
        <button
          className={`pb-2 -mb-px ${tab === 'cancelled' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-500'}`}
          onClick={() => setTab('cancelled')}
        >
          CANCELLED ({cancelledCount})
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
                      Order #{order.orderNumber || order._id.slice(-8).toUpperCase()}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(order.status)}`}>
                      {order.status.toUpperCase()}
                    </span>
                    {getPaymentStatusBadge(order.paymentStatus)}
                  </div>
                  <p className="text-sm text-gray-600">
                    Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">₦{order.totalAmount || order.total}</p>
                  {order.paymentMethod && (
                    <p className="text-sm text-gray-600">{order.paymentMethod}</p>
                  )}
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                {order.items?.map((item) => (
                  <div key={item._id} className="flex items-center gap-4">
                    <img
                      src={resolveImageUrl(item.product_id?.image_url)}
                      alt={item.product_id?.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium">{item.product_id?.name}</h4>
                      <p className="text-sm text-gray-600">
                        {item.color && <span>Color: {item.color} </span>}
                        {item.size && <span>Size: {item.size} </span>}
                      </p>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₦{item.subtotal || (item.price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 mt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 mb-1">Shipping Address</p>
                    <p className="font-medium">
                      {order.shipping_address?.name}
                    </p>
                    <p className="text-gray-600">
                      {order.shipping_address?.address}
                    </p>
                    <p className="text-gray-600">
                      {order.shipping_address?.city}, {order.shipping_address?.state} {order.shipping_address?.zip}
                    </p>
                  </div>
                  {tab === 'ongoing' && order.status !== 'delivered' && order.status !== 'cancelled' && (
                    <div className="flex items-end">
                      <button
                        onClick={() => cancelOrder(order._id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                      >
                        Cancel Order
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

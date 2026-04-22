import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CreditCard, MapPin, Package, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import SectionCard from './SectionCard';
import { deliveryAPI, DeliveryInfo, formatNaira, Order, ordersAPI } from '../../pages/lib/api';

type DashboardOverviewProps = {
  userName?: string | null;
  userEmail?: string | null;
  onNavigate: (key: 'orders' | 'address' | 'account') => void;
};

const getOrderStatus = (order: Order) => (order.order_status || order.status || '').toLowerCase();
const getPaymentStatus = (order: Order) => (order.payment_status || order.payment?.status || '').toLowerCase();

export default function DashboardOverview({
  userName,
  userEmail,
  onNavigate,
}: DashboardOverviewProps) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const [ordersResponse, deliveryResponse] = await Promise.allSettled([
          ordersAPI.list(),
          deliveryAPI.getDeliveryInfo(),
        ]);

        if (!mounted) return;

        if (ordersResponse.status === 'fulfilled') {
          setOrders(Array.isArray(ordersResponse.value?.orders) ? ordersResponse.value.orders : []);
        } else {
          setOrders([]);
          toast.error('Failed to load dashboard orders');
        }

        if (deliveryResponse.status === 'fulfilled' && deliveryResponse.value?.data) {
          setDeliveryInfo(deliveryResponse.value.data);
        } else {
          setDeliveryInfo(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadDashboardData();

    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const ongoing = orders.filter((order) => !['cancelled', 'delivered'].includes(getOrderStatus(order))).length;
    const delivered = orders.filter((order) => getOrderStatus(order) === 'delivered').length;
    const refundIssues = orders.filter((order) => ['refund_pending', 'refund_failed'].includes(getPaymentStatus(order))).length;
    const refundedCount = orders.filter((order) => getPaymentStatus(order) === 'refunded').length;
    const totalSpendKobo = orders.reduce((sum, order) => {
      const orderStatus = getOrderStatus(order);
      const paymentStatus = getPaymentStatus(order);

      if (orderStatus !== 'delivered') {
        return sum;
      }

      if (paymentStatus === 'refunded' || paymentStatus === 'refund_pending' || paymentStatus === 'refund_failed') {
        return sum;
      }

      return sum + (order.totals?.grand_total_kobo || 0);
    }, 0);

    return [
      {
        label: 'Total Orders',
        value: String(orders.length),
        icon: ShoppingBag,
        accent: 'from-[#12108b] to-[#3f2fe6]',
      },
      {
        label: 'Active Orders',
        value: String(ongoing),
        icon: Package,
        accent: 'from-amber-500 to-orange-500',
      },
      {
        label: 'Delivered',
        value: String(delivered),
        icon: CreditCard,
        accent: 'from-emerald-500 to-teal-500',
      },
      {
        label: 'Total Spend',
        value: formatNaira(totalSpendKobo),
        icon: MapPin,
        accent: refundIssues > 0 ? 'from-rose-500 to-pink-500' : 'from-fuchsia-500 to-violet-500',
        helper:
          refundIssues > 0
            ? `${refundIssues} refund issue${refundIssues > 1 ? 's' : ''}`
            : refundedCount > 0
              ? `Net of ${refundedCount} refunded order${refundedCount > 1 ? 's' : ''}`
              : 'Delivered orders only',
      },
    ];
  }, [orders]);

  const recentOrders = useMemo(() => orders.slice(0, 4), [orders]);

  return (
    <div className="space-y-6">
      <SectionCard title={`Welcome back${userName ? `, ${userName}` : ''}`}>
        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <div className="rounded-2xl bg-[linear-gradient(135deg,#12108b_0%,#4338ca_55%,#8b5cf6_100%)] p-6 text-white">
            <p className="text-sm uppercase tracking-[0.3em] text-white/70">Account Snapshot</p>
            <h2 className="mt-3 text-3xl font-semibold">Manage your orders, addresses, and profile from one place.</h2>
            <p className="mt-3 max-w-2xl text-sm text-white/80">
              Track active deliveries, confirm your saved details, and jump straight to the section you need.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => onNavigate('orders')}
                className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#12108b] transition hover:bg-white/90"
              >
                View Orders
              </button>
              <button
                type="button"
                onClick={() => onNavigate('address')}
                className="rounded-full border border-white/30 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Manage Address
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">Profile</p>
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-semibold text-gray-900">{userName || 'Not set'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900 break-all">{userEmail || 'Not set'}</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('account')}
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#12108b] hover:text-[#2d2ab0]"
              >
                Update account
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{item.label}</p>
                  <p className="mt-3 text-2xl font-semibold text-gray-900">{loading ? '...' : item.value}</p>
                  <p className="mt-2 text-xs text-gray-400">{item.helper || 'Updated from your account data'}</p>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${item.accent} text-white`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <SectionCard
          title="Recent Orders"
          actions={
            <button
              type="button"
              onClick={() => onNavigate('orders')}
              className="text-sm font-semibold text-[#12108b] hover:text-[#2d2ab0]"
            >
              View all
            </button>
          }
        >
          {loading ? (
            <div className="py-10 text-sm text-gray-500">Loading order summary...</div>
          ) : recentOrders.length === 0 ? (
            <div className="py-10 text-sm text-gray-500">No orders yet. Your recent purchases will appear here.</div>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order._id} className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">Order #{order._id.slice(-8).toUpperCase()}</p>
                    <p className="mt-1 text-sm text-gray-500">
                      {new Date(order.createdAt || Date.now()).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-gray-400">
                      {getOrderStatus(order).replace(/_/g, ' ') || 'pending'}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="font-semibold text-gray-900">{formatNaira(order.totals?.grand_total_kobo || 0)}</p>
                    <p className="mt-1 text-sm text-gray-500">
                      {order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0} item(s)
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Delivery Details"
          actions={
            <button
              type="button"
              onClick={() => onNavigate('address')}
              className="text-sm font-semibold text-[#12108b] hover:text-[#2d2ab0]"
            >
              Manage
            </button>
          }
        >
          {loading ? (
            <div className="py-10 text-sm text-gray-500">Loading address...</div>
          ) : deliveryInfo ? (
            <div className="space-y-3 text-sm text-gray-600">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">Recipient</p>
                <p className="mt-1 font-semibold text-gray-900">
                  {userName || [deliveryInfo.firstName, deliveryInfo.lastName].filter(Boolean).join(' ')}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">Address</p>
                <p className="mt-1 text-gray-700">{deliveryInfo.address}</p>
                <p className="text-gray-700">
                  {[deliveryInfo.cityTown, deliveryInfo.state].filter(Boolean).join(', ')}
                  {deliveryInfo.zipCode ? ` • ${deliveryInfo.zipCode}` : ''}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">Contact</p>
                <p className="mt-1 text-gray-700">{deliveryInfo.mobile}</p>
                <p className="text-gray-700 break-all">{userEmail || deliveryInfo.email}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 py-6 text-sm text-gray-500">
              <p>No delivery address saved yet.</p>
              <button
                type="button"
                onClick={() => onNavigate('address')}
                className="inline-flex items-center gap-2 rounded-full bg-[#12108b] px-4 py-2 text-sm font-semibold text-white hover:bg-[#211eb0]"
              >
                Add address
              </button>
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard title="Quick Actions">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <button
            type="button"
            onClick={() => onNavigate('orders')}
            className="rounded-2xl border border-gray-200 bg-white px-4 py-4 text-left transition hover:border-[#12108b] hover:bg-[#f7f7ff]"
          >
            <p className="font-semibold text-gray-900">Track an order</p>
            <p className="mt-1 text-sm text-gray-500">Check fulfilment, delivery, and payment status.</p>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('address')}
            className="rounded-2xl border border-gray-200 bg-white px-4 py-4 text-left transition hover:border-[#12108b] hover:bg-[#f7f7ff]"
          >
            <p className="font-semibold text-gray-900">Update delivery info</p>
            <p className="mt-1 text-sm text-gray-500">Keep your saved address current for faster checkout.</p>
          </button>
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="rounded-2xl border border-gray-200 bg-white px-4 py-4 text-left transition hover:border-[#12108b] hover:bg-[#f7f7ff]"
          >
            <p className="font-semibold text-gray-900">Continue shopping</p>
            <p className="mt-1 text-sm text-gray-500">Browse the latest products and new arrivals.</p>
          </button>
        </div>
      </SectionCard>
    </div>
  );
}

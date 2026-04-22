import type { ComponentType } from 'react';
import {
  CreditCard,
  LayoutDashboard,
  MapPin,
  ShoppingBag,
  Star,
  Trash2,
  UserCircle2,
} from 'lucide-react';

export type SidebarKey = 'dashboard' | 'account' | 'address' | 'orders' | 'ratings' | 'wallet' | 'delete';
type SidebarItem = { key: SidebarKey; label: string; badge?: number; icon: ComponentType<{ className?: string }> };

export default function Sidebar({
  current,
  onSelect,
  badges,
}: {
  current: SidebarKey;
  onSelect: (key: SidebarKey) => void;
  badges?: Partial<Record<SidebarKey, number>>;
}) {
  const groups: { title: string; items: SidebarItem[] }[] = [
    {
      title: 'My Profile',
      items: [
        { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { key: 'account', label: 'Account Information', icon: UserCircle2 },
        { key: 'address', label: 'Delivery Address', icon: MapPin },
      ],
    },
    {
      title: 'My Orders',
      items: [
        { key: 'orders', label: 'Order History', icon: ShoppingBag },
        { key: 'ratings', label: 'Ratings', badge: 0, icon: Star },
      ],
    },
    {
      title: 'My Wallet',
      items: [{ key: 'wallet', label: 'Wallet', icon: CreditCard }],
    },
    {
      title: 'Delete Account',
      items: [{ key: 'delete', label: 'Delete Account', icon: Trash2 }],
    },
  ];

  return (
    <aside className="bg-white rounded-xl border border-gray-200 p-2 sm:p-3 lg:p-4">
      <nav className="space-y-6">
        {groups.map((group) => (
          <div key={group.title}>
            <div className="mb-2 hidden text-lg font-semibold text-gray-900 lg:block">{group.title}</div>
            <div className="space-y-1">
              {group.items.map((item) => {
                const badgeValue = badges?.[item.key] ?? item.badge;
                return (
                <button
                  key={item.key}
                  onClick={() => onSelect(item.key)}
                  title={item.label}
                  aria-label={item.label}
                  className={`group relative flex w-full items-center justify-center rounded-xl px-2 py-3 text-left font-medium transition-colors lg:justify-between lg:px-4 ${
                    current === item.key ? 'bg-pink-50 text-pink-600' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <item.icon className="h-5 w-5 shrink-0" />
                    <span className="hidden lg:inline">{item.label}</span>
                  </span>
                  {typeof badgeValue === 'number' && badgeValue > 0 && (
                    <>
                      <span className="absolute right-2 top-2 inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-pink-500 px-1 text-[10px] font-semibold text-white lg:hidden">
                        {badgeValue}
                      </span>
                      <span className="ml-2 hidden min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-pink-500 px-1 text-[10px] font-semibold text-white lg:inline-flex">
                        {badgeValue}
                      </span>
                    </>
                  )}
                </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}

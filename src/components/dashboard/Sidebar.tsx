type SidebarItem = { key: string; label: string; badge?: number };

export default function Sidebar({ current, onSelect }: { current: string; onSelect: (key: string) => void }) {
  const groups: { title: string; items: SidebarItem[] }[] = [
    {
      title: 'My Profile',
      items: [
        { key: 'account', label: 'Account Information' },
        { key: 'address', label: 'Delivery Address' },
      ],
    },
    {
      title: 'My Orders',
      items: [
        { key: 'orders', label: 'Order History' },
        { key: 'ratings', label: 'Pending Ratings', badge: 0 },
      ],
    },
    {
      title: 'My Wallet',
      items: [{ key: 'wallet', label: 'Wallet' }],
    },
    {
      title: 'Delete Account',
      items: [{ key: 'delete', label: 'Delete Account' }],
    },
  ];

  return (
    <aside className="bg-white rounded-xl border border-gray-200 p-4">
      <nav className="space-y-6">
        {groups.map((group) => (
          <div key={group.title}>
            <div className="text-lg font-semibold text-gray-900 mb-2">{group.title}</div>
            <div className="space-y-1">
              {group.items.map((item) => (
                <button
                  key={item.key}
                  onClick={() => onSelect(item.key)}
                  className={`w-full flex items-center justify-between text-left px-4 py-2 rounded-lg font-medium ${
                    current === item.key ? 'bg-pink-50 text-pink-600' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>{item.label}</span>
                  {typeof item.badge === 'number' && (
                    <span className="ml-2 inline-block w-2 h-2 rounded-full bg-gray-400" />
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}



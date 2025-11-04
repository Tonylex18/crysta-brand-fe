import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/dashboard/Sidebar';
import AccountInfo from '../components/dashboard/AccountInfo';
import DeliveryAddress from '../components/dashboard/DeliveryAddress';
import Orders from '../components/dashboard/Orders';
import Wallet from '../components/dashboard/Wallet';
import DeleteAccount from '../components/dashboard/DeleteAccount';

export default function Dashboard() {
	const { user, loading } = useAuth();
	const [active, setActive] = useState<'account' | 'address' | 'orders' | 'ratings' | 'wallet' | 'delete'>('account');
	const [name, setName] = useState(user?.name || '');
	const [email] = useState(user?.email || '');

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<p>Loading...</p>
			</div>
		);
	}

	if (!user) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<p>Please log in to view your dashboard.</p>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
				<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
					<div className="lg:col-span-1">
						<Sidebar current={active} onSelect={(k) => setActive(k as any)} />
					</div>
					<div className="lg:col-span-3 space-y-6">
						{active === 'account' && (
							<AccountInfo name={name} setName={setName} email={email} />
						)}
						{active === 'address' && <DeliveryAddress />}
						{active === 'orders' && <Orders />}
						{active === 'wallet' && <Wallet />}
						{active === 'delete' && <DeleteAccount />}
					</div>
				</div>
			</div>
		</div>
	);
}

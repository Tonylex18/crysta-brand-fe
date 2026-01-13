import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Sidebar, { SidebarKey } from '../components/dashboard/Sidebar';
import AccountInfo from '../components/dashboard/AccountInfo';
import DeliveryAddress from '../components/dashboard/DeliveryAddress';
import Orders from '../components/dashboard/Orders';
import Wallet from '../components/dashboard/Wallet';
import DeleteAccount from '../components/dashboard/DeleteAccount';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { appendUserId, getUserId } from '../utils/navigation';

export default function Dashboard() {
	const { user, loading } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();
	const [searchParams] = useSearchParams();
	const userId = useMemo(() => getUserId(user), [user]);

	const sectionFromUrl = (searchParams.get('section') as SidebarKey | null) || 'account';

	const [active, setActive] = useState<SidebarKey>(sectionFromUrl);
	const [name, setName] = useState(user?.name || '');
	const [email] = useState(user?.email || '');

	useEffect(() => {
		if (sectionFromUrl !== active) {
			setActive(sectionFromUrl);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [sectionFromUrl]);

	const handleSectionChange = (key: SidebarKey) => {
		setActive(key);
		const params = new URLSearchParams(location.search);
		params.set('section', key);
		const search = params.toString();
		navigate(appendUserId(`/dashboard?${search}`, userId));
	};

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
						<Sidebar current={active} onSelect={handleSectionChange} />
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

import SectionCard from './SectionCard';

export default function AccountInfo({ name, setName, email }: { name: string; setName: (v: string) => void; email: string }) {
  return (
    <SectionCard title="Account Information">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
          <input
            type="text"
            value={name.split(' ')[0] || ''}
            onChange={(e) => setName(`${e.target.value} ${name.split(' ').slice(1).join(' ')}`.trim())}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            placeholder="First Name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
          <input
            type="text"
            value={name.split(' ').slice(1).join(' ')}
            onChange={(e) => setName(`${name.split(' ')[0] || ''} ${e.target.value}`.trim())}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            placeholder="Last Name"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
          <input value={email} readOnly className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-lg" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
          <input type="password" className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
          <input type="password" className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="" />
        </div>
      </div>
      <div className="mt-4">
        <button className="px-6 py-3 bg-pink-600 text-white font-semibold rounded-lg hover:bg-pink-700">Save Changes</button>
      </div>
    </SectionCard>
  );
}



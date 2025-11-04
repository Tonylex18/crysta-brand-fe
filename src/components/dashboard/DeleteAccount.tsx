import SectionCard from './SectionCard';

export default function DeleteAccount() {
  return (
    <SectionCard title="Delete Account">
      <div className="space-y-4">
        <p className="text-gray-600">This action is irreversible. All your data will be removed.</p>
        <button className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700">Delete Account</button>
      </div>
    </SectionCard>
  );
}



import feature1 from '../assets/features/f1.png';
import feature2 from '../assets/features/f2.png';
import feature3 from '../assets/features/f3.png';
import feature4 from '../assets/features/f4.png';
import feature5 from '../assets/features/f5.png';
import feature6 from '../assets/features/f6.png';

const features = [
  { img: feature1, label: 'Free Shipping', bg: 'bg-pink-100', text: 'text-pink-700' },
  { img: feature2, label: 'Online Order', bg: 'bg-green-100', text: 'text-green-700' },
  { img: feature3, label: 'Save Money', bg: 'bg-blue-100', text: 'text-blue-700' },
  { img: feature4, label: 'Promotions', bg: 'bg-indigo-100', text: 'text-indigo-700' },
  { img: feature5, label: 'Happy Sell', bg: 'bg-purple-100', text: 'text-purple-700' },
  { img: feature6, label: 'F24/7 Support', bg: 'bg-emerald-100', text: 'text-emerald-700' },
];

const Features = () => {
  return (
    <section className="pt-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6">
          {features.map((feature, idx) => (
            <div
              key={feature.label}
              className="flex flex-col items-center justify-center bg-white rounded-xl shadow border p-6"
            >
              <img
                src={feature.img}
                alt={feature.label}
                className="w-20 h-20 object-contain mb-4"
              />
              <span
                className={`px-3 py-1 rounded font-semibold ${feature.bg} ${feature.text} text-base`}
              >
                {feature.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
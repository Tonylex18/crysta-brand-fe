import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import image1 from '../assets/products/f1.jpg';
import image2 from '../assets/products/f2.jpg';
import image3 from '../assets/products/f7.jpg';
import image4 from '../assets/products/n4.jpg';

// Dummy category type
type Category = {
  id: number;
  name: string;
  description: string;
  image_url: string;
};

export default function Collections() {
  const [categories] = useState<Category[]>([
    {
      id: 1,
      name: 'Wireless Collection',
      description: 'Explore our wireless headphones and earbuds for ultimate freedom.',
      image_url: image1,
    },
    {
      id: 2,
      name: 'Studio Collection',
      description: 'Professional studio headphones for creators and audiophiles.',
      image_url: image2,
    },
    {
      id: 3,
      name: 'Gaming Collection',
      description: 'Headsets and accessories for immersive gaming experiences.',
      image_url: image3,
    },
    {
      id: 4,
      name: 'Bluetooth Collection',
      description: 'Compact Bluetooth devices for music on the go.',
      image_url: image4,
    },
    // ...add more collections as needed...
  ]);
  const [loading] = useState(false);

  return (
    <section id="collections" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Our Collections
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Explore our diverse range of styles for every occasion
          </p>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-2xl mb-4" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group cursor-pointer rounded-2xl transition-all"
              >
                <div className="relative aspect-square rounded-2xl overflow-hidden mb-4 flex items-center justify-center">
                  <img
                    src={category.image_url}
                    alt={category.name}
                    className="w-full h-full object-contain transition-transform duration-500"
                  />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 text-lg">
                  {category.name}
                </h3>
                <p className="text-gray-500 text-sm mb-4">{category.description}</p>
                <button className="w-fit px-4 py-2 rounded-full border text-black font-semibold hover:bg-gray-200 transition-all flex items-center gap-2">
                  Shop Now
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
